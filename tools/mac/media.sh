#!/usr/bin/env bash
# Lane `media` of tools/verify.sh. Detached + polled (pattern of the Landing repo's v9 media lane):
# an enjambre agent's Bash call is cut after a few minutes, so the first call starts media-run.sh
# in its own session and every call waits up to MEDIA_POLL_S (100 s), prints the log tail and
# exits 90 while it is still running. 90 is not a failure: call `bash tools/verify.sh` again.
set -uo pipefail
cd "$(dirname "$0")/../.."
ST="$(git rev-parse --git-dir)/media"; mkdir -p "$ST" evidence/media
LOG=evidence/media/run.txt
alive() { [ -f "$ST/pid" ] && kill -0 "$(cat "$ST/pid")" 2>/dev/null; }
if [ ! -f "$ST/pid" ]; then
  echo "== media run started $(date '+%F %T')" | tee -a "$LOG"
  # perl's setsid: macOS has no setsid(1); the run must outlive this shell and the agent's call
  nohup perl -MPOSIX=setsid -e 'setsid(); exec @ARGV' \
    bash -c 'bash tools/mac/media-run.sh >> "$1" 2>&1; echo $? > "$2/exit"' _ "$LOG" "$ST" \
    </dev/null >/dev/null 2>&1 &
  echo $! > "$ST/pid"
fi
end=$(( $(date +%s) + ${MEDIA_POLL_S:-100} ))
while [ ! -f "$ST/exit" ] && [ "$(date +%s)" -lt "$end" ]; do alive || { sleep 2; break; }; sleep 5; done
tail -n 30 "$LOG"
if [ -f "$ST/exit" ]; then rc=$(cat "$ST/exit"); echo "media.sh: finished, exit $rc"; exit "$rc"; fi
alive || { echo "media.sh: run died without an exit code (see $LOG)"; exit 92; }
echo "media.sh: still running — run the verification command again (exit 90 is not a failure)"
exit 90
