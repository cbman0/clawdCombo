# clawdCombo Engineering Plan

## Delivery Principles

1. CLI-first implementation for each capability.
2. UI only wraps tested CLI behavior.
3. Single-purpose modules (replaceable, isolated failures).
4. Beginner-readable comments + docs.
5. Strict safety defaults (dry-run, allowlist, explicit live flags).

---

## ✅ Completed (as of March 5, 2026)

### Core Foundation

- [x] Repo scaffold + git + GitHub main branch
- [x] Hardhat build + contract compile/test baseline
- [x] Core contracts: Router, AdapterRegistry, MockAdapter
- [x] Executable local combo demo

### Wallet & Transfer Layer

- [x] Encrypted wallet backups in hidden local folder
- [x] Wallet CLI (create/list)
- [x] Local wallet-to-wallet transaction demo
- [x] Polygon Amoy wallet-to-wallet transfer demo (on-chain)

### Modular App Architecture

- [x] CLI-first service modules
- [x] Modular HTML UI (single-purpose files)
- [x] API layer with timeout/error handling
- [x] Desktop one-click launcher (Electron)

### Trading & Market Features

- [x] Swap quote flow (aggregator-based)
- [x] Guarded swap execution pipeline (dry-run default)
- [x] Token registry (custom tokens)
- [x] Price oracle module (multi-source structure)
- [x] Arbitrage pair scanner + threshold
- [x] Arbitrage watchlist persistence + runner metrics
- [x] Top-200 catalog sync + UI panel
- [x] Modern UI redesign (premium/production look)
- [x] Easy Mode vs Advanced Mode UX split
- [x] Swap desk polish (Uniswap-style interaction flow)
- [x] Portfolio panel polish (Rainbow-style readability)
- [x] Strategy composer panel scaffold (Furucombo-inspired)

### Adapter Expansion

- [x] Uniswap V3 adapter + hardening (slippage, fee tiers, max amount)
- [x] 1inch adapter + hardening (input validation, slippage, DEX flags)
- [x] Aave V3 Flashloan adapter + hardening (input validation, max amount, whitelist)
- [x] SushiSwap adapter contract
- [x] QuickSwap adapter contract

### Execution Hardening

- [x] Swap execution hardening (slippage/gas guardrails)
- [x] Oracle normalization + fallback reliability
- [x] Watchlist scheduler (interval runner + alerts)
- [x] Strategy builder JSON format (draft)

---

## 🔄 In Progress

- Strategy compiler implementation
- Unit tests for adapters

---

## 📋 Pending

- End-to-end strategy execution hardening
- Production adapter contract integration
- Strategy compiler final implementation

---

## Quick Reference

| Feature                                | Status         |
| -------------------------------------- | -------------- |
| Wallet create/list + encrypted backups | ✅ Done        |
| Wallet-to-wallet Amoy transfer         | ✅ Done        |
| Swap quote + execute pipeline          | ✅ Done        |
| Custom token registry                  | ✅ Done        |
| Arb pair scan + watchlist              | ✅ Done        |
| Swap execution hardening               | ✅ Done        |
| Adapter expansion (5 protocols)        | ✅ Done        |
| Strategy builder JSON                  | ✅ Done        |
| Strategy compiler                      | 🔄 In Progress |
| Unit tests                             | 🔄 In Progress |
