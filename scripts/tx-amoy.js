#!/usr/bin/env node
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

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

async function main() {
  const password = process.env.WALLET_BACKUP_PASSWORD;
  const fromAlias = process.env.FROM_ALIAS || "devA";
  const toAlias = process.env.TO_ALIAS || "devB";
  const amountPol = process.env.AMOY_AMOUNT_POL || "0.001";
  const seedPol = process.env.AMOY_SEED_POL || "0.01";
  const rpcUrl = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
  const funderPk = process.env.FUNDER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

  if (!password) throw new Error("Missing WALLET_BACKUP_PASSWORD in env.");
  if (!funderPk) throw new Error("Missing FUNDER_PRIVATE_KEY (or DEPLOYER_PRIVATE_KEY) in env.");

  const meta = loadMeta();
  const from = meta.wallets.find((w) => w.alias === fromAlias);
  const to = meta.wallets.find((w) => w.alias === toAlias);
  if (!from || !to) throw new Error("Aliases not found in wallets.json");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const funder = new ethers.Wallet(funderPk, provider);

  const encryptedFrom = readEncrypted(from.file);
  const encryptedTo = readEncrypted(to.file);
  const fromWallet = (await ethers.Wallet.fromEncryptedJson(encryptedFrom, password)).connect(provider);
  const toWallet = (await ethers.Wallet.fromEncryptedJson(encryptedTo, password)).connect(provider);

  // Seed sender wallet if needed
  const fromBalBefore = await provider.getBalance(fromWallet.address);
  const seedWei = ethers.parseEther(seedPol);
  if (fromBalBefore < ethers.parseEther(amountPol)) {
    const seedTx = await funder.sendTransaction({ to: fromWallet.address, value: seedWei });
    await seedTx.wait();
  }

  const tx = await fromWallet.sendTransaction({
    to: toWallet.address,
    value: ethers.parseEther(amountPol),
  });
  const receipt = await tx.wait();

  const fromBalAfter = await provider.getBalance(fromWallet.address);
  const toBalAfter = await provider.getBalance(toWallet.address);

  const entry = {
    network: "polygon-amoy",
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: fromWallet.address,
    to: toWallet.address,
    amountPol,
    timestamp: new Date().toISOString(),
    balances: {
      from: ethers.formatEther(fromBalAfter),
      to: ethers.formatEther(toBalAfter),
    },
  };

  logTx(entry);
  console.log(JSON.stringify(entry, null, 2));
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
