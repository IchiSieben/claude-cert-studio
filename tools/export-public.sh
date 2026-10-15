#!/usr/bin/env bash
# Export the publishable tree of this private working repo into the public repo checkout
# (default ../claude-cert-studio) and commit it there with the noreply identity. The private repo's
# history (personal email in every commit) never leaves this machine; the public repo is a filtered
# copy. Files that never go public: process notes, decisions, private review material.
#   bash tools/export-public.sh [dest]   -> prints the commit, does NOT push
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${1:-../claude-cert-studio}"
EXCLUDE=(NOTES.md HANDOFF.md docs/DECISIONES.md docs/PUBLICAR.md docs/private docs/handoffs .claude CLAUDE.md)
[ -d "$DEST/.git" ] || { mkdir -p "$DEST"; git -C "$DEST" init -q -b main; }
git -C "$DEST" config user.name IchiSieben
git -C "$DEST" config user.email IchiSieben@users.noreply.github.com
# replace the tracked tree (export, then copy over; files removed upstream are removed with git rm)
TMPD=$(mktemp -d)
git archive HEAD | tar -x -C "$TMPD"
for x in "${EXCLUDE[@]}"; do rm -rf "${TMPD:?}/$x"; done
# audit gate: no third-party names, no personal paths or email in what goes out
if grep -rnIiE -f "${CERT_AUDIT_PATTERNS:-docs/private/audit-patterns.txt}" "$TMPD"; then
  echo "export-public.sh: audit hit above, nothing exported"; rm -rf "$TMPD"; exit 3
fi
git -C "$DEST" ls-files -z | (cd "$DEST" && xargs -0 -r git rm -q --) || true
( cd "$TMPD" && tar -c . ) | ( cd "$DEST" && tar -x )
rm -rf "$TMPD"
git -C "$DEST" add -A
if git -C "$DEST" diff --cached --quiet; then echo "export-public.sh: no changes"; exit 0; fi
src=$(git rev-parse --short HEAD)
git -C "$DEST" commit -q -m "${EXPORT_MSG:-Cert Studio: export of private $src}"
git -C "$DEST" log --format='%h %an <%ae> %s' -1
