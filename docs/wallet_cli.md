# Wallet CLI + Local Transaction Demo

## Hidden backup storage
Backups are stored in:
- `.clawdcombo/secrets/*.json` (encrypted wallet files)
- `.clawdcombo/secrets/wallets.json` (alias/address index)
- `.clawdcombo/tx-history.json` (transaction log)

`.clawdcombo/` is gitignored and never pushed.

## Create wallets
```bash
cd /home/cbMan0/Desktop/gitStuff/clawdCombo
export WALLET_BACKUP_PASSWORD='choose-a-strong-password'
npm run wallet:create -- devA
npm run wallet:create -- devB
npm run wallet:list
```

## Run local transfer demo
```bash
export WALLET_BACKUP_PASSWORD='choose-a-strong-password'
npx hardhat run scripts/tx-demo.js -- local devA devB 0.0001
```

This will:
1. Decrypt `devA` and `devB`
2. Fund `devA` from a local Hardhat account
3. Send ETH from `devA` -> `devB`
4. Log receipt + balances to `.clawdcombo/tx-history.json`

## Real Polygon Amoy transfer demo
Populate `.env` with:
- `WALLET_BACKUP_PASSWORD`
- `AMOY_RPC_URL`
- `FUNDER_PRIVATE_KEY` (or `DEPLOYER_PRIVATE_KEY`)
- optional: `FROM_ALIAS`, `TO_ALIAS`, `AMOY_AMOUNT_POL`, `AMOY_SEED_POL`

Then run:
```bash
npm run tx:demo:amoy
```

It will:
1. decrypt wallet aliases from hidden backups
2. optionally seed sender wallet from funder
3. send POL from one managed wallet to another
4. log tx history to `.clawdcombo/tx-history.json`
