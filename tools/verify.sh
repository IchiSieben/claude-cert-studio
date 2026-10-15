#!/usr/bin/env bash
# The ONE command an enjambre agent may run in this repo (AGENTS.md `tests-cmd`). It dispatches on
# the one-word lane the agent writes into `.enjambre-lane` (gitignored):
#   (absent) / verify -> bank validator + e2e tests (Playwright over file://)
#   media             -> tools/mac/media.sh (card clip + README captures from the live app)
# Same on Windows (Git Bash) and macOS.
set -uo pipefail
cd "$(dirname "$0")/.."
lane=$(tr -d '[:space:]' < .enjambre-lane 2>/dev/null || echo verify)
echo "verify.sh: lane=${lane:-verify} node=$(node -v 2>/dev/null) platform=$(uname -s)"
if [ ! -d node_modules ]; then
  echo "verify.sh: npm ci"; npm ci --no-audit --no-fund --loglevel=error || { echo "verify.sh: npm ci FAILED"; exit 10; }
fi
case "${lane:-verify}" in
  media) exec bash tools/mac/media.sh ;;
esac
rc=0
echo "== bank validator"
node tools/validate-bank.mjs || rc=11
echo "== e2e"
[ "$(uname -s)" = Darwin ] && [ -z "${CHROME_PATH:-}" ] && npx playwright install chromium >/dev/null 2>&1
npm test || rc=12
echo "verify.sh: exit $rc"
exit $rc
