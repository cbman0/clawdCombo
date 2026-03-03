const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECRET_DIR = path.join(ROOT, ".clawdcombo", "secrets");
const META_PATH = path.join(SECRET_DIR, "wallets.json");
const TX_LOG = path.join(ROOT, ".clawdcombo", "tx-history.json");

function ensureSecretDir() {
  fs.mkdirSync(SECRET_DIR, { recursive: true });
}

function loadWalletMeta() {
  ensureSecretDir();
  if (!fs.existsSync(META_PATH)) return { wallets: [] };
  return JSON.parse(fs.readFileSync(META_PATH, "utf8"));
}

function saveWalletMeta(meta) {
  ensureSecretDir();
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

function readEncryptedWallet(fileName) {
  return fs.readFileSync(path.join(SECRET_DIR, fileName), "utf8");
}

function appendTxLog(entry) {
  const dir = path.dirname(TX_LOG);
  fs.mkdirSync(dir, { recursive: true });
  const current = fs.existsSync(TX_LOG) ? JSON.parse(fs.readFileSync(TX_LOG, "utf8")) : [];
  current.push(entry);
  fs.writeFileSync(TX_LOG, JSON.stringify(current, null, 2));
}

function readTxLog() {
  if (!fs.existsSync(TX_LOG)) return [];
  return JSON.parse(fs.readFileSync(TX_LOG, "utf8"));
}

module.exports = {
  ROOT,
  SECRET_DIR,
  TX_LOG,
  loadWalletMeta,
  saveWalletMeta,
  readEncryptedWallet,
  appendTxLog,
  readTxLog,
};
