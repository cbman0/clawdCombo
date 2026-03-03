# clawdCombo Engineering Plan (Methodical Build)

## Delivery Principles
1. CLI-first implementation for each capability.
2. UI only wraps tested CLI behavior.
3. Single-purpose modules (replaceable, isolated failures).
4. Beginner-readable comments + docs.
5. Strict safety defaults (dry-run, allowlist, explicit live flags).

## Current Capability Matrix
- Wallet create/list with encrypted local backups ✅
- Wallet-to-wallet Amoy transfer ✅
- Native/token balance reads ✅
- Swap quote + indicative pricing ✅
- Swap execute pipeline (dry-run default, guarded live mode) ✅
- Custom token registry ✅
- Arb pair scan + watchlist scan ✅

## Next Iterations
1. Swap execution hardening
   - slippage validation against quote response
   - max gas / max value guardrails
   - post-trade balance delta report
2. Persistent watchlist scheduling
   - run loop worker using saved intervalSec
   - optional Telegram/Discord alert hooks for triggered opportunities
3. Oracle resilience
   - normalize POL symbols across providers
   - add fallback provider adapter interface
3. Arbitrage board
   - periodic scan runner
   - latency metrics and opportunity scoring
   - profitability model (fees + gas + spread)
4. Furucombo-like strategy compiler
   - JSON strategy schema
   - class-based pipeline compiler
   - atomic route builder
