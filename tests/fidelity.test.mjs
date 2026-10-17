// Fidelity gate: the approved mockup (docs/mockups/raycast.html, 45ad075) as a permanent test.
// Fails when the instrument view ("/") changes in a way the owner did not approve.
//   node tests/fidelity.test.mjs            run both layers on the 8 combos
//   node tests/fidelity.test.mjs --update   rewrite the layer-B baselines (needs a DECISIONES row with the owner's approval)
//
// 8 combos = theme (light, dark) x viewport (1440x900, 390x844) x state (fresh = empty storage, no sample; sample = ?sample=1).
// Layer A compares structure and colour with the mockup (the mockup has no empty state: ?ink=0 draws it).
// Layer B compares the instrument region pixel by pixel with an approved baseline of the app itself.
import { chromium } from "playwright";
import sharp from "sharp";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

// ---- thresholds (every number the gate tolerates is here) -------------------------------------------------
const WIDTH_PP = 0.5;               // A: a band's share of the bar vs the mockup, percentage points
const TRACK_DE = 6;                 // A: CIE76 distance, app track colour vs mockup track colour
const FILL_DE = 12;                 // A: CIE76, app solid fill vs mockup fill (sample). Looser than the track: the light domain colours were
                                    //    recalibrated to WCAG AA on 2026-10-16 (DECISIONES), worst approved shift is dE 10.5 (D3, light)
const EMPTY_DE_CARD = 8;            // A: fresh state, track vs card colour: the bar must already be in colour
const EMPTY_CHROMA = 8;             // A: fresh state, C* of the track
const BAR_TOP_DY = { 1440: 120, 390: 160 };   // A: bar top y vs the mockup's, px (fonts and copy differ, the layout must not)
const MIN_ROOM = 6;                 // A: px of un-inked (or inked) band needed to sample its middle, clear of the 2 px selection ring
const MIN_SAMPLED = { track: 6, fill: 3 };    // A: bands with room to sample a clean pixel (narrow ones at 390 may not have it)
const PIXEL_TOLERANCE = 24;         // B: sum of |dR|+|dG|+|dB| above which a pixel counts as different
const MAX_DIFF_RATIO = 0.002;       // B: share of the region's pixels allowed to differ
const FIXED_DATE = new Date("2026-10-17T12:00:00");

const root = path.resolve(import.meta.dirname, "..");
const APP = pathToFileURL(path.join(root, "app/index.html")).href;
const MOCK = pathToFileURL(path.join(root, "docs/mockups/raycast.html")).href;
const BASE_DIR = path.join(root, "tests/fidelity/baseline");
const OUT_DIR = path.join(root, "evidence/fidelity");
const UPDATE = process.argv.includes("--update");
const NAV = ["Drill", "Mock exam", "Traps", "Progress"];

// ---- colour -----------------------------------------------------------------------------------------------
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function lab([r, g, b]) {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047, Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B, Z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const chroma = c => Math.hypot(lab(c)[1], lab(c)[2]);
const hex = c => "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");

// ---- page helpers -----------------------------------------------------------------------------------------
async function open(browser, url, theme, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });   // new context = empty storage
  await ctx.route(u => !u.protocol.startsWith("file"), r => r.abort());                                // no network: the mockup's web fonts never load
  const page = await ctx.newPage();
  await page.clock.setFixedTime(FIXED_DATE);
  await page.goto(url);
  return { ctx, page };
}
async function settle(page, ready) {
  await page.waitForFunction(ready);
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}
// in-page measurement, same shape for the app and the mockup
function measure({ seg, key, nav, card }) {
  const r = e => { const b = e.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; };
  const bands = [...document.querySelectorAll(seg)].map(e => ({ ...r(e), ink: parseFloat(e.style.getPropertyValue("--ink")) || 0, pressed: e.getAttribute("aria-pressed") === "true" }));
  const keys = [...document.querySelectorAll(key)].map(e => ({ ...r(e), dot: !!e.querySelector(".dot"), id: e.querySelector(".id")?.textContent.trim(), nm: e.querySelector(".nm")?.textContent.trim(), w: e.querySelector(".w")?.textContent.trim() }));
  const tabs = [...document.querySelectorAll(nav)].map(e => ({ t: e.textContent.trim(), shown: e.getClientRects().length > 0 }));
  const cs = getComputedStyle(document.querySelector(card));
  return { bands, keys, tabs, cardBg: cs.backgroundColor, bottom: Math.max(...keys.map(k => k.y + k.h)) };
}
const APP_SEL = { seg: ".wbar .seg", key: ".keys .k", nav: "#nav button", card: ".instr" };
const MOCK_SEL = { seg: ".bar button", key: ".keys .k", nav: ".links > *", card: ".inst" };

