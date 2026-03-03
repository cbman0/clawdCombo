const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REG_PATH = path.join(ROOT, ".clawdcombo", "tokens.amoy.json");

const DEFAULT_TOKENS = [
  { symbol: "POL", address: "NATIVE", decimals: 18, source: "default" },
  { symbol: "USDC", address: "0x41e94eb019c0762f9b52a7c2c8a1e4b2a00f3f8b", decimals: 6, source: "default" },
  { symbol: "WETH", address: "0x98cf8300719ae8362d2f2ec4959d9d5194ce3c5a", decimals: 18, source: "default" },
];

function ensureRegistry() {
  const dir = path.dirname(REG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(REG_PATH)) {
    fs.writeFileSync(REG_PATH, JSON.stringify({ tokens: DEFAULT_TOKENS }, null, 2));
  }
}

function listTokens() {
  ensureRegistry();
  const data = JSON.parse(fs.readFileSync(REG_PATH, "utf8"));
  return data.tokens || [];
}

function addToken({ symbol, address, decimals = 18 }) {
  if (!symbol || !address) throw new Error("symbol and address are required");
  ensureRegistry();
  const data = JSON.parse(fs.readFileSync(REG_PATH, "utf8"));
  const exists = (data.tokens || []).some(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase() || t.address.toLowerCase() === address.toLowerCase()
  );
  if (exists) throw new Error("Token already exists by symbol or address");

  data.tokens.push({ symbol, address, decimals: Number(decimals), source: "custom" });
  fs.writeFileSync(REG_PATH, JSON.stringify(data, null, 2));
  return data.tokens;
}

module.exports = { listTokens, addToken, REG_PATH };
