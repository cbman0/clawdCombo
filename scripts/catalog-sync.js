#!/usr/bin/env node
const { fetchTop200, saveCatalog } = require("../cli/catalog");

async function main() {
  const items = await fetchTop200();
  const payload = saveCatalog(items);
  console.log(JSON.stringify({ ok: true, generatedAt: payload.generatedAt, count: payload.count }, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
