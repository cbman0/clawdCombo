# clawdCombo

A Furucombo-inspired DeFi strategy executor focused on transparent, modular action pipelines and flashloan-assisted execution.

## Vision

`clawdCombo` aims to replicate and improve the core UX/architecture pattern:
- Chain multiple DeFi actions into one atomic transaction
- Keep protocol adapters modular and auditable
- Add stronger simulation + safety checks before execution

## Initial Scope (Phase 0)

- [x] Repository scaffold
- [x] Architecture + contract mapping notes
- [x] Core contract stubs (`Router`, `Executor`, `AdapterRegistry`)
- [x] Local test harness + executable combo demo
- [x] Wallet CLI with encrypted hidden backups
- [x] Modular HTML UI wired to CLI service modules
- [x] Swap quote + guarded swap execution pipeline
- [x] Oracle + custom token registry + arbitrage scanner modules
- [ ] Polygon-first production adapters (Aave/Uniswap/1inch style)
- [ ] Strategy builder JSON format + compiler

## Project Structure

- `contracts/core` — core execution contracts
- `contracts/interfaces` — adapter + callback interfaces
- `contracts/libraries` — shared types/validation helpers
- `scripts` — deployment + verification scripts
- `docs` — research, architecture, deployed-address notes
- `config` — chain configs
- `test` — unit + integration tests

## Notes from Furucombo ecosystem research

Furucombo docs point to Protocolink for deployed backend contract addresses:
- https://docs.furucombo.app/resources/deployed-contracts
- https://docs.protocolink.com/smart-contract/deployment-addresses

Those references will guide compatibility + migration helpers while we build native clawdCombo contracts.
