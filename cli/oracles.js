require("dotenv").config();

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function coinGeckoSimple(coinId = "matic-network") {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const json = await fetchJson(url);
  const usd = json?.[coinId]?.usd;
  if (usd == null) throw new Error("CoinGecko missing price");
  return { provider: "coingecko", symbol: coinId, usd: Number(usd) };
}

async function dexScreenerToken(tokenAddress) {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
  const json = await fetchJson(url);
  const pair = (json.pairs || [])[0];
  if (!pair || !pair.priceUsd) throw new Error("DexScreener missing price");
  return {
    provider: "dexscreener",
    tokenAddress,
    usd: Number(pair.priceUsd),
    pair: pair.pairAddress,
    dexId: pair.dexId,
    liquidityUsd: Number(pair?.liquidity?.usd || 0),
  };
}

async function zeroXIndicative({ chainId = 80002, sellToken, buyToken, sellAmount }) {
  const url = `https://api.0x.org/swap/allowance-holder/price?chainId=${chainId}&sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}`;
  const json = await fetchJson(url);
  return {
    provider: "0x",
    chainId,
    sellToken,
    buyToken,
    price: Number(json.price),
    buyAmount: json.buyAmount,
    sellAmount: json.sellAmount,
    gas: json.gas,
  };
}

async function aggregatePrices({ symbol = "POL", tokenAddress }) {
  const out = [];
  const errors = [];

  try {
    if (symbol.toUpperCase() === "POL") out.push(await coinGeckoSimple("matic-network"));
  } catch (e) {
    errors.push({ provider: "coingecko", error: e.message });
  }

  if (tokenAddress && tokenAddress !== "NATIVE") {
    try {
      out.push(await dexScreenerToken(tokenAddress));
    } catch (e) {
      errors.push({ provider: "dexscreener", error: e.message });
    }
  }

  return { prices: out, errors };
}

module.exports = { coinGeckoSimple, dexScreenerToken, zeroXIndicative, aggregatePrices };
