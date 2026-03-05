# clawdCombo 🦞

**Furucombo-inspired DeFi strategy executor** with modular action pipelines, flashloan-assisted execution, and hardened swap guardrails.

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Hardhat
- Polygon RPC (Amoy testnet / Mainnet)

### Installation

```bash
# Clone the repo
git clone https://github.com/cbman0/clawdCombo.git
cd clawdCombo

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

---

## 🖥️ Usage Modes

### 1. CLI (Primary)

```bash
# Start the CLI
node cli/index.js --help

# Wallet operations
node cli/index.js wallet create
node cli/index.js wallet list
node cli/index.js wallet transfer --to <address> --amount 100

# Swap
node cli/index.js swap --from USDC --to WETH --amount 1000

# Get quote
node cli/index.js quote --from USDC --to WETH --amount 1000

# Oracle price
node cli/index.js oracle price --token USDC
```

### 2. UI Server

```bash
# Start the UI server
node ui/server.js

# Then open http://localhost:3000 in your browser
```

### 3. Desktop App (Electron)

```bash
# Launch the desktop app
npm run electron
```

---

## 💼 Wallet Support

| Feature | Status | Notes |
|---------|--------|-------|
| Create wallet | ✅ Works | Encrypted local storage |
| List wallets | ✅ Works | Shows all saved wallets |
| Import existing | ⚠️ Todo | Not yet implemented |
| Private wallet | ✅ Works | Your keys, your funds |
| Watch-only | ⚠️ Todo | View-only addresses |
| Hardware wallet | ⏳ Future | Ledger/Trezor support |

**Security:** Wallets are encrypted at rest using a local passphrase. Never share your keys.

---

## 🔄 What Works

| Feature | Status | Network |
|---------|--------|---------|
| Wallet create/list | ✅ Done | Local |
| Encrypted backups | ✅ Done | Local |
| Wallet-to-wallet transfer | ✅ Done | Polygon Amoy |
| Native token balance | ✅ Done | Polygon |
| ERC20 balance | ✅ Done | Polygon |
| Swap quote (indicative) | ✅ Done | 1inch API |
| Swap execution | ✅ Done | Polygon |
| Custom token registry | ✅ Done | Local config |
| Price oracle | ✅ Done | Multi-source |
| Arbitrage pair scanner | ✅ Done | Local |
| Watchlist persistence | ✅ Done | Local |

---

## ⚠️ Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Mainnet deployment | ⏳ Pending | Requires more testing |
| Strategy compiler | 🔄 WIP | JSON format drafted |
| Unit tests | 🔄 WIP | Adapters need tests |
| Hardware wallet | ⏳ Future | Not started |
| Multi-chain (non-Polygon) | ⏳ Future | Polygon only for now |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  UI (Electron + HTML/CSS/JS)           │
├─────────────────────────────────────────┤
│  CLI Service Layer (Node.js)           │
├─────────────────────────────────────────┤
│  Smart Contracts (Solidity + Hardhat)  │
├─────────────────────────────────────────┤
│  Polygon (Amoy → Mainnet)              │
└─────────────────────────────────────────┘
```

### Supported DEX Adapters
- **Uniswap V3** - ✅ Hardened (slippage, fee tiers)
- **SushiSwap** - ✅ Done
- **QuickSwap** - ✅ Done
- **1inch** - ✅ Hardened (DEX flags, validation)
- **Aave V3 Flashloan** - ✅ Hardened (whitelist, max amount)

---

## 📁 Project Structure

```
clawdCombo/
├── contracts/           # Solidity smart contracts
│   ├── adapters/        # DEX adapters
│   ├── core/            # Router, Executor
│   └── interfaces/      # Contract interfaces
├── cli/                 # CLI service modules
├── ui/                  # Web UI
├── scripts/             # Deployment & utility scripts
├── docs/                # Documentation
│   └── BUILD_STATUS.md  # Roadmap & progress
└── tests/               # Contract tests
```

---

## 🔧 Configuration

Create a `.env` file:

```env
# Polygon Amoy (testnet)
RPC_URL=https://rpc-amoy.polygon.ya

# Polygon Mainnet
# RPC_URL=https://polygon-rpc.com

# 1inch API (for quotes)
ONE_INCH_API_KEY=your_key_here

# Wallet encryption
WALLET_PASSPHRASE=your_secure_passphrase
```

---

## 📞 Support

- Check `docs/BUILD_STATUS.md` for roadmap
- Issues: https://github.com/cbman0/clawdCombo/issues

---

## License

MIT
