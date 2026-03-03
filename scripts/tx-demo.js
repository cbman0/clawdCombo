#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const ROOT = path.resolve(__dirname, "..");
const SECRET_DIR = path.join(ROOT, ".clawdcombo", "secrets");
const META_PATH = path.join(SECRET_DIR, "wallets.json");
const TX_LOG = path.join(ROOT, ".clawdcombo", "tx-history.json");

function loadMeta() {
  if (!fs.existsSync(META_PATH)) throw new Error("No wallets.json found. Create wallets first.");
  return JSON.parse(fs.readFileSync(META_PATH, "utf8"));
}

function readEncrypted(fileName) {
  return fs.readFileSync(path.join(SECRET_DIR, fileName), "utf8");
}

function logTx(entry) {
  const dir = path.dirname(TX_LOG);
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.existsSync(TX_LOG) ? JSON.parse(fs.readFileSync(TX_LOG, "utf8")) : [];
  existing.push(entry);
  fs.writeFileSync(TX_LOG, JSON.stringify(existing, null, 2));
}

async function localTransfer(fromAlias, toAlias, amountEth = "0.0001") {
  const password = process.env.WALLET_BACKUP_PASSWORD;
  if (!password) throw new Error("Set WALLET_BACKUP_PASSWORD env var.");

  const meta = loadMeta();
  const from = meta.wallets.find((w) => w.alias === fromAlias);
  const to = meta.wallets.find((w) => w.alias === toAlias);
  if (!from || !to) throw new Error("Aliases not found in wallets.json");

  const encryptedFrom = readEncrypted(from.file);
  const encryptedTo = readEncrypted(to.file);

  const fromWalletRaw = await ethers.Wallet.fromEncryptedJson(encryptedFrom, password);
  const toWalletRaw = await ethers.Wallet.fromEncryptedJson(encryptedTo, password);

  const provider = ethers.provider;
  const [funder] = await ethers.getSigners();

  const fromWallet = fromWalletRaw.connect(provider);
  const toWallet = toWalletRaw.connect(provider);

  // seed sender wallet from local hardhat rich account
  const seedTx = await funder.sendTransaction({
    to: fromWallet.address,
    value: ethers.parseEther("0.01"),
  });
  await seedTx.wait();

  const tx = await fromWallet.sendTransaction({
    to: toWallet.address,
    value: ethers.parseEther(amountEth),
  });
  const receipt = await tx.wait();

  const fromBal = await provider.getBalance(fromWallet.address);
  const toBal = await provider.getBalance(toWallet.address);

  const entry = {
    network: "hardhat-local",
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: fromWallet.address,
    to: toWallet.address,
    amountEth,
    timestamp: new Date().toISOString(),
    balances: {
      from: ethers.formatEther(fromBal),
      to: ethers.formatEther(toBal),
    },
  };
  logTx(entry);

  console.log(JSON.stringify(entry, null, 2));
}

function help() {
  console.log(`Transaction demo CLI

Usage:
  FROM_ALIAS=devA TO_ALIAS=devB AMOUNT_ETH=0.0001 WALLET_BACKUP_PASSWORD='***' npx hardhat run scripts/tx-demo.js
`);
}

(async () => {
  const fromAlias = process.env.FROM_ALIAS;
  const toAlias = process.env.TO_ALIAS;
  const amountEth = process.env.AMOUNT_ETH || "0.0001";
  try {
    if (fromAlias && toAlias) return await localTransfer(fromAlias, toAlias, amountEth);
    help();
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();
