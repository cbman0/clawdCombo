#!/usr/bin/env bash
# Commit Helper: generates standardized conventional commit messages.
# Usage: bash tools/commit_helper.sh [--type <type>] [--scope <scope>] [--message <msg>] [--dry-run]
# If arguments omitted, runs interactively.

set -euo pipefail

# Defaults
COMMIT_TYPE=""
SCOPE=""
DESCRIPTION=""
DRY_RUN=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--type)
      COMMIT_TYPE="$2"
      shift 2
      ;;
    -s|--scope)
      SCOPE="$2"
      shift 2
      ;;
    -m|--message)
      DESCRIPTION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--type <type>] [--scope <scope>] [--message <msg>] [--dry-run]"
      exit 1
      ;;
  esac
done

# Interactive prompts if not provided
if [[ -z "$COMMIT_TYPE" ]]; then
  echo "Select commit type:"
  echo "  1) feat     - new feature"
  echo "  2) fix      - bug fix"
  echo "  3) docs     - documentation changes"
  echo "  4) style    - code style changes (formatting, no code change)"
  echo "  5) refactor - code refactoring"
  echo "  6) test     - adding or fixing tests"
  echo "  7) chore    - build process, tooling, etc."
  echo "  8) ci       - CI/CD changes"
  read -p "Enter number (1-8): " type_choice
  case "$type_choice" in
    1) COMMIT_TYPE="feat" ;;
    2) COMMIT_TYPE="fix" ;;
    3) COMMIT_TYPE="docs" ;;
    4) COMMIT_TYPE="style" ;;
    5) COMMIT_TYPE="refactor" ;;
    6) COMMIT_TYPE="test" ;;
    7) COMMIT_TYPE="chore" ;;
    8) COMMIT_TYPE="ci" ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac
fi

if [[ -z "$SCOPE" ]]; then
  read -p "Enter scope (optional, e.g., 'ui', 'contracts', 'api'): " SCOPE
fi

if [[ -z "$DESCRIPTION" ]]; then
  read -p "Enter short description: " DESCRIPTION
fi

# Build commit message
if [[ -n "$SCOPE" ]]; then
  COMMIT_MSG="${COMMIT_TYPE}(${SCOPE}): ${DESCRIPTION}"
else
  COMMIT_MSG="${COMMIT_TYPE}: ${DESCRIPTION}"
fi

echo "Proposed commit message:"
echo "  $COMMIT_MSG"
echo

if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry run enabled. No commit created."
  exit 0
fi

read -p "Create commit? (y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "Commit created."
else
  echo "Aborted."
  exit 0
fi
