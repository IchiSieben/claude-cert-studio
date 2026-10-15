// Cert Studio — CDP screencast clip encoder (copied from the owner's Landing repo, tools/evidence/_clip.ts, v9)
// (c) 2026 IchiSieben (iC7) · https://ichisieben.dev
// Apache-2.0
//
// Why not Playwright's `recordVideo`: it re-encodes its screencast at a FIXED 25 fps (not
// configurable), so every v8 clip came out at 25 and the fps guard skipped three of them while
// their posters were still rewritten (evidence/v9/media/DIAGNOSIS.md). Here the CDP screencast
// frames are kept with their own swap timestamps; ffmpeg's concat demuxer replays them at their
// real durations and the `fps` filter resamples to a constant 60 or 30.
// LEARN: a screencast only emits a frame when the compositor draws one, so a static stretch has
// no frames at all. Keeping per-frame durations (instead of numbering frames at a nominal rate)
// is what keeps the timing right; the alternative — a virtual clock that steps rAF and
// screenshots each frame — gives perfect 60 fps on any machine but does not cover CSS transitions
// or real pointer input, which these guiones depend on.

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync, writeFileSync, renameSync, copyFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';
import type { Page, CDPSession } from 'playwright-core';
import { FFMPEG, FFPROBE } from './_lib.ts';

export const CLIP_W = 1280; // 16:9 like the card's aspect-video box
export const CLIP_H = 720;
export const MAX_CLIP_BYTES = 1572864; // 1.5 MB per file (webm and mp4 each)
export const MAX_POSTER_BYTES = 122880; // 120 KB
export const LOOP_FADE_S = 0.4; // tail -> head crossfade that makes the loop seamless
// The screencast JPEGs are full-range BT.601; left alone, ffmpeg tagged the clips `pc`/bt470bg and
// Chromium played them as limited range: crushed blacks, mean |Δ| 15/255 against the poster
// (_v9-card on the Mac, v9 run 1). Convert to and tag the web's default instead.
// Transfer = sRGB, not bt709: the samples are sRGB screen pixels, like the poster. Run 2 asked for
// bt709 but the scale filter's frames carried trc/primaries "unknown", which beat the output
// options (ffprobe: tv,bt709,unknown,unknown); Chromium then guessed a transfer and the poster
// missed frame 0 by 7-9/255. `setparams` stamps the frames themselves, after the last scale.
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-color_range', 'tv'];
const TAG = 'setparams=color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709:range=tv';

// t = the frame's own swap timestamp (CDP clock); rt = when node received it (wall clock).
// The two clocks are never compared with each other, only with themselves.
type Shot = { buf: Buffer; t: number; rt: number };

/** CDP screencast with every frame's own timestamp (seconds). */
export class Screencast {
  shots: Shot[] = [];
  t0 = 0;
  t1 = 0;
  private cdp: CDPSession | null = null;
  private page: Page;
  // no parameter properties: node's strip-types mode rejects them
  constructor(page: Page) {
    this.page = page;
  }

  async start(): Promise<void> {
    const cdp = await this.page.context().newCDPSession(this.page);
    this.cdp = cdp;
    cdp.on('Page.screencastFrame', (f: { data: string; sessionId: number; metadata: { timestamp?: number } }) => {
      const rt = Date.now() / 1000;
      this.shots.push({ buf: Buffer.from(f.data, 'base64'), t: f.metadata.timestamp ?? rt, rt });
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    this.t0 = Date.now() / 1000;
    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 94,
      maxWidth: CLIP_W,
      maxHeight: CLIP_H,
      everyNthFrame: 1,
    });
    // A page at rest paints nothing, so the first frame would only come with the first
    // interaction: force one compositor frame so frame 0 (= the poster) is the rest state.
    for (let i = 0; i < 20 && this.shots.length === 0; i++) await this.page.waitForTimeout(50);
    if (this.shots.length === 0) {
      await this.page.evaluate(
        () =>
          new Promise<void>((res) => {
            const d = document.createElement('div');
            d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;pointer-events:none';
            document.body.appendChild(d);
            requestAnimationFrame(() => requestAnimationFrame(() => (d.remove(), res())));
          }),
      );
      for (let i = 0; i < 20 && this.shots.length === 0; i++) await this.page.waitForTimeout(50);
    }
  }

