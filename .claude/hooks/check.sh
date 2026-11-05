#!/usr/bin/env bash
# .claude/hooks/check.sh: lint and type-check after each edit
cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ ! -d node_modules ]; then
  exit 0
fi
if ! out=$(pnpm -s lint && pnpm -s typecheck 2>&1); then
  echo "$out" >&2
  exit 2
fi
