require("dotenv").config();

function getEnvInt(name, defaultValue) {
  const val = process.env[name];
  if (val === undefined) return defaultValue;
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    throw new Error(`Invalid integer for ${name}: ${val}`);
  }
  return Math.trunc(num);
}

function getEnvBps(name, defaultValue) {
  const val = getEnvInt(name, defaultValue);
  if (val < 1 || val > 10000) {
    throw new Error(`${name} must be between 1 and 10000 bps (0.01% to 100%)`);
  }
  return val;
}

const MAX_GAS = getEnvInt("MAX_SWAP_GAS", 900000);
const MIN_SLIPPAGE_BPS = getEnvBps("MIN_SLIPPAGE_BPS", 1);
const MAX_SLIPPAGE_BPS = getEnvBps("MAX_SLIPPAGE_BPS", 500);
const ALLOWED_DELTA_DEVIATION_BPS = getEnvBps("ALLOWED_DELTA_DEVIATION_BPS", 50);

module.exports = {
  MAX_GAS,
  MIN_SLIPPAGE_BPS,
  MAX_SLIPPAGE_BPS,
  ALLOWED_DELTA_DEVIATION_BPS,
};
