require("dotenv").config();
const { ethers } = require("ethers");
const { ERC20_ABI } = require("./constants");
const { getWalletByAlias } = require("./wallets");

function provider() {
  const url = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
  return new ethers.JsonRpcProvider(url);
}

/**
 * Build an executable 0x quote for Amoy.
 */
async function fetchExecutableQuote({ sellToken, buyToken, sellAmount, takerAddress, slippageBps = 100 }) {
  const chainId = 80002;
  const url = new URL("https://api.0x.org/swap/allowance-holder/quote");
  url.searchParams.set("chainId", String(chainId));
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
  if (!sellToken || !buyToken || !sellAmount) {
    throw new Error("sellToken, buyToken, sellAmount are required");
  }

  const p = provider();
  const signer = await getWalletByAlias(fromAlias, p);
  const takerAddress = signer.address;

  const quote = await fetchExecutableQuote({ sellToken, buyToken, sellAmount, takerAddress, slippageBps });

  // Native sell path: no allowance required.
  const isNativeSell = String(sellToken).toUpperCase() === "NATIVE";

  if (!isNativeSell) {
    const token = new ethers.Contract(sellToken, ERC20_ABI, signer);
    const allowanceTarget = quote.allowanceTarget;
    const currentAllowance = await token.allowance(takerAddress, allowanceTarget);

    if (currentAllowance < BigInt(sellAmount)) {
      if (dryRun) {
        return {
          mode: "dry-run",
          needsApproval: true,
          quote,
          note: "Approval required before execution",
        };
      }

      const approveTx = await token.approve(allowanceTarget, BigInt(sellAmount));
      await approveTx.wait();
    }
  }

  if (dryRun || process.env.ENABLE_LIVE_SWAP !== "true") {
    return {
      mode: "dry-run",
      quote,
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

  return {
    mode: "live",
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: receipt.from,
    to: receipt.to,
    sellToken,
    buyToken,
    sellAmount,
  };
}

module.exports = { executeSwap, fetchExecutableQuote };
