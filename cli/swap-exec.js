require("dotenv").config();
const { ethers } = require("ethers");
const { ERC20_ABI } = require("./constants");
const { getWalletByAlias } = require("./wallets");
const { appendTxLog } = require("./store");

const CHAIN_ID_AMOY = 80002;
const DEFAULT_MAX_GAS = Number(process.env.MAX_SWAP_GAS || 900000);

function provider() {
  const url = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
  return new ethers.JsonRpcProvider(url);
}

function isNativeToken(token) {
  return String(token || "").toUpperCase() === "NATIVE";
}

function parsePositiveBigInt(value, field) {
  try {
    const v = BigInt(String(value));
    if (v <= 0n) throw new Error("must be > 0");
    return v;
  } catch {
    throw new Error(`${field} must be a positive integer string`);
  }
}

function validateSwapInput({ sellToken, buyToken, sellAmount, slippageBps }) {
  if (!sellToken || !buyToken || !sellAmount) {
    throw new Error("sellToken, buyToken, sellAmount are required");
  }

  const parsedAmount = parsePositiveBigInt(sellAmount, "sellAmount");

  if (Number(slippageBps) < 1 || Number(slippageBps) > 500) {
    throw new Error("slippageBps must be between 1 and 500");
  }

  const sellNative = isNativeToken(sellToken);
  const buyNative = isNativeToken(buyToken);

  if (!sellNative && !ethers.isAddress(sellToken)) throw new Error("sellToken must be NATIVE or a valid address");
  if (!buyNative && !ethers.isAddress(buyToken)) throw new Error("buyToken must be NATIVE or a valid address");

  if (String(sellToken).toLowerCase() === String(buyToken).toLowerCase()) {
    throw new Error("sellToken and buyToken cannot be the same");
  }

  return { parsedAmount };
}

async function fetchTokenSnapshot(p, tokenAddress, account) {
  if (isNativeToken(tokenAddress)) {
    const balance = await p.getBalance(account);
    return {
      token: "NATIVE",
      decimals: 18,
      raw: balance.toString(),
      formatted: ethers.formatEther(balance),
    };
  }

  const token = new ethers.Contract(tokenAddress, ERC20_ABI, p);
  const [decimals, balance] = await Promise.all([
    token.decimals(),
    token.balanceOf(account),
  ]);

  return {
    token: tokenAddress,
    decimals,
    raw: balance.toString(),
    formatted: ethers.formatUnits(balance, decimals),
  };
}

function computeDelta(beforeRaw, afterRaw, decimals) {
  const delta = BigInt(afterRaw) - BigInt(beforeRaw);
  return {
    raw: delta.toString(),
    formatted: ethers.formatUnits(delta, decimals),
  };
}

/**
 * Build an executable 0x quote for Amoy.
 */
async function fetchExecutableQuote({ sellToken, buyToken, sellAmount, takerAddress, slippageBps = 100 }) {
  const url = new URL("https://api.0x.org/swap/allowance-holder/quote");
  url.searchParams.set("chainId", String(CHAIN_ID_AMOY));
  url.searchParams.set("sellToken", sellToken);
  url.searchParams.set("buyToken", buyToken);
  url.searchParams.set("sellAmount", sellAmount);
  url.searchParams.set("taker", takerAddress);
  url.searchParams.set("slippageBps", String(slippageBps));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`0x quote failed: HTTP ${res.status}`);
  return res.json();
}

/**
 * Execute swap from a managed alias wallet.
 * Safety defaults:
 * - dryRun=true by default
 * - live execution requires ENABLE_LIVE_SWAP=true in env
 */
async function executeSwap({
  fromAlias = "devA",
  sellToken,
  buyToken,
  sellAmount,
  slippageBps = 100,
  dryRun = true,
}) {
  const { parsedAmount } = validateSwapInput({ sellToken, buyToken, sellAmount, slippageBps });

  const p = provider();
  const signer = await getWalletByAlias(fromAlias, p);
  const takerAddress = signer.address;

  const [sellBefore, buyBefore] = await Promise.all([
    fetchTokenSnapshot(p, sellToken, takerAddress),
    fetchTokenSnapshot(p, buyToken, takerAddress),
  ]);

  const quote = await fetchExecutableQuote({ sellToken, buyToken, sellAmount, takerAddress, slippageBps });

  const quoteGas = quote?.transaction?.gas ? Number(quote.transaction.gas) : null;
  if (quoteGas && quoteGas > DEFAULT_MAX_GAS) {
    throw new Error(`quote gas ${quoteGas} exceeds max allowed ${DEFAULT_MAX_GAS}`);
  }

  // Native sell path: no allowance required.
  const isNativeSell = isNativeToken(sellToken);

  if (!isNativeSell) {
    const token = new ethers.Contract(sellToken, ERC20_ABI, signer);
    const allowanceTarget = quote.allowanceTarget;
    const currentAllowance = await token.allowance(takerAddress, allowanceTarget);

    if (currentAllowance < parsedAmount) {
      if (dryRun) {
        return {
          mode: "dry-run",
          needsApproval: true,
          guardrails: { slippageBps: Number(slippageBps), maxGas: DEFAULT_MAX_GAS },
          quote,
          balancesBefore: { sell: sellBefore, buy: buyBefore },
          note: "Approval required before execution",
        };
      }

      const approveTx = await token.approve(allowanceTarget, parsedAmount);
      await approveTx.wait();
    }
  }

  if (dryRun || process.env.ENABLE_LIVE_SWAP !== "true") {
    return {
      mode: "dry-run",
      guardrails: { slippageBps: Number(slippageBps), maxGas: DEFAULT_MAX_GAS },
      quote,
      balancesBefore: { sell: sellBefore, buy: buyBefore },
      note: "Set ENABLE_LIVE_SWAP=true and dryRun=false to execute",
    };
  }

  const tx = quote.transaction;
  if (!tx || !tx.to || !tx.data) {
    throw new Error("Quote missing executable transaction payload");
  }

  const sent = await signer.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: BigInt(tx.value || "0"),
    gasLimit: tx.gas ? BigInt(tx.gas) : undefined,
  });
  const receipt = await sent.wait();

  const [sellAfter, buyAfter] = await Promise.all([
    fetchTokenSnapshot(p, sellToken, takerAddress),
    fetchTokenSnapshot(p, buyToken, takerAddress),
  ]);

  const deltas = {
    sell: computeDelta(sellBefore.raw, sellAfter.raw, sellBefore.decimals),
    buy: computeDelta(buyBefore.raw, buyAfter.raw, buyBefore.decimals),
  };

  const result = {
    mode: "live",
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: receipt.from,
    to: receipt.to,
    sellToken,
    buyToken,
    sellAmount,
    guardrails: { slippageBps: Number(slippageBps), maxGas: DEFAULT_MAX_GAS },
    balances: {
      before: { sell: sellBefore, buy: buyBefore },
      after: { sell: sellAfter, buy: buyAfter },
      deltas,
    },
  };

  appendTxLog({
    type: "swap",
    network: "polygon-amoy",
    timestamp: new Date().toISOString(),
    ...result,
  });

  return result;
}

module.exports = { executeSwap, fetchExecutableQuote, validateSwapInput };