  async stop(): Promise<void> {
    this.t1 = Date.now() / 1000;
    await this.cdp?.send('Page.stopScreencast').catch(() => {});
    await this.cdp?.detach().catch(() => {});
    this.cdp = null;
  }
}

/**
 * Delivered frame rate during SUSTAINED motion only: runs of >= 12 consecutive frames at most
 * 40 ms apart (a spinning globe, a zoom tween). Discrete UI updates (typing, a slider step) are
 * single repaints with the page at rest in between; they say nothing about the rate, and counting
 * them would refuse a perfectly smooth form. `fps` is 1 / median interval inside those runs.
 */
export function measureFps(shots: Shot[]): { fps: number; motionS: number; frames: number; sustained: boolean } {
  const inRuns: number[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length >= 11) inRuns.push(...run); // 11 intervals = 12 frames
    run = [];
  };
  for (let i = 1; i < shots.length; i++) {
    const dt = shots[i].t - shots[i - 1].t;
    if (dt > 0 && dt <= 0.04) run.push(dt);
    else flush();
  }
  flush();
  const motionS = inRuns.reduce((a, b) => a + b, 0);
  if (!inRuns.length) return { fps: 0, motionS: 0, frames: shots.length, sustained: false };
  const s = [...inRuns].sort((a, b) => a - b);
  return { fps: 1 / s[Math.floor(s.length / 2)], motionS, frames: shots.length, sustained: true };
}

/** 60 when the browser really delivered ~60, 30 when it delivered at least ~30, else refuse. */
export function pickOutputFps(delivered: number, sustained = true): 60 | 30 | 0 {
  if (!sustained) return 60; // no continuous motion to judge: discrete repaints, frames held
  if (delivered >= 50) return 60;
  if (delivered >= 28) return 30;
  return 0;
}

function ff(args: string[]): string {
  return execFileSync(FFMPEG, ['-hide_banner', '-v', 'error', '-y', ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
}

function probe(path: string, entries: string): string {
  return execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', path], {
    encoding: 'utf8',
  }).trim();
}

let encodersCache: string | null = null;
export function webmCodec(): 'libsvtav1' | 'libaom-av1' | 'libvpx-vp9' {
  encodersCache ??= execFileSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  if (/\blibsvtav1\b/.test(encodersCache)) return 'libsvtav1';
  if (/\blibaom-av1\b/.test(encodersCache)) return 'libaom-av1';
  return 'libvpx-vp9';
}

function webmArgs(enc: string, crf: number): string[] {
  if (enc === 'libsvtav1') return ['-c:v', 'libsvtav1', '-preset', '5', '-crf', String(crf)];
  if (enc === 'libaom-av1') return ['-c:v', 'libaom-av1', '-cpu-used', '5', '-row-mt', '1', '-crf', String(crf), '-b:v', '0'];
  return ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2'];
}

/** Encode `src` with rising CRF until the file fits; returns the CRF used or -1. */
function encodeUnder(src: string, out: string, args: (crf: number) => string[], crfs: number[], scale: string): number {
  for (const crf of crfs) {
    ff(['-i', src, '-vf', `${scale},format=yuv420p,${TAG}`, '-an', ...args(crf), ...COLOR, out]);
    if (statSync(out).size <= MAX_CLIP_BYTES) return crf;
  }
  return -1;
}

export type ClipResult = {
  slug: string;
  url: string;
  deliveredFps: number;
  fps: number;
  seconds: number;
  width: number;
  height: number;
  webmCodec: string;
  webmType: string;
  webmBytes: number;
  mp4Bytes: number;
  posterBytes: number;
  loopSsim: number;
  recordedAt: string;
};

/**
 * Turn the screencast into poster.webp + preview.webm + preview.mp4 + clip.json in `stageDir`.
 * The poster is frame 0 of the same lossless intermediate both encoders read, so the swap
 * poster -> video shows no jump. Throws (and writes nothing outside stageDir) on any failure.
 */
