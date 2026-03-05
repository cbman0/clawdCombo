# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Health Watchdog (Improved)** – Enhanced gateway monitoring with better logging and recovery
  - Configurable via environment variables (HEALTH_*)
  - JSON structured logging option (HEALTH_LOG_JSON)
  - Exponential backoff for restart attempts (maxRestartAttempts)
  - Metrics collection (latency, success rate, restart count)
  - Graceful shutdown handling (SIGINT/SIGTERM)
  - Improved state persistence and alert deduplication
  - Better error handling and timeouts
  - Comprehensive documentation with systemd integration examples
- **Log Rotation Library** – Shared bash library for consistent log management
  - `tools/log-rotation-lib.sh` with size-based rotation, compression, age+count retention
  - Updated `tools_worklog_heartbeat.sh` and `tools_roadmap_sync.sh` to use shared library
  - Reduces code duplication across scripts

### Changed
- Health watchdog now uses configurable health check URL and interval
- Improved restart throttling with restartDelay and maxRestartAttempts
- Better logging with timestamps, severity levels, and optional JSON format
- State file now includes metrics tracking

## [0.2.0] - 2026-03-04

### Added
- Health monitoring and auto-recovery system
- Interactive commit helper (tools/commit_helper.sh)
- Log rotation in heartbeat and roadmap sync scripts (5MB limit)
- ESLint configuration with Husky pre-commit hooks
- Prettier formatting for consistent code style

### Changed
- Updated dependencies and tooling

## [0.1.0] - 2025-02-xx

### Added
- Initial project scaffold
- Core contract stubs (Router, Executor, AdapterRegistry)
- Wallet CLI with encrypted backups
- Modular HTML UI with Express backend
- Swap execution pipeline with guardrails
- Oracle, token registry, and arbitrage scanner modules
- Hardhat test harness and demo scripts
