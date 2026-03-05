require('dotenv').config();
const { executeSwap } = require('../swap-exec');
const { readTxLog } = require('../store');

// Circuit breaker configuration
const CIRCUIT_BREAKER_MAX = Number(process.env.CIRCUIT_BREAKER_MAX) || 5;
const CIRCUIT_BREAKER_WINDOW_MS =
  Number(process.env.CIRCUIT_BREAKER_WINDOW_MS) || 10 * 60 * 1000; // 10 minutes

// Retry configuration
const MAX_RETRIES = Number(process.env.STRATEGY_MAX_RETRIES) || 2;
const RETRY_BASE_DELAY_MS = Number(process.env.STRATEGY_RETRY_DELAY_MS) || 5000;

// MEV protection: random delay
const MEV_RANDOM_DELAY_MAX_MS = Number(process.env.MEV_RANDOM_DELAY_MS) || 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  if (MEV_RANDOM_DELAY_MAX_MS <= 0) return Promise.resolve();
  const delay = Math.random() * MEV_RANDOM_DELAY_MAX_MS;
  return sleep(delay);
}

function isRetryableError(err) {
  if (!err) return false;
  const msg = String(err.message || err);
  const code = err.code;
  // List of retryable error codes from swap-exec ExecutionErrorCode
  const retryableCodes = [
    'GAS_PRICE_TOO_LOW',
    'NONCE_TOO_LOW',
    'NONCE_STALE',
    'TIMEOUT_EXCEEDED',
    'NETWORK_ERROR',
  ];
  if (code && retryableCodes.includes(code)) return true;
  if (
    msg.includes('timeout') ||
    msg.includes('nonce') ||
    msg.includes('network') ||
    msg.includes('gas price too low')
  )
    return true;
  return false;
}

function checkCircuitBreaker() {
  const history = readTxLog();
  const now = Date.now();
  const recent = history.filter((entry) => {
    const ts = new Date(entry.timestamp).getTime();
    const age = now - ts;
    if (age > CIRCUIT_BREAKER_WINDOW_MS) return false;
    // Consider entry a failure if verification is present and buyMeetMin is false, or if mode is "error" etc.
    if (entry.verification && entry.verification.buyMeetMin === false)
      return true;
    // Could also check for error fields, but swap-exec logs only successes; failures throw and are not logged.
    return false;
  }).length;
  if (recent >= CIRCUIT_BREAKER_MAX) {
    throw new Error(
      `Circuit breaker open: ${recent} failures in last ${CIRCUIT_BREAKER_WINDOW_MS / 60000} minutes`
    );
  }
}

async function executeStrategy(compiledStrategy, options = {}) {
  if (!compiledStrategy || !compiledStrategy.steps) {
    throw new Error('Invalid compiled strategy: missing steps');
  }

  checkCircuitBreaker();

  const results = [];
  let overallSuccess = true;

  for (let i = 0; i < compiledStrategy.steps.length; i++) {
    const step = compiledStrategy.steps[i];
    if (step.type !== 'swap') {
      throw new Error(
        `Unsupported step type: ${step.type}. Only 'swap' is supported in this version.`
      );
    }

    const params = step.params;
    // Map strategy swap params to executeSwap expectations
    const swapOpts = {
      fromAlias: options.fromAlias || 'devA',
      sellToken: params.from,
      buyToken: params.to,
      sellAmount: params.amount,
      slippageBps: params.slippage || options.slippageBps || 100,
      dryRun: options.dryRun || false,
    };

    let attempt = 0;
    let finalResult;
    while (attempt <= MAX_RETRIES) {
      try {
        // MEV protection: random delay before sending
        await randomDelay();
        finalResult = await executeSwap(swapOpts);
        break; // success
      } catch (err) {
        if (attempt < MAX_RETRIES && isRetryableError(err)) {
          attempt++;
          const backoff =
            RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) +
            Math.random() * 1000;
          await sleep(backoff);
          continue;
        }
        // Non-retryable or out of retries
        finalResult = { success: false, error: err.message || String(err) };
        break;
      }
    }

    const stepResult = { step: i + 1, ...finalResult };
    results.push(stepResult);

    if (!finalResult.success) {
      overallSuccess = false;
      break; // abort remaining steps on failure
    }
  }

  return {
    strategyName: compiledStrategy.name,
    timestamp: new Date().toISOString(),
    overallSuccess,
    results,
  };
}

module.exports = { executeStrategy };
