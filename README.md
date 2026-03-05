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
- `cli` — headless service modules and strategy logic
- `ui` — modular HTML GUI + local API server
- `desktop` — Electron one-click desktop launcher
- `scripts` — deployment + verification scripts
- `docs` — research, architecture, deployed-address notes
- `config` — chain configs
- `test` — unit + integration tests

## Notes from Furucombo ecosystem research

Furucombo docs point to Protocolink for deployed backend contract addresses:
- https://docs.furucombo.app/resources/deployed-contracts
- https://docs.protocolink.com/smart-contract/deployment-addresses

Those references will guide compatibility + migration helpers while we build native clawdCombo contracts.

---

## 🛡️ Guardrails & Automation

This project enforces code quality and consistency through automated guardrails.

### Pre-commit Hooks

**Husky + lint-staged** run automatically before each commit:

- ✅ **ESLint** – JavaScript/TypeScript linting with `eslint.config.js`
- ✅ **Prettier** – Code formatting for .js, .json, .yaml, .sol files
- ❌ Blocks commit if any check fails

The hooks are installed automatically on `npm install` via the `prepare` script.

**To skip hooks** (not recommended):
```bash
git commit --no-verify -m "your message"
```

### Commit Message Standards

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```text
type(scope): subject
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`

Example: `feat(api): add health check endpoint`

We provide an interactive **commit helper** to ensure proper formatting:

```bash
npm run commit
```

This guided tool helps you select type, add scope, write subject, and validate the message before committing.

### Continuous Health Monitoring

The **Health Watchdog** (`tools/health-watchdog.js`) monitors the UI/API server:

- Checks `/healthz` endpoint every 30 seconds (configurable)
- Auto-restarts UI service on failure (with throttling)
- Logs all events to `logs/build_live.log`
- Persists state in `logs/health-watchdog.state.json`
- Sends alerts when service becomes unhealthy or recovers

Start it:
```bash
npm run health:watchdog
```

Or run as daemon:
```bash
node tools/health-watchdog.js &
```

Configuration via environment variables:
- `HEALTH_URL` – health check endpoint (default: `http://localhost:4173/healthz`)
- `HEALTH_INTERVAL` – check interval in seconds (default: `30`)
- `HEALTH_AUTO_RESTART` – set to `false` to disable auto-restart
- `HEALTH_MAX_RETRIES` – consecutive failures before alert (default: `3`)
- `HEALTH_ALERT_COOLDOWN` – seconds between repeat alerts (default: `3600`)

See `tools/HEALTH-WATCHDOG.md` for full documentation.

### Log Rotation

The `logs/build_live.log` file is automatically rotated to prevent unbounded growth.

**Rotation policy:**
- Size-based: Rotate when log exceeds 5 MB (configurable)
- Retention: Keep up to 10 rotated files, compress old ones
- Retention by age: Delete logs older than 7 days

The log rotation library (`tools/log-rotation-lib.sh`) is used by:
- `tools_worklog_heartbeat.sh` – heartbeats and task logging
- `tools_roadmap_sync.sh` – roadmap sync status

Manual rotation:
```bash
# If using the heartbeat script, rotation is automatic
# For other logs, you can call the library directly:
source tools/log-rotation-lib.sh
LOG_FILE=/path/to/log rotate_log
```

### Code Quality

**ESLint** enforces JavaScript/TypeScript best practices with the configuration in `eslint.config.js`.

**Prettier** ensures consistent formatting across all codebases.

Run manually:
```bash
npm run lint    # Check for issues
npm run format  # Auto-format all files
```

---

## ✅ Verification & Testing

### Quick Health Check

Verify the system is running correctly:

```bash
# Check UI health endpoint
curl http://localhost:4173/healthz

# Expected response:
# {"ok":true,"service":"clawdCombo-ui","host":"0.0.0.0","port":4173}

# Check that health watchdog is running
ps aux | grep health-watchdog

# View recent logs
tail -f logs/build_live.log | grep -E "(ALERT|recovered|FAILED)"
```

### Automated Checks

Run the full verification suite:

```bash
# Lint all files
npm run lint

# Format check (will auto-fix)
npm run format

# Run tests
npm test

# Check commit helper
node tools/commit-helper.js --dry-run
```

### Test the Guardrails

Test that pre-commit hooks are installed:

