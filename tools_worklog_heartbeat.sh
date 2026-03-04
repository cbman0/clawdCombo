#!/usr/bin/env bash
set -euo pipefail
LOG_FILE="/home/cbMan0/Desktop/gitStuff/clawdCombo/logs/build_live.log"
INTERVAL="${1:-30}"
TASK_FILE="/home/cbMan0/Desktop/gitStuff/clawdCombo/logs/current_task.txt"
MAX_SIZE=$((5*1024*1024))  # 5 MB
LOG_DIR=$(dirname "$LOG_FILE")
LOG_BASE=$(basename "$LOG_FILE")

rotate_log() {
  if [ -f "$LOG_FILE" ]; then
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    mv "$LOG_FILE" "${LOG_DIR}/${LOG_BASE}.${timestamp}"
    # Keep only the 5 most recent rotated logs
    ls -t "${LOG_DIR}/${LOG_BASE}".* 2>/dev/null | tail -n +6 | xargs -r rm -f
  fi
}

echo "[$(date -Iseconds)] heartbeat started (interval=${INTERVAL}s)" >> "$LOG_FILE"
while true; do
  # Rotate if log file exceeds max size
  if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $MAX_SIZE ]; then
    rotate_log
  fi
  TASK=""
  if [ -f "$TASK_FILE" ]; then
    TASK=$(tr -d '\n' < "$TASK_FILE")
  fi
  echo "[$(date -Iseconds)] alive | task=${TASK:-unspecified}" >> "$LOG_FILE"
  sleep "$INTERVAL"
done
