#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="${1:-$HOME/.ssh/openclaw_github_ed25519}"

eval "$(ssh-agent -s)"
ssh-add "$KEY_PATH"

echo "SSH agent ready with key: $KEY_PATH"
