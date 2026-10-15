---
kind: tests
push: false
---
# TASK — cert-media

## Goal
Record the landing-card media and the three README captures of Cert Studio from the live public
URL (https://cert.ichisieben.dev/?sample=1), on this node.

1. Write the single word `media` into `.enjambre-lane` (gitignored; it selects the lane).
2. Run the one allowed command, `bash tools/verify.sh`. The media lane runs detached: exit 90 means
   "still running" — wait about 30 s and run the same command again. Repeat until it prints
   `finished` with an exit code (at most 40 calls).
3. Report.

## Files you may touch
- `.enjambre-lane`
- `docs/media/poster.webp`, `docs/media/preview.webm`, `docs/media/preview.mp4`, `docs/media/clip.json`
- `docs/img/overview.png`, `docs/img/drill.png`, `docs/img/result.png`
(the script writes the media files; you only write `.enjambre-lane`)

## Done criteria
- [ ] `bash tools/verify.sh` printed `finished` with exit 0
- [ ] the 7 files above exist and are non-empty

## Report back
- The last 25 lines of the final verify.sh output, and `ls -l docs/media docs/img`.