async function capture(browser, kind, theme, w, h, state) {
  const sample = state === "sample";
  const url = kind === "app" ? `${APP}?${sample ? "sample=1&" : ""}cert=CCDV-F&view=home` : `${MOCK}?cert=CCDV-F&theme=${theme}${sample ? "" : "&ink=0"}`;
  const { ctx, page } = await open(browser, url, theme, w, h);
  await settle(page, kind === "app" ? () => document.querySelector(".wbar .seg") : () => document.querySelector(".bar button"));
  const m = await page.evaluate(measure, kind === "app" ? APP_SEL : MOCK_SEL);
  const height = Math.ceil(m.bottom);
  const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: w, height } });
  await ctx.close();
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { m, png, raw: data, info, px: (x, y) => { const i = (Math.round(y) * info.width + Math.round(x)) * 3; return [data[i], data[i + 1], data[i + 2]]; } };
}

// ---- layer A ----------------------------------------------------------------------------------------------
function layerA(app, mock, w, state) {
  const bad = [], note = [];
  const a = app.m, k = mock.m, fresh = state === "fresh";
  const fail = s => bad.push(s);
  if (a.bands.length !== 8 || k.bands.length !== 8) fail(`bands: app ${a.bands.length}, mockup ${k.bands.length}, expected 8`);
  const share = m => { const t = m.bands.reduce((s, b) => s + b.w, 0); return m.bands.map(b => 100 * b.w / t); };
  const sa = share(a), sk = share(k);
  sa.forEach((v, i) => { if (Math.abs(v - sk[i]) > WIDTH_PP) fail(`band ${i + 1} width ${v.toFixed(2)}% vs mockup ${sk[i].toFixed(2)}% (limit ${WIDTH_PP} pp)`); });
  if (!a.bands.every((b, i) => i === 0 || b.x > a.bands[i - 1].x)) fail("bands are not in domain order left to right");

  // track colour: the middle of the un-inked stretch of the band
  const trackPx = (c, m) => m.bands.map((b, i) => (1 - b.ink) * b.w >= MIN_ROOM ? { i, c: c.px(b.x + b.w * (1 + b.ink) / 2, b.y + b.h / 2) } : null);
  const ta = trackPx(app, a), tk = trackPx(mock, k);
  let n = 0;
  ta.forEach((t, i) => { if (!t || !tk[i]) return; n++; const d = dE(t.c, tk[i].c); if (d > TRACK_DE) fail(`band ${i + 1} track ${hex(t.c)} vs mockup ${hex(tk[i].c)}: dE ${d.toFixed(1)} > ${TRACK_DE}`); });
  if (n < MIN_SAMPLED.track) fail(`only ${n} track samples, need ${MIN_SAMPLED.track}`);
  if (fresh && (ta.some(t => !t) || tk.some(t => !t))) fail("fresh state: every band must have a sampleable track");
  const cardPx = c => c.px(c.m.bands[0].x - 8, c.m.bands[0].y + c.m.bands[0].h / 2);
  note.push(`${n} track samples`);
  if (fresh) {
    const card = cardPx(app);
    ta.forEach(t => { if (!t) return; const de = dE(t.c, card), ch = chroma(t.c); if (de < EMPTY_DE_CARD || ch < EMPTY_CHROMA) fail(`empty state band ${t.i + 1} track ${hex(t.c)} is grey: dE vs card ${de.toFixed(1)} (min ${EMPTY_DE_CARD}), C* ${ch.toFixed(1)} (min ${EMPTY_CHROMA})`); });
  } else {
    const fillPx = (c, m) => m.bands.map((b, i) => b.ink * b.w >= MIN_ROOM ? { i, c: c.px(b.x + b.w * b.ink / 2, b.y + b.h / 2) } : null);
    const fa = fillPx(app, a), fk = fillPx(mock, k); let nf = 0;
    fa.forEach((t, i) => { if (!t || !fk[i]) return; nf++; const d = dE(t.c, fk[i].c); if (d > FILL_DE) fail(`band ${i + 1} fill ${hex(t.c)} vs mockup ${hex(fk[i].c)}: dE ${d.toFixed(1)} > ${FILL_DE}`); });
    if (nf < MIN_SAMPLED.fill) fail(`only ${nf} fill samples, need ${MIN_SAMPLED.fill}`);
    note.push(`${nf} fill samples`);
  }

  // keys: 8, below the bar, each with dot, D#, full name and weight
  if (a.keys.length !== 8) fail(`keys: ${a.keys.length}, expected 8`);
  const barBottom = Math.max(...a.bands.map(b => b.y + b.h));
  if (a.keys.some(x => x.y < barBottom)) fail("the keys must sit below the instrument bar");
  const wn = s => parseFloat(String(s).replace(",", "."));
  a.keys.forEach((x, i) => {
    const y = k.keys[i];
    if (!x.dot || !/^D\d$/.test(x.id || "") || !x.nm || !/\d%$/.test(x.w || "")) fail(`key ${i + 1} incomplete: ${JSON.stringify({ dot: x.dot, id: x.id, nm: x.nm, w: x.w })}`);
    if (y && (x.id !== y.id || x.nm !== y.nm || wn(x.w) !== wn(y.w))) fail(`key ${i + 1} is "${x.id} ${x.nm} ${x.w}", mockup "${y.id} ${y.nm} ${y.w}"`);
  });
  const dy = Math.abs(a.bands[0].y - k.bands[0].y), lim = BAR_TOP_DY[w];
  if (dy > lim) fail(`bar top y ${Math.round(a.bands[0].y)} vs mockup ${Math.round(k.bands[0].y)}: ${Math.round(dy)} px > ${lim}`);
  note.push(`bar dy ${Math.round(dy)}px`);

  const tabs = a.tabs.map(t => t.t);
  if (JSON.stringify(tabs) !== JSON.stringify(NAV) || !a.tabs.every(t => t.shown)) fail(`nav tabs ${JSON.stringify(a.tabs)} must be exactly ${JSON.stringify(NAV)} and visible`);
  return { bad, note: note.join(", ") };
}

