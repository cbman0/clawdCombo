require("dotenv").config();

const DEFAULT_TIMEOUT_MS = Number(process.env.ORACLE_TIMEOUT_MS || 7000);
const RETRIES = Number(process.env.ORACLE_RETRIES || 1);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs || DEFAULT_TIMEOUT_MS);
  const retries = Number(opts.retries ?? RETRIES);

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(`timeout ${timeoutMs}ms`), timeoutMs);

    try {
      const res = await fetch(url, {
        ...opts,
        signal: ctrl.signal,
        headers: {
          "user-agent": "clawdcombo-oracle/0.1",
          accept: "application/json",
          ...(opts.headers || {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      clearTimeout(timer);
      return json;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < retries) await sleep(200 * (attempt + 1));
    }
  }

  throw new Error(`fetch failed after ${retries + 1} attempts: ${lastErr?.message || "unknown"}`);
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
  const pairs = Array.isArray(json.pairs) ? json.pairs : [];

  const pair = pairs
    .filter((p) => p && p.priceUsd)
    .sort((a, b) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0))[0];

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

function normalizePriceEntry(p) {
  return {
    provider: String(p.provider),
    usd: Number(p.usd),
    symbol: p.symbol || null,
    tokenAddress: p.tokenAddress || null,
    liquidityUsd: Number(p.liquidityUsd || 0),
    at: new Date().toISOString(),
  };
}

async function aggregatePrices({ symbol = "POL", tokenAddress }) {
  const out = [];
  const errors = [];

  try {
    if (symbol.toUpperCase() === "POL") out.push(normalizePriceEntry(await coinGeckoSimple("matic-network")));
  } catch (e) {
    errors.push({ provider: "coingecko", error: e.message });
  }

  if (tokenAddress && tokenAddress !== "NATIVE") {
    try {
      out.push(normalizePriceEntry(await dexScreenerToken(tokenAddress)));
    } catch (e) {
      errors.push({ provider: "dexscreener", error: e.message });
    }
  }

  const medianUsd = out.length
    ? [...out].map((p) => p.usd).sort((a, b) => a - b)[Math.floor(out.length / 2)]
    : null;

  return { prices: out, errors, summary: { count: out.length, medianUsd } };
}

module.exports = { coinGeckoSimple, dexScreenerToken, zeroXIndicative, aggregatePrices, fetchJson, normalizePriceEntry };
