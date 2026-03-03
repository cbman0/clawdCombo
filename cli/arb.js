const { zeroXIndicative } = require("./oracles");

function pctDiff(a, b) {
  if (!a || !b) return 0;
  const mid = (a + b) / 2;
  if (mid === 0) return 0;
  return Math.abs((a - b) / mid) * 100;
}

async function scanPairGap({ sellToken, buyToken, sellAmount, thresholdPct = 1 }) {
  if (!sellToken || !buyToken || !sellAmount) throw new Error("sellToken, buyToken, sellAmount required");

  // Two directional quotes as rough arb signal
  const q1 = await zeroXIndicative({ sellToken, buyToken, sellAmount });
  const q2 = await zeroXIndicative({ sellToken: buyToken, buyToken: sellToken, sellAmount: q1.buyAmount });

  const forward = q1.price;
  const roundTrip = q2.price;
  const gapPct = pctDiff(forward, roundTrip);

  return {
    thresholdPct: Number(thresholdPct),
    triggered: gapPct >= Number(thresholdPct),
    gapPct,
    forward,
    roundTrip,
    quotes: { q1, q2 },
  };
}

module.exports = { scanPairGap, pctDiff };