export function buildClip(slug: string, url: string, sc: Screencast, workDir: string, stageDir: string, log: (s: string) => void): ClipResult {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });
  mkdirSync(stageDir, { recursive: true });

  const shots = sc.shots;
  if (shots.length < 30) throw new Error(`only ${shots.length} screencast frames`);
  const m = measureFps(shots);
  const fps = pickOutputFps(m.fps, m.sustained);
  log(
    `frames=${m.frames} sustained motion=${m.motionS.toFixed(2)}s delivered=${m.sustained ? m.fps.toFixed(1) + ' fps' : 'n/a (no sustained motion; frames held)'} -> output ${fps || 'REFUSED'}`,
  );
  if (!fps) throw new Error(`delivered ${m.fps.toFixed(1)} fps < 28 in sustained motion: refusing a clip below 30 fps`);

  // concat list with each frame's real duration; the last one held until stop()
  const lines = ['ffconcat version 1.0'];
  shots.forEach((s, i) => {
    const name = `f${String(i).padStart(5, '0')}.jpg`;
    writeFileSync(join(workDir, name), s.buf);
    const next = i + 1 < shots.length ? shots[i + 1].t : s.t + Math.max(1 / fps, sc.t1 - s.rt);
    lines.push(`file ${name}`, `duration ${Math.max(0.001, next - s.t).toFixed(6)}`);
  });
  lines.push(`file f${String(shots.length - 1).padStart(5, '0')}.jpg`);
  const list = join(workDir, 'list.ffconcat');
  writeFileSync(list, lines.join('\n') + '\n');

  // Lossless intermediate: resample to `fps`, drop the first LOOP_FADE_S and crossfade the
  // tail into those dropped frames, so the last frame flows into frame 0 when the clip loops.
  // the last frame is held until stop(): the guion's closing rest belongs to the clip
  const last = shots[shots.length - 1];
  const total = last.t + Math.max(1 / fps, sc.t1 - last.rt) - shots[0].t;
  const D = LOOP_FADE_S;
  const off = Math.max(0.5, total - 2 * D);
  const inter = join(workDir, 'inter.mkv');
  ff([
    '-f', 'concat', '-safe', '0', '-i', list,
    '-filter_complex',
    `[0:v]fps=${fps},scale=${CLIP_W}:${CLIP_H}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,${TAG},split[a][b];` +
      `[a]trim=start=${D},setpts=PTS-STARTPTS[m];[b]trim=end=${D},setpts=PTS-STARTPTS[h];` +
      `[m][h]xfade=transition=fade:duration=${D}:offset=${off.toFixed(3)}[o]`,
    '-map', '[o]', '-c:v', 'libx264', '-qp', '0', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', ...COLOR, inter,
  ]);
  // mkv keeps the duration in the container, not the stream
  const seconds = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inter], { encoding: 'utf8' }).trim());
  log(`intermediate ${seconds.toFixed(2)} s @ ${fps} fps`);

  // Poster = frame 0 of the intermediate (the exact frame both encoders start from).
  const f0 = join(workDir, 'frame0.png');
  const fl = join(workDir, 'framelast.png');
  ff(['-i', inter, '-frames:v', '1', '-vf', 'scale=in_color_matrix=bt709:in_range=tv,format=rgb24', f0]);
  ff(['-sseof', '-0.2', '-i', inter, '-update', '1', fl]);
  const loopSsim = ssim(fl, f0);
  log(`loop seam SSIM(last, first) = ${loopSsim.toFixed(3)}`);

  // Encodes: webm (AV1 when this ffmpeg has it, else VP9) and mp4 (H.264), no audio.
  const enc = webmCodec();
  const webm = join(stageDir, 'preview.webm');
  const mp4 = join(stageDir, 'preview.mp4');
  const webmCrfs = enc === 'libvpx-vp9' ? [34, 38, 42, 46, 50] : [36, 40, 44, 48, 52, 56];
  const mp4Crfs = [23, 25, 27, 29, 31, 33];
  let scale = `scale=${CLIP_W}:${CLIP_H}:in_color_matrix=bt709:in_range=tv:out_color_matrix=bt709:out_range=tv`;
  let w = CLIP_W, h = CLIP_H;
  let cw = encodeUnder(inter, webm, (c) => webmArgs(enc, c), webmCrfs, scale);
  let cm = encodeUnder(inter, mp4, (c) => ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-crf', String(c), '-pix_fmt', 'yuv420p', '-movflags', '+faststart'], mp4Crfs, scale);
  if (cw < 0 || cm < 0) {
    // still over 1.5 MB at the highest CRF: the card is ~640 CSS px wide, 960x540 is enough
    w = 960; h = 540; scale = `scale=${w}:${h}:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_color_matrix=bt709:out_range=tv`;
    log('over 1.5 MB at 1280x720, retrying at 960x540');
    cw = encodeUnder(inter, webm, (c) => webmArgs(enc, c), webmCrfs, scale);
    cm = encodeUnder(inter, mp4, (c) => ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-crf', String(c), '-pix_fmt', 'yuv420p', '-movflags', '+faststart'], mp4Crfs, scale);
  }
  if (cw < 0 || cm < 0) throw new Error('cannot fit the clip under 1.5 MB');
  const webmBytes = statSync(webm).size;
  const mp4Bytes = statSync(mp4).size;
  log(`webm ${enc} crf ${cw}: ${webmBytes} B · mp4 x264 crf ${cm}: ${mp4Bytes} B · ${w}x${h}`);
  for (const f of [webm, mp4]) {
    const tags = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=color_range,color_space,color_transfer,color_primaries', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim();
    log(`colour ${basename(f)}: ${tags} (want tv,bt709,iec61966-2-1,bt709)`);
  }

  let webmType = 'video/webm; codecs="vp9"';
  if (enc !== 'libvpx-vp9') {
    // av01.<profile>.<level><tier>.<bitdepth>; the level comes from the stream itself
    const lvl = Number(probe(webm, 'stream=level'));
    const level = Number.isFinite(lvl) && lvl >= 0 && lvl < 32 ? lvl : 8;
    webmType = `video/webm; codecs="av01.0.${String(level).padStart(2, '0')}M.08"`;
  }

  return {
    slug,
    url,
    deliveredFps: Number(m.fps.toFixed(1)),
    fps,
    seconds: Number(seconds.toFixed(2)),
    width: w,
    height: h,
    webmCodec: enc,
    webmType,
    webmBytes,
    mp4Bytes,
    posterBytes: 0, // filled by writePoster
    loopSsim: Number(loopSsim.toFixed(3)),
    recordedAt: new Date().toISOString(),
  };
}

/** SSIM of two images (ffmpeg prints the summary on stderr, so spawnSync, not execFileSync). */
export function ssim(a: string, b: string): number {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-'], { encoding: 'utf8' });
  const mm = /All:([0-9.]+)/.exec(r.stderr ?? '');
  return mm ? Number(mm[1]) : 0;
}

/** poster.webp from frame 0, quality stepped down until <= 120 KB (never below 55). */
export async function writePoster(workDir: string, stageDir: string, res: ClipResult): Promise<void> {
  const f0 = join(workDir, 'frame0.png');
  const out = join(stageDir, 'poster.webp');
  let q = 84;
  for (;;) {
    await sharp(f0).resize(res.width, res.height).webp({ quality: q, effort: 6 }).toFile(out);
    if (statSync(out).size <= MAX_POSTER_BYTES || q <= 55) break;
    q -= 6;
  }
  res.posterBytes = statSync(out).size;
  if (res.posterBytes > MAX_POSTER_BYTES) throw new Error(`poster ${res.posterBytes} B > 120 KB at q 55`);
  writeFileSync(join(stageDir, 'clip.json'), JSON.stringify(res, null, 2) + '\n');
}

/** Atomic per slug: the four files move together or not at all. */
export function promote(stageDir: string, outDir: string): void {
  const files = ['poster.webp', 'preview.webm', 'preview.mp4', 'clip.json'];
  for (const f of files) if (!existsSync(join(stageDir, f))) throw new Error(`stage incomplete: ${f} missing`);
  mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    try {
      renameSync(join(stageDir, f), join(outDir, f));
    } catch {
      copyFileSync(join(stageDir, f), join(outDir, f));
    }
  }
}
