#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const ROOT = path.resolve(__dirname, "..");
const SECRET_DIR = path.join(ROOT, ".clawdcombo", "secrets");
const META_PATH = path.join(SECRET_DIR, "wallets.json");

function ensureDirs() {
  fs.mkdirSync(SECRET_DIR, { recursive: true });
}

function loadMeta() {
  if (!fs.existsSync(META_PATH)) return { wallets: [] };
  return JSON.parse(fs.readFileSync(META_PATH, "utf8"));
}

function saveMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

async function createWallet(alias) {
  if (!alias) throw new Error("Missing alias. Usage: wallet:create <alias>");
  const password = process.env.WALLET_BACKUP_PASSWORD;
  if (!password) throw new Error("Set WALLET_BACKUP_PASSWORD env var first.");

  ensureDirs();
  const meta = loadMeta();
  if (meta.wallets.find((w) => w.alias === alias)) {
    throw new Error(`Alias already exists: ${alias}`);
  }

  const wallet = ethers.Wallet.createRandom();
  const encryptedJson = await wallet.encrypt(password);

  const fileName = `${alias}.json`;
  const filePath = path.join(SECRET_DIR, fileName);
  fs.writeFileSync(filePath, encryptedJson);

  meta.wallets.push({ alias, address: wallet.address, file: fileName, createdAt: new Date().toISOString() });
  saveMeta(meta);

  console.log(JSON.stringify({ alias, address: wallet.address, backupFile: filePath }, null, 2));
}

function listWallets() {
  ensureDirs();
  const meta = loadMeta();
  console.log(JSON.stringify(meta, null, 2));
}

function help() {
  console.log(`clawdCombo wallet CLI

Commands:
  wallet:create <alias>   Create wallet + encrypted backup in .clawdcombo/secrets
  wallet:list             List backed up wallets

Env:
  WALLET_BACKUP_PASSWORD  Required for wallet:create
`);
}

(async () => {
  const cmd = process.argv[2];
  const arg = process.argv[3];

  try {
    if (cmd === "wallet:create") return await createWallet(arg);
    if (cmd === "wallet:list") return listWallets();
    return help();
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();
