#!/usr/bin/env bash
set -euo pipefail

# Load shared rotation library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/log-rotation-lib.sh"

# Configuration
SRC="/home/cbMan0/Desktop/gitStuff/clawdCombo/docs/BUILD_STATUS.md"
DST="/home/cbMan0/Documents/clawdcombo_roadmap.md"
LOG="/home/cbMan0/Desktop/gitStuff/clawdCombo/logs/build_live.log"
INTERVAL="${1:-300}"

# Override defaults
MAX_SIZE=$((5*1024*1024))  # 5 MB
MAX_DAYS=7
MAX_FILES=10
COMPRESS=true

while true; do
  # Check if rotation needed
  rotate_if_needed "$LOG" "$MAX_SIZE"

  # Sync roadmap
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
