#!/usr/bin/env bash
# Upload app/ into the Hostinger docroot public_html/cert-app over TUS. Overwrites only the listed
# files inside cert-app; never deletes anything. Credentials come from the environment (short-lived
# keys from the Hostinger API `hosting_files_generate-upload-url`) and are never printed.
#   HSTG_UP_URL=... HSTG_AUTH=... HSTG_REST=... bash tools/deploy-cert.sh
set -euo pipefail
node "$(dirname "$0")/stamp-sw.mjs" --check   # never ship a stale service-worker cache name
: "${HSTG_UP_URL:?}" "${HSTG_AUTH:?}" "${HSTG_REST:?}"
cd "$(dirname "$0")/../app"
FILES=(index.html .htaccess README.md data/blueprints.js data/questions-ccar-f.js data/questions-ccdv-f.js
       sw.js manifest.webmanifest robots.txt sitemap.xml og.png icon.svg icon-192.png icon-512.png)
fail=0
for f in "${FILES[@]}"; do
  size=$(wc -c < "$f" | tr -d ' ')
  dest="$HSTG_UP_URL/cert-app/$f?override=true"
  c1=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$dest" -H "X-Auth: $HSTG_AUTH" -H "X-Auth-Rest: $HSTG_REST" \
       -H "Tus-Resumable: 1.0.0" -H "Upload-Length: $size" -H "Upload-Offset: 0")
  c2=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$dest" -H "X-Auth: $HSTG_AUTH" -H "X-Auth-Rest: $HSTG_REST" \
       -H "Tus-Resumable: 1.0.0" -H "Content-Type: application/offset+octet-stream" -H "Upload-Offset: 0" --data-binary "@$f")
  echo "$f $size bytes: POST $c1 PATCH $c2"
  [[ $c1 == 201 && $c2 == 204 ]] || fail=1
done
exit $fail
