# Modular UI Architecture

The HTML UI is split by single-purpose modules under `ui/public/modules`:

- `status.js` — environment/runtime health
- `wallets.js` — wallet create/list
- `transfer.js` — wallet-to-wallet transfer
- `portfolio.js` — native + ERC20 balance checks
- `swap.js` — swap quote retrieval (aggregator)
- `tokens.js` — custom token registry management
- `oracles.js` — multi-source price checks
- `arb.js` — gap scanner + threshold trigger
- `history.js` — transaction history viewer
- `app.js` — main class-based composition entrypoint

Backend API (`ui/server.js`) calls tested CLI modules in `cli/`.

## Why this setup
- One broken feature does not break the whole UI.
- Easier testing, replacement, and maintenance.
- CLI remains source of truth; UI is orchestration layer.

## Current swap state
- Working: quote retrieval (route/price/issues) via API
- Next: signed execution path for quote transaction with robust allowance + slippage controls
