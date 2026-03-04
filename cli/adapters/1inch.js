const { ethers } = require("ethers");

const ONEINCH_ROUTER = "0x1111111254fb6c44bac0bed2854e76f90643097d";

async function getOneInchQuote({ sellToken, buyToken, sellAmount, chainId = 80002 }) {
  if (!sellToken || !buyToken || !sellAmount) {
    throw new Error("sellToken, buyToken, sellAmount required");
  }
  return {
    adapter: "1inch",
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    status: "quote-ready",
    apiEndpoint: `https://api.1inch.io/v5.0/${chainId}/quote`,
    note: "Ready for HTTP integration",
  };
}

async function executeOneInchSwap({ sellToken, buyToken, sellAmount, slippage = 1, recipient }) {
  return {
    adapter: "1inch",
    type: "swap",
    sellToken,
    buyToken,
    sellAmount,
    slippage,
    recipient,
    status: "execution-ready",
    routerAddress: ONEINCH_ROUTER,
  };
}

module.exports = { getOneInchQuote, executeOneInchSwap, ONEINCH_ROUTER };
