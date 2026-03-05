#!/usr/bin/env bash
# Shared log rotation library for clawdCombo
# Source this file to get the rotate_log function

set -euo pipefail

# Default configuration (can be overridden by caller)
LOG_FILE="${LOG_FILE:-}"
LOG_DIR="${LOG_DIR:-}"
LOG_BASE="${LOG_BASE:-}"
MAX_SIZE="${MAX_SIZE:-5242880}"          # 5 MB default
MAX_DAYS="${MAX_DAYS:-7}"                # Keep logs for 7 days
MAX_FILES="${MAX_FILES:-10}"             # Keep up to 10 rotated files
COMPRESS="${COMPRESS:-true}"             # Enable gzip compression

# Stats tracking
ROTATE_COUNT=0
BYTES_ROTATED=0

rotate_log() {
  local log_path="${1:-${LOG_FILE}}"
  local log_dir="$(dirname "$log_path")"
  local log_base="$(basename "$log_path")"

  if [ ! -f "$log_path" ]; then
    return 0
  fi

  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local rotated_name="${log_base}.${timestamp}"
  local rotated_path="${log_dir}/${rotated_name}"

  # Ensure log directory exists
  if [ ! -d "$log_dir" ]; then
    mkdir -p "$log_dir"
  fi

  # Rotate (atomic move)
  mv "$log_path" "$rotated_path"
  ROTATE_COUNT=$((ROTATE_COUNT + 1))
  BYTES_ROTATED=$((BYTES_ROTATED + $(stat -c%s "$rotated_path" 2>/dev/null || echo 0)))

  echo "[$(date -Iseconds)] Log rotated: $log_base → $rotated_name (size: $(numfmt --to=iec $(stat -c%s "$rotated_path" 2>/dev/null || echo 0)))"

  # Compress if enabled
  if [ "$COMPRESS" = "true" ]; then
    gzip -q "$rotated_path" 2>/dev/null && {
      rotated_path="${rotated_path}.gz"
      echo "[$(date -Iseconds)] Compressed: ${rotated_name}.gz"
    } || true
  fi

  # Cleanup old files by age (MAX_DAYS)
  local cutoff
  cutoff=$(date -d "${MAX_DAYS} days ago" +%s 2>/dev/null || date -v-"${MAX_DAYS}"d +%s 2>/dev/null || true)
  if [ -n "$cutoff" ]; then
    find "$log_dir" -maxdepth 1 -name "${log_base}.*" -type f | while read -r old_file; do
      local file_mtime
      file_mtime=$(stat -c %Y "$old_file" 2>/dev/null || true)
      if [ -n "$file_mtime" ] && [ "$file_mtime" -lt "$cutoff" ]; then
        rm -f "$old_file"
        echo "[$(date -Iseconds)] Deleted old log: $(basename "$old_file") (older than ${MAX_DAYS} days)"
      fi
    done
  fi

  # Cleanup by count (keep MAX_FILES most recent)
  local files_to_keep
  files_to_keep=$(ls -t "$log_dir/${log_base}".* 2>/dev/null | head -n "$MAX_FILES" || true)
  if [ -n "$files_to_keep" ]; then
    ls -t "$log_dir/${log_base}".* 2>/dev/null | tail -n +$((MAX_FILES + 1)) | while read -r old_file; do
      rm -f "$old_file"
      echo "[$(date -Iseconds)] Deleted excess log: $(basename "$old_file") (keep max $MAX_FILES)"
    done
  fi

  # Create new empty log file with proper permissions
  : > "$log_path"
  chmod 644 "$log_path" 2>/dev/null || true
}

should_rotate_size() {
  local log_path="${1:-${LOG_FILE}}"
  local max_size="${2:-${MAX_SIZE}}"

  if [ ! -f "$log_path" ]; then
    return 1
  fi

  local size
  size=$(stat -c%s "$log_path" 2>/dev/null || echo 0)
  [ "$size" -ge "$max_size" ]
}

should_rotate_time() {
  local log_path="${1:-${LOG_FILE}}"
  local rotate_hour="${2:-0}"  # Default: rotate at midnight

  if [ ! -f "$log_path" ]; then
    return 1
  fi

  local last_mod
  last_mod=$(stat -c %Y "$log_path" 2>/dev/null || echo 0)
  local last_hour
  last_hour=$(date -d @"$last_mod" +%H 2>/dev/null || date -r "$last_mod" +%H 2>/dev/null || echo 0)

  [ "$last_hour" -ne "$rotate_hour" ]
}

rotate_if_needed() {
  local log_path="${1:-${LOG_FILE}}"
  local max_size="${2:-${MAX_SIZE}}"

  if should_rotate_size "$log_path" "$max_size"; then
    echo "[$(date -Iseconds)] Size threshold reached ($(numfmt --to=iec $(stat -c%s "$log_path" 2>/dev/null || echo 0)) > $(numfmt --to=iec "$max_size")), rotating..."
    rotate_log "$log_path"
    return 0
  fi
  return 1
}

# Print rotation statistics
rotate_stats() {
  echo "Rotation summary:"
  echo "  Files rotated: $ROTATE_COUNT"
  echo "  Bytes rotated: $(numfmt --to=iec "$BYTES_ROTATED")"
}
