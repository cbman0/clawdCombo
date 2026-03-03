const { scanPairGap } = require("../arb");

/**
 * Scan a list of pairs and return only threshold-triggered opportunities.
 */
async function scanWatchlist({ pairs = [], thresholdPct = 1 }) {
  const results = [];

  for (const pair of pairs) {
    const { sellToken, buyToken, sellAmount, label } = pair;
    try {
      const scan = await scanPairGap({ sellToken, buyToken, sellAmount, thresholdPct });
      results.push({ label: label || `${sellToken}->${buyToken}`, ...scan });
    } catch (error) {
      results.push({
        label: label || `${sellToken}->${buyToken}`,
        triggered: false,
        error: error.message,
      });
    }
  }

  const opportunities = results.filter((r) => r.triggered).sort((a, b) => b.gapPct - a.gapPct);
  return { thresholdPct, results, opportunities };
}

module.exports = { scanWatchlist };
