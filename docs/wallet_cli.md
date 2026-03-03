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

## Notes for real testnet transfers (Amoy)
To move real Amoy POL between managed wallets, add a funded private key flow next (`FUNDER_PRIVATE_KEY`) and run against `--network amoy`.
