require("dotenv").config();
const { ethers } = require("ethers");
const { loadWalletMeta, saveWalletMeta, readEncryptedWallet, SECRET_DIR } = require("./store");
const path = require("path");
const fs = require("fs");

function requireBackupPassword() {
  const password = process.env.WALLET_BACKUP_PASSWORD;
  if (!password) throw new Error("Missing WALLET_BACKUP_PASSWORD");
  return password;
}

async function createWallet(alias) {
  const password = requireBackupPassword();
  if (!alias) throw new Error("Missing alias");

  const meta = loadWalletMeta();
  if (meta.wallets.some((w) => w.alias === alias)) throw new Error(`Alias exists: ${alias}`);

  const wallet = ethers.Wallet.createRandom();
  const encryptedJson = await wallet.encrypt(password);
  const fileName = `${alias}.json`;
  const filePath = path.join(SECRET_DIR, fileName);

  fs.writeFileSync(filePath, encryptedJson);

  const entry = { alias, address: wallet.address, file: fileName, createdAt: new Date().toISOString() };
  meta.wallets.push(entry);
  saveWalletMeta(meta);

  return { ...entry, backupFile: filePath };
}

function listWallets() {
  return loadWalletMeta().wallets;
}

async function getWalletByAlias(alias, provider) {
  const password = requireBackupPassword();
  const meta = loadWalletMeta();
  const w = meta.wallets.find((x) => x.alias === alias);
  if (!w) throw new Error(`Unknown alias: ${alias}`);
  const encrypted = readEncryptedWallet(w.file);
  const wallet = await ethers.Wallet.fromEncryptedJson(encrypted, password);
  return provider ? wallet.connect(provider) : wallet;
}

module.exports = { createWallet, listWallets, getWalletByAlias };
