require("dotenv").config();

const express = require("express");
const path = require("path");
const { listWallets, createWallet } = require("../cli/wallets");
const { transferAmoy, nativeBalance, tokenBalance, quoteSwap } = require("../cli/amoy");
const { readTxLog } = require("../cli/store");
const { listTokens, addToken } = require("../cli/token-registry");
const { aggregatePrices, zeroXIndicative } = require("../cli/oracles");
const { scanPairGap } = require("../cli/arb");

const app = express();
const PORT = process.env.UI_PORT || 4173;

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

app.get("/api/status", safeAsync(async () => ({
  wallets: listWallets(),
  tokens: listTokens(),
  presets: { low: "0.0001", medium: "0.001", high: "0.002" },
  envLoaded: {
    amoyRpc: !!process.env.AMOY_RPC_URL,
    deployerPk: !!(process.env.FUNDER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY),
    backupPassword: !!process.env.WALLET_BACKUP_PASSWORD,
  },
})));

app.post("/api/wallet/create", safeAsync(async (req) => createWallet(req.body?.alias)));
app.get("/api/wallet/list", safeAsync(async () => ({ wallets: listWallets() })));
app.get("/api/tx/history", safeAsync(async () => ({ items: readTxLog() })));

app.post("/api/transfer", safeAsync(async (req) => {
  const { fromAlias = "devA", toAlias = "devB", preset = "medium", amountPol } = req.body || {};
  return transferAmoy({ fromAlias, toAlias, preset, amountOverride: amountPol || undefined });
}));

app.post("/api/balance/native", safeAsync(async (req) => {
  const { address } = req.body || {};
  if (!address) throw new Error("address is required");
  return { address, balance: await nativeBalance(address) };
}));

app.post("/api/balance/token", safeAsync(async (req) => {
  const { address, tokenAddress } = req.body || {};
  if (!address || !tokenAddress) throw new Error("address and tokenAddress required");
  return tokenBalance(address, tokenAddress);
}));

app.get("/api/tokens", safeAsync(async () => ({ tokens: listTokens() })));
app.post("/api/tokens", safeAsync(async (req) => ({ tokens: addToken(req.body || {}) })));

app.post("/api/prices", safeAsync(async (req) => {
  const { symbol, tokenAddress } = req.body || {};
  return aggregatePrices({ symbol, tokenAddress });
}));

app.post("/api/swap/quote", safeAsync(async (req) => {
  const { sellToken, buyToken, amount, takerAddress } = req.body || {};
  return quoteSwap({ sellToken, buyToken, amount, takerAddress });
}));

app.post("/api/swap/indicative", safeAsync(async (req) => {
  const { sellToken, buyToken, sellAmount } = req.body || {};
  return zeroXIndicative({ sellToken, buyToken, sellAmount });
}));

app.post("/api/arb/scan", safeAsync(async (req) => {
  const { sellToken, buyToken, sellAmount, thresholdPct } = req.body || {};
  return scanPairGap({ sellToken, buyToken, sellAmount, thresholdPct });
}));

app.listen(PORT, "127.0.0.1", () => {
  console.log(`clawdCombo UI listening on http://127.0.0.1:${PORT}`);
});
