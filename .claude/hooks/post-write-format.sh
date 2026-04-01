#!/bin/bash
# PostToolUse: auto-fix Biome formatting + import sorting after Write/Edit.
# Runs biome check --write on the specific file immediately after Claude writes it.

cd /Users/deepakdewani1/Documents/Programs/react/requestly

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  echo '{"continue":true}'
  exit 0
fi

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -f "$FILE" ] && echo "$FILE" | grep -qE '\.(ts|tsx|js|jsx|json|css)$'; then
  ./node_modules/.bin/biome check --write "$FILE" 2>/dev/null
fi

echo '{"continue":true}'
