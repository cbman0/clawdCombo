#!/usr/bin/env node
const { createWallet, listWallets } = require("../cli/wallets");

async function main() {
  const cmd = process.argv[2];
  const arg = process.argv[3];

  if (cmd === "wallet:create") {
    const created = await createWallet(arg);
    console.log(JSON.stringify(created, null, 2));
    return;
  }

  if (cmd === "wallet:list") {
    console.log(JSON.stringify({ wallets: listWallets() }, null, 2));
    return;
  }

  console.log(`Usage:\n  wallet:create <alias>\n  wallet:list`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
