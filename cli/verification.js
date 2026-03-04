/**
 * Post-trade delta verification utilities.
 */

function verifyBuyDelta(quote, actualBuyDeltaRaw) {
  if (!quote || quote.buyAmount === undefined) {
    return { warning: "No buyAmount in quote; cannot verify" };
  }
  try {
    const expectedMinBuy = BigInt(quote.buyAmount);
    const actual = BigInt(actualBuyDeltaRaw);
    const meetsMin = actual >= expectedMinBuy;
    return {
      buyMeetMin: meetsMin,
      expectedMinBuy: quote.buyAmount,
      actualBuyDelta: actualBuyDeltaRaw,
    };
  } catch (e) {
    return { buyAmountCheckError: e.message };
  }
}

module.exports = { verifyBuyDelta };
