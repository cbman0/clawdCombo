#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Ensure deps are installed
if [ ! -d node_modules ]; then
  npm install
fi

# Start local UI server
npm run ui:start
