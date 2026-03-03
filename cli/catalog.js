require("dotenv").config();
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, ".clawdcombo", "catalog.top200.json");

async function fetchTop200() {
  // CoinGecko public endpoint (no key required for small usage)
  const perPage = 100;
  const pages = [1, 2];
  const all = [];

  for (const page of pages) {
    const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    url.searchParams.set("sparkline", "false");
    url.searchParams.set("price_change_percentage", "24h");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Top200 fetch failed: HTTP ${res.status}`);
    const json = await res.json();

    const normalized = json.map((c) => ({
      id: c.id,
      symbol: String(c.symbol || "").toUpperCase(),
      name: c.name,
      rank: c.market_cap_rank,
      priceUsd: c.current_price,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      change24hPct: c.price_change_percentage_24h,
      image: c.image,
      lastUpdated: c.last_updated,
    }));

    all.push(...normalized);
  }

  return all.slice(0, 200);
}

function saveCatalog(items) {
  const dir = path.dirname(OUT_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "coingecko_markets_top200",
    count: items.length,
    items,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  return payload;
}

function readCatalog() {
  if (!fs.existsSync(OUT_PATH)) return null;
  return JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
}

module.exports = { fetchTop200, saveCatalog, readCatalog, OUT_PATH };
