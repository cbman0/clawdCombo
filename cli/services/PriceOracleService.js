const { BaseService } = require("./BaseService");
const { aggregatePrices, zeroXIndicative } = require("../oracles");

/**
 * PriceOracleService
 * ------------------
 * Unified place for price and quote reads.
 *
 * Why this exists:
 * - Keep UI handlers small.
 * - Keep oracle logic replaceable without touching UI code.
 */
class PriceOracleService extends BaseService {
  constructor() {
    super("PriceOracleService");
  }

  async getAggregatePrices({ symbol, tokenAddress }) {
    return aggregatePrices({ symbol, tokenAddress });
  }

  async getIndicativeSwap({ sellToken, buyToken, sellAmount, chainId = 80002 }) {
    if (!sellToken || !buyToken || !sellAmount) {
      throw this.fail("sellToken, buyToken, sellAmount are required");
    }
    return zeroXIndicative({ sellToken, buyToken, sellAmount, chainId });
  }
}

module.exports = { PriceOracleService };
