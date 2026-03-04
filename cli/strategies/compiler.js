const { buildFlashloanParams } = require("../adapters/aave-v3-flash");
const { getUniswapV3Quote } = require("../adapters/uniswap-v3");
const { getOneInchQuote } = require("../adapters/1inch");

const ADAPTER_MAP = {
  "uniswap-v3": getUniswapV3Quote,
  "1inch": getOneInchQuote,
};

function validateStrategy(strategy = {}) {
  const errors = [];
  if (!strategy || typeof strategy !== "object") errors.push("strategy object is required");
  if (!strategy.name) errors.push("name is required");
  if (!strategy.chain) errors.push("chain is required");
  if (!strategy.flashloan || typeof strategy.flashloan !== "object") errors.push("flashloan object is required");
  if (!Array.isArray(strategy.actions) || strategy.actions.length < 1) errors.push("at least one action is required");

  if (strategy.flashloan) {
    if (!strategy.flashloan.asset) errors.push("flashloan.asset is required");
    if (!strategy.flashloan.amount) errors.push("flashloan.amount is required");
  }

  if (Array.isArray(strategy.actions)) {
    strategy.actions.forEach((a, i) => {
      if (!a.type) errors.push(`actions[${i}].type is required`);
      if (a.type === "swap" && !a.dex) errors.push(`actions[${i}].dex is required for swap type`);
    });
  }

  return { ok: errors.length === 0, errors };
}

async function resolveAdapterQuotes(steps) {
  const resolved = [];
  for (const step of steps) {
    const quoteFn = ADAPTER_MAP[step.adapterHint];
    let quote = null;
    if (quoteFn && step.params.type === "swap") {
      try {
        quote = await quoteFn({
          sellToken: step.params.from,
          buyToken: step.params.to,
          sellAmount: step.params.amount || "0",
          fee: step.params.fee,
        });
      } catch (e) {
        quote = { error: e.message };
      }
    }
    resolved.push({ ...step, adapterQuote: quote });
  }
  return resolved;
}

function compileStrategy(strategy = {}) {
  const check = validateStrategy(strategy);
  if (!check.ok) {
    const e = new Error(`invalid strategy: ${check.errors.join("; ")}`);
    e.validation = check;
    throw e;
  }

  const flashloanStep = buildFlashloanParams({
    asset: strategy.flashloan.asset,
    amount: strategy.flashloan.amount,
    receiverAddress: strategy.flashloan.receiver || "0x0000000000000000000000000000000000000000",
  });

  const steps = strategy.actions.map((action, index) => ({
    id: index + 1,
    type: action.type || "unknown",
    adapterHint: action.dex || action.protocol || "unassigned",
    params: action,
  }));

  return {
    version: "0.2-draft",
    name: strategy.name,
    chain: strategy.chain,
    flashloan: flashloanStep,
    steps,
    repay: strategy.repay || null,
    supportedAdapters: Object.keys(ADAPTER_MAP),
    metadata: {
      compiledAt: new Date().toISOString(),
      actionCount: steps.length,
    },
  };
}

module.exports = { validateStrategy, compileStrategy, resolveAdapterQuotes, ADAPTER_MAP };
