require("dotenv").config();
const { ethers } = require("ethers");
const { AMOUNTS, ERC20_ABI } = require("./constants");
const { getWalletByAlias } = require("./wallets");
const { appendTxLog } = require("./store");

function provider() {
  const url = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
  return new ethers.JsonRpcProvider(url);
}

function amountFromPreset(preset, override) {
  if (override) return String(override);
  if (preset && AMOUNTS[preset]) return AMOUNTS[preset];
  return AMOUNTS.medium;
}

function funderWallet(p) {
  const pk = process.env.FUNDER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Missing FUNDER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY");
  return new ethers.Wallet(pk, p);
}

async function transferAmoy({ fromAlias = "devA", toAlias = "devB", preset = "medium", amountOverride, seedPol = "0.01" }) {
  const p = provider();
  const from = await getWalletByAlias(fromAlias, p);
  const to = await getWalletByAlias(toAlias, p);
  const amountPol = amountFromPreset(preset, amountOverride);

  const fromBal = await p.getBalance(from.address);
  if (fromBal < ethers.parseEther(amountPol)) {
    const funder = funderWallet(p);
    const seedTx = await funder.sendTransaction({ to: from.address, value: ethers.parseEther(seedPol) });
    await seedTx.wait();
  }

  const tx = await from.sendTransaction({ to: to.address, value: ethers.parseEther(amountPol) });
  const receipt = await tx.wait();

  const entry = {
    network: "polygon-amoy",
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: from.address,
    to: to.address,
    amountPol,
    timestamp: new Date().toISOString(),
  };
  appendTxLog(entry);
  return entry;
}

async function nativeBalance(address) {
  const p = provider();
  const bal = await p.getBalance(address);
  return ethers.formatEther(bal);
}

async function tokenBalance(address, tokenAddress) {
  const p = provider();
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, p);
  const [symbol, decimals, balance] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.balanceOf(address),
  ]);
  return { token: tokenAddress, symbol, decimals, balance: ethers.formatUnits(balance, decimals) };
}

async function quoteSwap({ sellToken, buyToken, amount, takerAddress }) {
  if (!sellToken || !buyToken || !amount || !takerAddress) {
    throw new Error("sellToken, buyToken, amount, takerAddress are required");
  }
  const chainId = 80002; // Amoy
  const base = `https://api.0x.org/swap/allowance-holder/quote`;
  const url = `${base}?chainId=${chainId}&sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${amount}&taker=${takerAddress}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Swap quote failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  return {
    price: data.price,
    buyAmount: data.buyAmount,
    sellAmount: data.sellAmount,
    issues: data.issues || null,
    route: data.route || null,
    allowanceTarget: data.allowanceTarget,
    to: data.transaction?.to,
  };
}

module.exports = { transferAmoy, nativeBalance, tokenBalance, quoteSwap, amountFromPreset };
