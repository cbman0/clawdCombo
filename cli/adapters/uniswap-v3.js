const { ethers } = require("ethers");

const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

async function getUniswapV3Quote({ sellToken, buyToken, sellAmount, fee = 3000 }) {
  if (!sellToken || !buyToken || !sellAmount) {
    throw new Error("sellToken, buyToken, sellAmount required");
  }
  return {
    adapter: "uniswap-v3",
    fee,
    sellToken,
    buyToken,
    sellAmount,
    status: "quote-ready",
    note: "Production integration pending Quoter contract",
  };
}

async function executeUniswapV3Swap({ sellToken, buyToken, sellAmount, minBuyAmount, recipient }) {
  return {
    adapter: "uniswap-v3",
    type: "swap",
    sellToken,
    buyToken,
    sellAmount,
    minBuyAmount,
    recipient,
    status: "execution-ready",
    routerAddress: UNISWAP_V3_ROUTER,
  };
}

module.exports = { getUniswapV3Quote, executeUniswapV3Swap, UNISWAP_V3_ROUTER };
