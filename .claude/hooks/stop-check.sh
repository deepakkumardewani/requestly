#!/bin/bash
# Runs on every Claude Code Stop event.
# Formats git-changed files with Biome, then typechecks the whole project.
# Exits 2 on errors → asyncRewake wakes Claude to fix them automatically.

cd /Users/deepakdewani1/Documents/Programs/react/requestly

BIOME=./node_modules/.bin/biome
TSC=./node_modules/.bin/tsc

# ── Changed files (staged + unstaged vs HEAD) ─────────────────────────────────
CHANGED=$(git diff --name-only HEAD 2>/dev/null \
  | grep -E '\.(ts|tsx|js|jsx|json|css)$' \
  | tr '\n' ' ')

SECTIONS=""
HAS_ERRORS=0

# ── Biome: format + lint changed files ────────────────────────────────────────
if [ -n "$CHANGED" ]; then
  # shellcheck disable=SC2086  (word-splitting is intentional here for file list)
  BIOME_OUT=$($BIOME check --write $CHANGED 2>&1)
  SECTIONS="Biome (changed files):\n${BIOME_OUT}"
else
  SECTIONS="Biome: no changed files to check"
fi

# ── TypeScript: full project typecheck ────────────────────────────────────────
TSC_OUT=$($TSC --noEmit --skipLibCheck 2>&1)
TSC_STATUS=$?

if [ $TSC_STATUS -eq 0 ]; then
  SECTIONS="${SECTIONS}\n\nTypeScript: ✓ no errors"
else
  SECTIONS="${SECTIONS}\n\nTypeScript errors:\n${TSC_OUT}"
  HAS_ERRORS=1
fi

# ── Emit systemMessage so Claude Code displays the result in the UI ────────────
python3 -c "
import json, sys
print(json.dumps({'systemMessage': sys.argv[1]}))
" "$SECTIONS"

# Exit 2 triggers asyncRewake → Claude wakes up and fixes the errors
[ $HAS_ERRORS -eq 0 ] || exit 2