// ---- layer B ----------------------------------------------------------------------------------------------
async function layerB(app, name) {
  const file = path.join(BASE_DIR, name + ".png");
  if (UPDATE) { fs.mkdirSync(BASE_DIR, { recursive: true }); fs.writeFileSync(file, app.png); return { bad: [], note: "baseline written" }; }
  if (!fs.existsSync(file)) return { bad: [`no baseline ${path.relative(root, file)} (run with --update after the owner approves)`], note: "" };
  const base = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const dump = async diff => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, name + ".actual.png"), app.png);
    if (diff) await sharp(diff.buf, { raw: { width: diff.w, height: diff.h, channels: 3 } }).png().toFile(path.join(OUT_DIR, name + ".diff.png"));
    return `see evidence/fidelity/${name}.actual.png${diff ? " and " + name + ".diff.png" : ""}`;
  };
  if (base.info.width !== app.info.width || base.info.height !== app.info.height)
    return { bad: [`region is ${app.info.width}x${app.info.height}, baseline ${base.info.width}x${base.info.height}; ${await dump()}`], note: "" };
  const n = app.info.width * app.info.height, buf = Buffer.alloc(n * 3); let diff = 0;
  for (let p = 0; p < n; p++) {
    const i = p * 3, d = Math.abs(app.raw[i] - base.data[i]) + Math.abs(app.raw[i + 1] - base.data[i + 1]) + Math.abs(app.raw[i + 2] - base.data[i + 2]);
    if (d > PIXEL_TOLERANCE) { diff++; buf[i] = 255; buf[i + 1] = 0; buf[i + 2] = 60; } else { buf[i] = buf[i + 1] = buf[i + 2] = base.data[i] >> 2; }
  }
  const ratio = diff / n;
  if (ratio > MAX_DIFF_RATIO) return { bad: [`${(100 * ratio).toFixed(3)}% of pixels differ (limit ${(100 * MAX_DIFF_RATIO).toFixed(1)}%, tolerance ${PIXEL_TOLERANCE}); ${await dump({ buf, w: app.info.width, h: app.info.height })}`], note: "" };
  return { bad: [], note: `${(100 * ratio).toFixed(4)}% differ` };
}

// ---- run --------------------------------------------------------------------------------------------------
const t0 = Date.now();
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let failed = 0, total = 0;
for (const state of ["fresh", "sample"]) for (const theme of ["light", "dark"]) for (const [w, h] of [[1440, 900], [390, 844]]) {
  const name = `${state}-${theme}-${w}`;
  const app = await capture(browser, "app", theme, w, h, state);
  const mock = await capture(browser, "mock", theme, w, h, state);
  for (const [layer, r] of [["A mockup", layerA(app, mock, w, state)], ["B baseline", await layerB(app, name)]]) {
    total++; const ok = r.bad.length === 0; if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${layer}${r.note ? "  (" + r.note + ")" : ""}`);
    r.bad.forEach(b => console.log("      - " + b));
  }
}
await browser.close();
if (UPDATE) console.log("\nBaselines rewritten. A docs/DECISIONES.md row with the owner's approval is REQUIRED before committing them.");
console.log(failed ? `\n${failed} of ${total} FAILED (${((Date.now() - t0) / 1000).toFixed(1)}s)` : `\nALL ${total} PASSED (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
process.exit(failed ? 1 : 0);
