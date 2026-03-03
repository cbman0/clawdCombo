const { scanWatchlist } = require("./arb-watchlist");

/**
 * Run one watchlist scan with timing metrics.
 */
async function runOnce({ pairs, thresholdPct }) {
  const started = Date.now();
  const result = await scanWatchlist({ pairs, thresholdPct });
  const finished = Date.now();

  return {
    ...result,
    metrics: {
      startedAt: new Date(started).toISOString(),
      finishedAt: new Date(finished).toISOString(),
      durationMs: finished - started,
      pairCount: Array.isArray(pairs) ? pairs.length : 0,
      triggeredCount: result.opportunities.length,
    },
  };
}

module.exports = { runOnce };
