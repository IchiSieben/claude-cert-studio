#!/usr/bin/env bash
# Lane `media`, the work itself (reached through tools/mac/media.sh, detached): record the card clip
# and the three README captures from the live app (tools/evidence/clip-cert.ts), then print a size
# table and enforce the caps. Runs on the Mac node: ffmpeg from Homebrew, playwright-core's Chromium.
# Exit: 20 no ffmpeg · 21 clip failed · 22 capture failed · 23 clip > 1.5 MB · 24 poster > 120 KB.
set -uo pipefail
cd "$(dirname "$0")/../.."
OUT=evidence/media; mkdir -p "$OUT"
command -v ffmpeg >/dev/null || { echo "media-run.sh: ffmpeg missing (brew install ffmpeg)"; exit 20; }
ffmpeg -version | head -1
[ -n "${CHROME_PATH:-}" ] || npx playwright install chromium >/dev/null 2>&1 || echo "media-run.sh: chromium install failed (continuing)"
command -v caffeinate >/dev/null && { caffeinate -d -w $$ & }
rc=0
node --experimental-strip-types tools/evidence/clip-cert.ts "${CERT_URL:-https://cert.ichisieben.dev/}" || rc=$?
echo "== sizes"
{
  printf '%-14s %9s %7s %6s %10s %s\n' file bytes seconds fps dims codec
  for f in docs/media/poster.webp docs/media/preview.webm docs/media/preview.mp4 docs/img/overview.png docs/img/drill.png docs/img/result.png; do
    [ -f "$f" ] || { echo "$f missing"; continue; }
    b=$(stat -f %z "$f" 2>/dev/null || stat -c %s "$f")
    case "$f" in
      *.webm|*.mp4)
        s=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
        r=$(ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of csv=p=0 "$f")
        d=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f")
        x=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$f")
        [ "$b" -gt 1572864 ] && { echo "media-run.sh: $f > 1.5 MB"; [ $rc -eq 0 ] && rc=23; } ;;
      *) s=-; r=-; x=-; d=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f")
         [ "$f" = docs/media/poster.webp ] && [ "$b" -gt 122880 ] && { echo "media-run.sh: poster > 120 KB"; [ $rc -eq 0 ] && rc=24; } ;;
    esac
    printf '%-14s %9s %7s %6s %10s %s\n' "$(basename "$f")" "$b" "${s:-?}" "${r:-?}" "${d:-?}" "$x"
  done
  [ -f docs/media/clip.json ] && node -e "const c=require('./docs/media/clip.json');console.log('clip.json: delivered '+c.deliveredFps+' fps -> '+c.fps+' · '+c.seconds+' s · loop SSIM '+c.loopSsim+' · '+c.webmType+' · '+c.recordedAt)"
} | tee "$OUT/sizes.txt"
echo "media-run.sh: exit $rc" | tee -a "$OUT/sizes.txt"
exit $rc
