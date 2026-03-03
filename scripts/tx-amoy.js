#!/usr/bin/env node
require("dotenv").config();

const { transferAmoy } = require("../cli/amoy");

async function main() {
  const result = await transferAmoy({
    fromAlias: process.env.FROM_ALIAS || "devA",
    toAlias: process.env.TO_ALIAS || "devB",
    preset: (process.env.AMOY_AMOUNT_PRESET || "medium").toLowerCase(),
    amountOverride: process.env.AMOY_AMOUNT_POL || undefined,
    seedPol: process.env.AMOY_SEED_POL || "0.01",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
