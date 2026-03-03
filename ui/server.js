require("dotenv").config();

const express = require("express");
const path = require("path");
const { listWallets, createWallet } = require("../cli/wallets");
const { transferAmoy, nativeBalance, tokenBalance, quoteSwap } = require("../cli/amoy");
const { readTxLog } = require("../cli/store");

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

app.post("/api/swap/quote", safeAsync(async (req) => {
  const { sellToken, buyToken, amount, takerAddress } = req.body || {};
  return quoteSwap({ sellToken, buyToken, amount, takerAddress });
}));

app.listen(PORT, "127.0.0.1", () => {
  console.log(`clawdCombo UI listening on http://127.0.0.1:${PORT}`);
});
