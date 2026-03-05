#!/usr/bin/env bash
set -euo pipefail

# Load shared rotation library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/log-rotation-lib.sh"

# Configuration
LOG_FILE="/home/cbMan0/Desktop/gitStuff/clawdCombo/logs/build_live.log"
INTERVAL="${1:-30}"
TASK_FILE="/home/cbMan0/Desktop/gitStuff/clawdCombo/logs/current_task.txt"

# Override defaults if needed
MAX_SIZE=$((5*1024*1024))  # 5 MB
MAX_DAYS=7
MAX_FILES=10
COMPRESS=true

echo "[$(date -Iseconds)] heartbeat started (interval=${INTERVAL}s, rotation: size ${MAX_SIZE}B, age ${MAX_DAYS}d, keep ${MAX_FILES})" >> "$LOG_FILE"

while true; do
  # Check if rotation needed (size-based)
  rotate_if_needed "$LOG_FILE" "$MAX_SIZE"

  # Write heartbeat
  TASK=""
  if [ -f "$TASK_FILE" ]; then
    TASK=$(tr -d '\n' < "$TASK_FILE")
  fi
  echo "[$(date -Iseconds)] alive | task=${TASK:-unspecified}" >> "$LOG_FILE"

  sleep "$INTERVAL"
done
