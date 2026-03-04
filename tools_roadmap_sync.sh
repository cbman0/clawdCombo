#!/usr/bin/env bash
set -euo pipefail
SRC="/home/cbMan0/Desktop/gitStuff/clawdCombo/docs/BUILD_STATUS.md"
DST="/home/cbMan0/Documents/clawdcombo_roadmap.md"
LOG="/home/cbMan0/Desktop/gitStuff/clawdCombo/logs/build_live.log"
INTERVAL="${1:-300}"
MAX_SIZE=$((5*1024*1024))  # 5 MB
LOG_DIR=$(dirname "$LOG")
LOG_BASE=$(basename "$LOG")

rotate_log() {
  if [ -f "$LOG" ]; then
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    mv "$LOG" "${LOG_DIR}/${LOG_BASE}.${timestamp}"
    # Keep only the 5 most recent rotated logs
    ls -t "${LOG_DIR}/${LOG_BASE}".* 2>/dev/null | tail -n +6 | xargs -r rm -f
  fi
}

while true; do
  # Rotate if log file exceeds max size
  if [ -f "$LOG" ] && [ $(stat -c%s "$LOG" 2>/dev/null || echo 0) -gt $MAX_SIZE ]; then
    rotate_log
  fi
  NOW=$(date '+%Y-%m-%d %H:%M:%S %Z')
  {
    echo "# clawdCombo Roadmap (Live)"
    echo
    echo "_Last updated: ${NOW}_"
    echo
    cat "$SRC"
    echo
    echo "## Notes"
    echo "- This file refreshes every 5 minutes."
    echo "- Live activity log: /home/cbMan0/Desktop/gitStuff/clawdCombo/logs/build_live.log"
  } > "$DST"
  echo "[$(date -Iseconds)] roadmap sync updated" >> "$LOG"
  sleep "$INTERVAL"
done
