#!/usr/bin/env node
require("dotenv").config();

const { runOnce } = require("../cli/strategies/arb-runner");
const { getWatchlist } = require("../cli/watchlist-registry");

const DEFAULT_INTERVAL_SEC = 60;
const MIN_INTERVAL_SEC = 5;

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

function parseArgs(argv) {
  const out = {};

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) continue;

    const [key, inline] = part.slice(2).split("=");
    const next = inline ?? argv[i + 1];

    switch (key) {
      case "once":
        out.once = true;
        break;
      case "intervalSec":
        out.intervalSec = Number(next);
        if (inline === undefined) i += 1;
        break;
      case "consoleAlerts":
        out.consoleAlerts = parseBool(next, true);
        if (inline === undefined) i += 1;
        break;
      case "webhook":
        out.webhookUrl = next;
        if (inline === undefined) i += 1;
        break;
      default:
        break;
    }
  }

  return out;
}

function getRuntimeConfig(cliArgs = {}) {
  const env = process.env;

  return {
    once: Boolean(cliArgs.once),
    intervalSec:
      Number.isFinite(cliArgs.intervalSec)
        ? cliArgs.intervalSec
        : Number(env.WATCHLIST_INTERVAL_SEC),
    consoleAlerts:
      cliArgs.consoleAlerts ?? parseBool(env.WATCHLIST_ALERT_CONSOLE, true),
    webhookUrl: cliArgs.webhookUrl || env.WATCHLIST_ALERT_WEBHOOK_URL || "",
  };
}

function normalizeInterval(value) {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_INTERVAL_SEC;
  return Math.max(MIN_INTERVAL_SEC, Math.floor(value));
}

function summarize(result) {
  const opportunities = result.opportunities || [];
  return {
    triggeredCount: opportunities.length,
    topGapPct: opportunities[0]?.gapPct ?? 0,
    labels: opportunities.map((x) => x.label),
    metrics: result.metrics,
  };
}

async function sendWebhook(webhookUrl, payload) {
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Webhook failed (${response.status}): ${body || "no body"}`);
  }
}

async function runCycle(runtimeConfig) {
  const watchlist = getWatchlist();
  const pairs = Array.isArray(watchlist.pairs) ? watchlist.pairs : [];
  const thresholdPct = Number(watchlist.thresholdPct ?? 1);

  const result = await runOnce({ pairs, thresholdPct });
  const summary = summarize(result);

  if (runtimeConfig.consoleAlerts) {
    if (summary.triggeredCount > 0) {
      console.log(
        `[watchlist] ${summary.triggeredCount} opportunities (top ${summary.topGapPct.toFixed(4)}%) :: ${summary.labels.join(", ")}`
      );
    } else {
      console.log(
        `[watchlist] no opportunities across ${summary.metrics.pairCount} pair(s) @ threshold ${thresholdPct}%`
      );
    }
  }

  if (runtimeConfig.webhookUrl && summary.triggeredCount > 0) {
    await sendWebhook(runtimeConfig.webhookUrl, {
      type: "watchlist.triggered",
      timestamp: new Date().toISOString(),
      thresholdPct,
      summary,
      opportunities: result.opportunities,
    });
  }

  return { watchlist, result, summary };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const cliArgs = parseArgs(process.argv.slice(2));
  const runtimeConfig = getRuntimeConfig(cliArgs);

  let stopped = false;
  const stop = (signal) => {
    if (stopped) return;
    stopped = true;
    console.log(`[watchlist] received ${signal}, exiting scheduler...`);
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  console.log("[watchlist] scheduler started");
  console.log(
    `[watchlist] hooks: console=${runtimeConfig.consoleAlerts ? "on" : "off"}, webhook=${
      runtimeConfig.webhookUrl ? "configured" : "off"
    }`
  );

  do {
    try {
      const { watchlist } = await runCycle(runtimeConfig);

      if (runtimeConfig.once) break;

      const configuredInterval = runtimeConfig.intervalSec || Number(watchlist.intervalSec);
      const intervalSec = normalizeInterval(configuredInterval);
      console.log(`[watchlist] next scan in ${intervalSec}s`);
      await sleep(intervalSec * 1000);
    } catch (error) {
      console.error(`[watchlist] cycle failed: ${error.message}`);
      if (runtimeConfig.once) throw error;
      await sleep(DEFAULT_INTERVAL_SEC * 1000);
    }
  } while (!stopped);

  console.log("[watchlist] scheduler stopped");
}

main().catch((error) => {
  console.error(`[watchlist] fatal: ${error.message}`);
  process.exitCode = 1;
});
