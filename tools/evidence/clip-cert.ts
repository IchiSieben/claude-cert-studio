// Cert Studio — the card clip and the three README captures, recorded from the live app
// (c) 2026 IchiSieben (iC7) · https://ichisieben.dev
// Apache-2.0
//
// Usage: node --experimental-strip-types tools/evidence/clip-cert.ts [url]
// Default url: https://cert.ichisieben.dev/  (pass file://…/app/index.html to record a local copy).
// Always opens the app with ?sample=1: deterministic demo progress held in memory, so the capture
// never depends on (or writes) anybody's localStorage.
// Guion, ≤ 8 s, ends on the start state so the loop closes: start page → pick CCDV-F → one drill
// question answered wrong → the trap tag explains the wrong option → a diagnostic result by domain
// → back to the start page.
// Outputs: docs/media/{poster.webp,preview.webm,preview.mp4,clip.json} (promoted together, old files
// kept on failure) and docs/img/{overview,drill,result}.png at 1280x800, device scale 1.
// Log: evidence/media/clip.txt. Exit: 0 ok · 21 clip failed · 22 a capture failed.

import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { CHROME_PATH } from './_lib.ts';

// Page globals of app/index.html (top-level `const`/functions: reachable by name inside evaluate, not via window).
declare const S: any; declare function render(): void; declare function startMock(k: string): void;
declare function submitMock(): void; declare function setCert(c: string): void; declare function go(v: string): void;
import { Screencast, buildClip, writePoster, promote, CLIP_W, CLIP_H } from './_clip.ts';

const BASE = process.argv[2] || 'https://cert.ichisieben.dev/';
const URL_ = BASE + (BASE.includes('?') ? '&' : '?') + 'sample=1';
const LOG_DIR = join('evidence', 'media');
mkdirSync(LOG_DIR, { recursive: true });
const logFile = join(LOG_DIR, 'clip.txt');
writeFileSync(logFile, `# cert-studio · ${new Date().toISOString()} · ${URL_}\n`);
const log = (s: string) => { appendFileSync(logFile, s + '\n'); console.log(`[cert-studio] ${s}`); };
const wait = (p: Page, ms: number) => p.waitForTimeout(ms);

async function clickGlide(page: Page, sel: string) {
  const b = await page.locator(sel).first().boundingBox();
  if (!b) throw new Error(`no box for ${sel}`);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 });
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

// One CCDV-F single-answer question from the biggest domain (D2), shown alone in a drill.
async function openDrillQuestion(page: Page) {
  await page.evaluate(() => {
   
    const q = (window as any).QUESTIONS['CCDV-F'].find((x: any) => x.domain === 2 && x.select === 1);
    S.drill = { active: true, pool: [q], i: 0, chosen: [], checked: false, right: 0 };
    S.view = 'drill'; render(); window.scrollTo(0, 0);
  });
}
async function answerWrongAndCheck(page: Page, glide: boolean) {
  const k = await page.evaluate(() => { const q = S.drill.pool[0]; return ['A', 'B', 'C', 'D'].find(x => !q.answer.includes(x)); });
  if (glide) await clickGlide(page, `.opt >> nth=${'ABCD'.indexOf(k!)}`); else await page.keyboard.press(k!);
  await wait(page, glide ? 250 : 50);
  if (glide) await clickGlide(page, 'text=Check answer'); else await page.click('text=Check answer');
}
// A quick diagnostic answered ~65 % right, submitted at once: the result page by domain.
async function showResult(page: Page) {
  await page.evaluate(() => {
   
    startMock('quick');
    S.mock.pool.forEach((q: any, i: number) => {
      const wrong = ['A', 'B', 'C', 'D'].filter(x => !q.answer.includes(x)).slice(0, q.select);
      S.mock.answers[i] = i % 4 === 3 ? wrong : q.answer.slice();
    });
    submitMock();
  });
}

async function launch() {
  return chromium.launch({
    executablePath: CHROME_PATH,
    headless: Boolean(process.env.EVIDENCE_HEADLESS),
    args: ['--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', `--window-size=${CLIP_W},${CLIP_H + 120}`],
  });
}

let rc = 0;
const browser = await launch();
try {
  // ---- clip ----
  try {
    const ctx = await browser.newContext({ viewport: { width: CLIP_W, height: CLIP_H }, deviceScaleFactor: 1, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.bringToFront();
    await page.goto(URL_, { waitUntil: 'networkidle' });
    await page.waitForSelector('.certcard');
    const sc = new Screencast(page);
    await sc.start();
    const t = Date.now();
    await wait(page, 700);                                   // start page at rest = poster
    await clickGlide(page, '.certcard >> nth=1 >> button');  // pick CCDV-F
    await wait(page, 700);
    await openDrillQuestion(page);
    await wait(page, 600);
    await answerWrongAndCheck(page, true);
    await wait(page, 300);
    await page.evaluate(() => { const e = document.querySelector('.opt.wrong') || document.querySelector('.why'); if (e) window.scrollTo({ top: (e as HTMLElement).getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); });
    await wait(page, 1500);                                  // the trap tag on the wrong option
    await showResult(page);
    await wait(page, 500);
    await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'smooth' }));
    await wait(page, 1300);                                  // score + by-domain bars
    await page.evaluate(() => { S.mock = null; setCert('CCAR-F'); go('start'); });
    await wait(page, 450);                                   // back to the poster state
    await sc.stop();
    const secs = (Date.now() - t) / 1000;
    log(`guion ${secs.toFixed(1)} s, ${sc.shots.length} frames`);
    if (secs > 8.6) log(`WARNING: guion ${secs.toFixed(1)} s > 8 s`);
    await ctx.close();
    const work = join('tools', 'evidence', '_video-raw', 'cert-studio');
    const stage = join(work, 'stage');
    const res = buildClip('cert-studio', BASE, sc, join(work, 'frames'), stage, log);
    await writePoster(join(work, 'frames'), stage, res);
    promote(stage, join('docs', 'media'));
    log(`OK ${JSON.stringify(res)}`);
  } catch (e) {
    rc = 21; log(`CLIP FAILED: ${(e as Error).stack ?? e}`);
  }

  // ---- three README captures ----
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(URL_ + '&cert=CCDV-F&view=home', { waitUntil: 'networkidle' });
    await page.waitForSelector('#dueKpi');
    await page.screenshot({ path: 'docs/img/overview.png' });
    await openDrillQuestion(page);
    await answerWrongAndCheck(page, false);
    await page.evaluate(() => { const e = document.querySelector('.stem'); if (e) window.scrollTo(0, (e as HTMLElement).getBoundingClientRect().top + scrollY - 215); });
    await page.screenshot({ path: 'docs/img/drill.png' });
    await showResult(page);
    await page.waitForSelector('.score');
    await page.screenshot({ path: 'docs/img/result.png' });
    await ctx.close();
    log('captures: docs/img/overview.png drill.png result.png');
  } catch (e) {
    if (!rc) rc = 22; log(`CAPTURE FAILED: ${(e as Error).stack ?? e}`);
  }
} finally {
  await browser.close().catch(() => {});
}
log(`clip-cert: exit ${rc}`);
process.exit(rc);
