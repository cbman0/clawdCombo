require("dotenv").config();

const express = require("express");
const path = require("path");
const { listWallets, createWallet } = require("../cli/wallets");
const { transferAmoy, nativeBalance, tokenBalance, quoteSwap } = require("../cli/amoy");
const { readTxLog } = require("../cli/store");
const { scanPairGap } = require("../cli/arb");
const { scanWatchlist } = require("../cli/strategies/arb-watchlist");
const { runOnce } = require("../cli/strategies/arb-runner");
const { getWatchlist, saveWatchlist } = require("../cli/watchlist-registry");
const { compileStrategy, validateStrategy } = require("../cli/strategies/compiler");
const { readCatalog, fetchTop200, saveCatalog } = require("../cli/catalog");
const { executeSwap } = require("../cli/swap-exec");
const { PriceOracleService } = require("../cli/services/PriceOracleService");
const { TokenRegistryService } = require("../cli/services/TokenRegistryService");

const app = express();
const PORT = process.env.UI_PORT || 4173;
const HOST = process.env.UI_HOST || "0.0.0.0";
const priceOracleService = new PriceOracleService();
const tokenRegistryService = new TokenRegistryService();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function safeAsync(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      res.json({ ok: true, result });
    } catch (e) {
      res.status(400).json({ ok: false, error: e.message });
    }
  };
}

app.get("/healthz", (req, res) => {
  res.json({ ok: true, service: "clawdCombo-ui", host: HOST, port: Number(PORT) });
});

app.get(
  "/api/status",
  safeAsync(async () => ({
    wallets: listWallets(),
    tokens: tokenRegistryService.list(),
    presets: { low: "0.0001", medium: "0.001", high: "0.002" },
    envLoaded: {
      amoyRpc: !!process.env.AMOY_RPC_URL,
      deployerPk: !!(process.env.FUNDER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY),
      backupPassword: !!process.env.WALLET_BACKUP_PASSWORD,
      liveSwap: process.env.ENABLE_LIVE_SWAP === "true",
    },
    watchlist: getWatchlist(),
    catalog: readCatalog(),
  }))
);

app.post("/api/wallet/create", safeAsync(async (req) => createWallet(req.body?.alias)));
app.get("/api/wallet/list", safeAsync(async () => ({ wallets: listWallets() })));
app.get("/api/tx/history", safeAsync(async () => ({ items: readTxLog() })));

app.post(
  "/api/transfer",
  safeAsync(async (req) => {
    const { fromAlias = "devA", toAlias = "devB", preset = "medium", amountPol } = req.body || {};
    return transferAmoy({ fromAlias, toAlias, preset, amountOverride: amountPol || undefined });
  })
);

app.post(
  "/api/balance/native",
  safeAsync(async (req) => {
    const { address } = req.body || {};
    if (!address) throw new Error("address is required");
    return { address, balance: await nativeBalance(address) };
  })
);

app.post(
  "/api/balance/token",
  safeAsync(async (req) => {
    const { address, tokenAddress } = req.body || {};
    if (!address || !tokenAddress) throw new Error("address and tokenAddress required");
    return tokenBalance(address, tokenAddress);
  })
);

app.get("/api/tokens", safeAsync(async () => ({ tokens: tokenRegistryService.list() })));
app.post("/api/tokens", safeAsync(async (req) => ({ tokens: tokenRegistryService.add(req.body || {}) })));

app.get("/api/catalog/top200", safeAsync(async () => {
  const existing = readCatalog();
  return existing || { generatedAt: null, count: 0, items: [] };
}));

app.post("/api/catalog/top200/sync", safeAsync(async () => {
  const items = await fetchTop200();
  return saveCatalog(items);
}));

app.post(
  "/api/prices",
  safeAsync(async (req) => {
    const { symbol, tokenAddress } = req.body || {};
    return priceOracleService.getAggregatePrices({ symbol, tokenAddress });
  })
);

app.post(
  "/api/swap/quote",
  safeAsync(async (req) => {
    const { sellToken, buyToken, amount, takerAddress } = req.body || {};
    return quoteSwap({ sellToken, buyToken, amount, takerAddress });
  })
);

app.post(
  "/api/swap/indicative",
  safeAsync(async (req) => {
    const { sellToken, buyToken, sellAmount, chainId } = req.body || {};
    return priceOracleService.getIndicativeSwap({ sellToken, buyToken, sellAmount, chainId });
  })
);

app.post(
  "/api/swap/execute",
  safeAsync(async (req) => {
    const { fromAlias, sellToken, buyToken, sellAmount, slippageBps, dryRun } = req.body || {};
    return executeSwap({ fromAlias, sellToken, buyToken, sellAmount, slippageBps, dryRun: dryRun !== false });
  })
);

app.post(
  "/api/arb/scan",
  safeAsync(async (req) => {
    const { sellToken, buyToken, sellAmount, thresholdPct } = req.body || {};
    return scanPairGap({ sellToken, buyToken, sellAmount, thresholdPct });
  })
);

app.get("/api/arb/watchlist", safeAsync(async () => getWatchlist()));

app.post(
  "/api/arb/watchlist",
  safeAsync(async (req) => {
    const { pairs = [], thresholdPct = 1, intervalSec = 60 } = req.body || {};
    return saveWatchlist({ pairs, thresholdPct, intervalSec });
  })
);

app.post(
  "/api/arb/watchlist/run",
  safeAsync(async (req) => {
    const body = req.body || {};
    const cfg = body.pairs ? body : getWatchlist();
    return runOnce({ pairs: cfg.pairs || [], thresholdPct: Number(cfg.thresholdPct || 1) });
  })
);

app.post(
  "/api/strategy/compile",
  safeAsync(async (req) => {
    const strategy = req.body || {};
    const validation = validateStrategy(strategy);
    if (!validation.ok) {
      const err = new Error(`invalid strategy: ${validation.errors.join('; ')}`);
      err.validation = validation;
      throw err;
    }
    return { validation, compiled: compileStrategy(strategy) };
  })
);

app.listen(PORT, HOST, () => {
  const listenHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`clawdCombo UI listening on http://${listenHost}:${PORT}`);
  console.log(`health: http://${listenHost}:${PORT}/healthz`);
});