```bash
# Create a file with linting errors
cat > test.js << 'EOF'
const x=1; let y=2; console.log(x+y)
EOF

# Stage and commit – should fail
git add test.js
git commit -m "test: verify linting" 2>&1 | grep -i "error\|failed"

# Fix with formatting
npm run format
rm test.js
```

### Deploy Verification

For contract deployments, use the provided scripts:

```bash
# Deploy adapters to Amoy testnet
npm run deploy:adapters:amoy

# Verify deployed contracts on Polygonscan
npm run verify:adapters
```

---

## 📋 NPM Scripts Reference

### Development

| Script | Description |
|--------|-------------|
| `npm run build` | Compile Hardhat contracts |
| `npm run test` | Run test suite |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier auto-format |
| `npm run commit` | Launch interactive commit helper |
| `npm run demo` | Run demo execution |

### Services

| Script | Description |
|--------|-------------|
| `npm run ui:start` | Start UI/API server (port 4173) |
| `npm run health:watchdog` | Start health monitor (daemon) |
| `npm run catalog:sync` | Sync token catalog |
| `npm run watchlist:scheduler` | Start watchlist scheduler |
| `npm run desktop:start` | Launch Electron desktop app |

### Wallet Management

| Script | Description |
|--------|-------------|
| `npm run wallet:create` | Create new wallet |
| `npm run wallet:list` | List wallets |

### Deployment

| Script | Description |
|--------|-------------|
| `npm run deploy:adapters:mainnet` | Deploy adapters to mainnet |
| `npm run deploy:adapters:amoy` | Deploy adapters to Amoy testnet |
| `npm run deploy:adapters:sepolia` | Deploy adapters to Sepolia |
| `npm run verify:adapters` | Verify deployed contracts |

---

## 🔧 Customization

### Adjust Linting Rules

Edit `eslint.config.js` and `.lintstagedrc.json` to customize which files run through which checks.

Example: Add TypeScript support:
```json
{
  "*.{js,ts}": ["eslint --fix", "prettier --write"]
}
```

### Change Health Check URL

Set `HEALTH_URL` environment variable:

```bash
export HEALTH_URL=http://localhost:8080/health
npm run health:watchdog
```

Or modify the default in `tools/health-watchdog.js`.

### Modify Log Rotation

Edit `tools/log-rotation-lib.sh` to change:
- `MAX_SIZE` – rotation threshold (default 5MB)
- `MAX_DAYS` – days to keep logs (default 7)
- `MAX_FILES` – max rotated files (default 10)
- `COMPRESS` – enable/disable gzip (default true)

---

## 🚨 Troubleshooting

### Pre-commit hook not running

```bash
# Check if hooks are linked
ls -la .git/hooks/pre-commit

# If missing, reinstall
npm run prepare
# or manually: ln -sf .husky/pre-commit .git/hooks/
```

### Linting errors I can't fix

```bash
# Auto-fix what can be fixed
npm run format

# For remaining ESLint errors, review the rule violations
npm run lint

# To temporarily bypass (not recommended):
git commit --no-verify -m "message"
```

### Health watchdog not starting UI

```bash
# Verify UI can start manually
npm run ui:start

# Check for port conflicts
lsof -i :4173

# Ensure .env file exists with required variables
cat .env.example
```

### Logs growing too large

Check rotation settings in `tools/log-rotation-lib.sh`. You can also set up external logrotate:

```bash
# /etc/logrotate.d/clawdcombo
/home/cbMan0/Desktop/gitStuff/clawdcombo/logs/*.log {
  daily
  rotate 30
  compress
  missingok
  notifempty
}
```

---

## 📚 Additional Documentation

- `tools/HEALTH-WATCHDOG.md` – Health monitoring guide
- `tools/COMMIT-HELPER.md` – Commit helper documentation
- `eslint.config.js` – Linting rules
- `.prettierrc` – Formatting rules
- `hardhat.config.js` – Build configuration
- `CHANGELOG.md` – Project history

---

## 🎯 Quick Start for New Contributors

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd clawdCombo
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your RPC URL and keys
   ```

3. **Start UI server:**
   ```bash
   npm run ui:start
   ```

4. **Start health watchdog** (optional but recommended):
   ```bash
   npm run health:watchdog &
   ```

5. **Make changes** and use `npm run commit` for proper commit messages.

6. **Run tests** before pushing:
   ```bash
   npm test
   ```

7. **Push** to your branch and open a PR.

---

**Key Principle:** Automation catches issues early. Respect the guardrails – they exist to maintain code quality and prevent bugs from reaching production.
