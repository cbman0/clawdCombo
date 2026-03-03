#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Ensure deps are installed
if [ ! -d node_modules ]; then
  npm install
fi

# Start local UI server (WSL + Windows browser friendly)
export UI_HOST="${UI_HOST:-0.0.0.0}"
export UI_PORT="${UI_PORT:-4173}"
npm run ui:start
