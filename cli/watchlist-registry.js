const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FILE_PATH = path.join(ROOT, ".clawdcombo", "arb.watchlist.json");

const DEFAULT = {
  thresholdPct: 1,
  intervalSec: 60,
  pairs: [],
};

function ensure() {
  const dir = path.dirname(FILE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(DEFAULT, null, 2));
  }
}

function getWatchlist() {
  ensure();
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

function saveWatchlist(input) {
  ensure();
  const normalized = {
    thresholdPct: Number(input.thresholdPct ?? 1),
    intervalSec: Number(input.intervalSec ?? 60),
    pairs: Array.isArray(input.pairs) ? input.pairs : [],
  };
  fs.writeFileSync(FILE_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

module.exports = { getWatchlist, saveWatchlist, FILE_PATH };
