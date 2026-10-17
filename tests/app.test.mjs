// End-to-end smoke test for app/index.html over file:// (no server, no network).
// Run: npm test   (needs `npm i -D playwright`; uses Playwright's Chromium, or set CHROME_PATH
// to a system Chromium/Edge if the browser download is blocked).
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { axeAll } from "../tools/axe.mjs";

const URL_ = pathToFileURL(path.resolve(import.meta.dirname, "../app/index.html")).href;
const errors = [];
const results = [];
async function step(name, fn) {
  try { await fn(); results.push(["PASS", name]); }
  catch (e) { results.push(["FAIL", name + " — " + e.message.split("\n").slice(0, process.env.FULL ? 8 : 1).join(" ")]); }
}
function watch(page) {
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("dialog", d => d.accept());
}
// Answer the current question with the first `select` letters (right or wrong does not matter here).
async function answerCurrent(page, ctx) {
  const sel = await page.evaluate(c => S[c].pool[S[c].i].select, ctx);
  for (const k of "ABCD".slice(0, sel)) await page.keyboard.press(k);
}
async function runMock(page, kind) {
  await page.evaluate(k => startMock(k), kind);
  const n = await page.evaluate(() => S.mock.pool.length);
  for (let i = 0; i < n; i++) {
    await answerCurrent(page, "mock");
    if (i < n - 1) await page.click("text=Next question");
  }
  await page.click("text=Submit exam");
  await page.waitForSelector(".score");
  return n;
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
watch(page);
await page.goto(URL_);
await page.evaluate(() => { localStorage.clear(); setCert("CCAR-F"); go("home"); });

await step("overview renders with a due-today KPI equal to the bank size on a fresh profile", async () => {
  const due = await page.textContent("#dueKpi");
  const total = await page.evaluate(() => QS().length);
  assert.equal(+due, total);
});

await step("drill 5 questions records 5 answers and lowers the due count", async () => {
  await page.evaluate(() => go("drill"));
  await page.click("text=Start (unseen first)");
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page, "drill");
    await page.click("text=Check answer");
    await page.waitForSelector(".expl");
    await page.click("text=Next question");
  }
  const seen = await page.evaluate(() => Object.keys(prog()[S.cert].q).length);
  assert.equal(seen, 5);
  const due = await page.evaluate(() => dueCount());
  const right = await page.evaluate(() => Object.values(prog()[S.cert].q).filter(r => r.last === "right").length);
  assert.equal(due, (await page.evaluate(() => QS().length)) - right);
});

await step("due-today drill only serves due questions", async () => {
  await page.evaluate(() => { S.drill = null; go("drill"); });
  await page.click("#dueBtn");
  const ok = await page.evaluate(() => S.drill.pool.every(q => isDue(q)));
  assert.ok(ok);
  await page.evaluate(() => { S.drill = null; go("home"); });
});

await step("SM-2: pre-SM-2 progress migrates without loss; intervals 1 -> 3 -> x ef; a miss resets and lowers ef", async () => {
  const ctx = await browser.newContext(); const s = await ctx.newPage(); watch(s);
  const day = 864e5, now = Date.now();
  // progress saved by the previous version: no ef/iv/reps fields
  await s.addInitScript(([now, day]) => { if (!localStorage.getItem("ccs:progress")) localStorage.setItem("ccs:progress", JSON.stringify({ "CCAR-F": { q: {
    "CCARF-1.1-01": { seen: 2, right: 2, wrong: 0, last: "right", when: now - 4 * day },
    "CCARF-1.1-02": { seen: 1, right: 1, wrong: 0, last: "right", when: now - 1 * day },
    "CCARF-1.2-01": { seen: 3, right: 1, wrong: 2, last: "wrong", when: now - 1 * day } }, traps: { myth: 2 }, mocks: [{ date: "2026-10-01", kind: "quick", score: 600, pct: 55, byDomain: {}, misses: 12, ids: [] }] } })); }, [now, day]);
  await s.goto(URL_ + "?cert=CCAR-F");
  const r = await s.evaluate(() => {
    const p = prog()["CCAR-F"]; const q = id => QS().find(x => x.id === id);
    const out = { due: ["CCARF-1.1-01", "CCARF-1.1-02", "CCARF-1.2-01"].map(id => isDue(q(id), p.q)), mocks: p.mocks.length, traps: p.traps.myth, ef12: srs(p.q["CCARF-1.2-01"]).ef };
    const fresh = QS().find(x => !p.q[x.id]); const ivs = [];
    for (let i = 0; i < 4; i++) { record(fresh, true, fresh.answer); ivs.push(prog()["CCAR-F"].q[fresh.id].iv); }
    record(fresh, false, Object.keys(fresh.options).filter(k => !fresh.answer.includes(k)).slice(0, fresh.select));
    const after = prog()["CCAR-F"].q[fresh.id];
    return { ...out, ivs, after: [after.iv, after.reps, after.ef, isDue(fresh)], stored: JSON.parse(localStorage.getItem("ccs:progress"))["CCAR-F"].q["CCARF-1.1-01"] };
  });
  assert.deepEqual(r.due, [true, false, true], "old 3-day rule kept for migrated right answers; misses due now");
  assert.equal(r.mocks, 1); assert.equal(r.traps, 2);
  assert.equal(r.ef12, 2.1, "two past misses lower the starting ef");
  assert.deepEqual(r.ivs, [1, 3, 8, 20]);
  assert.deepEqual(r.after, [0, 0, 2.3, true]);
  assert.equal(r.stored.ef, undefined, "reading never rewrites an old record");
  await ctx.close();
});

await step("explanations link the verified doc section when the question has a ref", async () => {
  const r = await page.evaluate(() => {
    const was = S.cert; setCert("CCDV-F"); const q = QS().find(x => x.ref && x.ref.includes("#")); const n = QS().find(x => !x.ref);
    const html = c => question(c, { chosen: c.answer.slice(), checked: true });
    const d = document.createElement("div"); d.innerHTML = html(q); const a = d.querySelector(".docref a");
    const e = document.createElement("div"); e.innerHTML = n ? html(n) : ""; 
    const out = { href: a && a.getAttribute("href"), ref: q.ref, target: a && a.target, none: !e.querySelector(".docref"), linked: QS().filter(x => x.ref).length };
    setCert(was); return out;
  });
  assert.equal(r.href, r.ref); assert.equal(r.target, "_blank"); assert.ok(r.none, "no ref, no link"); assert.ok(r.linked > 90, `${r.linked} linked`);
});

let quickIds = [];
await step("quick mock: half length, drawn by weight, result page shows a scaled score", async () => {
  const n = await runMock(page, "quick");
  const items = await page.evaluate(() => BP().items);
  assert.equal(n, Math.ceil(items / 2));
  const score = +(await page.textContent(".score"));
  assert.ok(score >= 100 && score <= 1000, "score in 100–1000");
  assert.ok(await page.isVisible("text=By domain"));
  assert.ok(await page.isVisible("text=Which traps caught you"));
  quickIds = await page.evaluate(() => prog()[S.cert].mocks.at(-1).ids);
  assert.equal(new Set(quickIds).size, quickIds.length, "no duplicates inside a mock");
});

// Overlap between two mocks must be the unavoidable minimum: per domain, max(0, a + b - bank).
async function assertFreshFirst(page, prevIds) {
  const info = await page.evaluate(() => ({ ids: prog()[S.cert].mocks.at(-1).ids, dom: Object.fromEntries(QS().map(q => [q.id, q.domain])), bank: QS().reduce((a, q) => (a[q.domain] = (a[q.domain] || 0) + 1, a), {}) }));
  assert.equal(new Set(info.ids).size, info.ids.length, "no duplicates inside a mock");
  const count = ids => ids.reduce((a, id) => (a[info.dom[id]] = (a[info.dom[id]] || 0) + 1, a), {});
  const a = count(prevIds), b = count(info.ids);
  const minOverlap = Object.keys(info.bank).reduce((s, d) => s + Math.max(0, (a[d] || 0) + (b[d] || 0) - info.bank[d]), 0);
  const overlap = info.ids.filter(id => prevIds.includes(id)).length;
  assert.equal(overlap, minOverlap, `overlap ${overlap} should be the unavoidable minimum ${minOverlap}`);
  return info.ids;
}

await step("second quick mock draws never-used questions first", async () => {
  await page.evaluate(() => { S.mock = null; });
  await runMock(page, "quick");
  const ids = await assertFreshFirst(page, quickIds);
  quickIds = [...new Set([...quickIds, ...ids])];
});

await step("full mock: official length, no duplicates, prefers questions unused by earlier mocks", async () => {
  await page.evaluate(() => { S.mock = null; });
  const n = await runMock(page, "full");
  assert.equal(n, await page.evaluate(() => BP().items));
  await assertFreshFirst(page, quickIds);
});

await step("progress shows all three mocks in the history table", async () => {
  await page.click("text=See my progress");
  const rows = await page.$$eval("table tr", r => r.length - 1);
  assert.equal(rows, 3);
});

await step("concepts tab: one card per distinct concept, search filters, drill link opens a drill", async () => {
  await page.evaluate(() => go("concepts"));
  const cards = await page.$$eval("#conceptGrid .concept", e => e.length);
  const distinct = await page.evaluate(() => new Set(QS().map(q => q.concept)).size);
  assert.equal(cards, distinct);
  await page.fill("#conceptSearch", "stop_reason");
  const shown = await page.$$eval("#conceptGrid .concept", e => e.filter(x => x.style.display !== "none").length);
  assert.ok(shown > 0 && shown < cards, `search narrowed to ${shown}`);
  await page.click("#conceptGrid .concept:not([style*='none']) a.tag");
  assert.equal(await page.evaluate(() => S.view), "drill");
  await page.evaluate(() => { S.drill = null; });
});

await step("print view hides chrome and shows per-task mastery bars", async () => {
  await page.evaluate(() => go("home"));
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.isVisible("header"), false);
  assert.equal(await page.isVisible("#printBtn"), false);
  assert.ok(await page.isVisible(".printonly .pbar >> nth=0"));
  await page.emulateMedia({ media: "screen" });
});

await step("CCDV-F: switch cert, concepts and the instrument render", async () => {
  await page.evaluate(() => setCert("CCDV-F"));
  await page.evaluate(() => go("concepts"));
  assert.ok((await page.$$eval("#conceptGrid .concept", e => e.length)) > 0);
  await page.evaluate(() => go("home"));
  assert.match(await page.textContent("#view h1"), /Claude Certified Developer/);
});

await step("mobile 390 px: no horizontal scroll on any view", async () => {
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(m);
  await m.goto(URL_);
  const bad = [];
  for (const v of ["home", "concepts", "drill", "mock", "traps", "progress"]) {
    await m.evaluate(v => go(v), v);
    const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) bad.push(`${v}:+${over}px`);
  }
  await m.evaluate(() => startDrill({ domains: [1, 2, 3, 4, 5, 6, 7, 8] }));
  const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 0) bad.push(`drill-question:+${over}px`);
  await m.close();
  assert.deepEqual(bad, []);
});

await step("fresh visitor lands on the instrument of the default certification: five bands summing to 100, domain keys, only four tabs, listed (no noindex), disclaimer", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const s = await ctx.newPage(); watch(s);
  await s.goto(URL_);
  assert.equal(await s.evaluate(() => S.view + "|" + S.cert), "home|CCAR-F");
  assert.equal(await s.$$eval(".certcard", e => e.length), 0, "no separate start page");
  assert.equal(await s.$$eval(".wbar .seg", e => e.length), 5, "CCAR-F has five domains");
  const sum = await s.$$eval(".wbar .seg", segs => segs.reduce((a, i) => a + parseFloat(i.dataset.w), 0));
  assert.ok(Math.abs(sum - 100) < 0.6, "weights sum " + sum);
  assert.equal(await s.$$eval(".keys .k", e => e.length), 5);
  assert.deepEqual(await s.$$eval("#nav button", e => e.map(x => x.dataset.fk)), ["nav-drill", "nav-mock", "nav-traps", "nav-progress"], "the tabs are the four activities only");
  const [bar, panel, tabs] = await s.evaluate(() => [".wbar", ".dsec:not(.off)", "#nav"].map(q => document.querySelector(q).getBoundingClientRect().top));
  assert.ok(bar > tabs && bar < panel, "the instrument sits above the opened domain");
  assert.equal(await s.$('meta[name="robots"]'), null);
  assert.match(await s.textContent("#disclaimer"), /Unofficial study aid\. Not affiliated with or endorsed by Anthropic\./);
  await s.click('[data-fk="cert-CCDV-F"]');
  assert.equal(await s.evaluate(() => [S.view, S.cert].join()), "home,CCDV-F");
  await s.click("#nav [data-fk=nav-drill]"); await s.click('[data-fk="brand"]');
  assert.equal(await s.evaluate(() => S.view), "home", "the brand returns to the instrument");
  for (const q of ["start", "blueprint"]) { await s.goto(URL_ + "?view=" + q); assert.equal(await s.evaluate(() => S.view), "home", q + " is an alias"); }
  await s.goto(URL_ + "?view=concepts"); assert.equal(await s.evaluate(() => S.view), "concepts");
  await s.goto(URL_); await s.click("#conceptsLink"); assert.equal(await s.evaluate(() => S.view), "concepts", "Concepts is a link from the instrument");
  assert.equal(await s.$(".samplebar:not([hidden])"), null, "the sample notice is only for ?sample=1");
  await ctx.close();
});

await step("every band carries its domain colour from the first visit: with nothing answered, the tracks are the hue at 42 percent alpha in dark and 35 in light, not grey, in both themes", async () => {
  for (const scheme of ["dark", "light"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme }); const s = await ctx.newPage(); watch(s);
    await s.goto(URL_ + "?view=home&cert=CCDV-F&domain=2&expand=1");
    assert.equal(await s.evaluate(() => Object.keys(prog()[S.cert].q).length), 0);
    const px = await s.evaluate(() => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 1; const g = cv.getContext("2d", { willReadFrequently: true });
      const rgba = c => { g.clearRect(0, 0, 1, 1); g.fillStyle = "#000"; g.fillStyle = c; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return d[3] ? [d[0] * 255 / d[3], d[1] * 255 / d[3], d[2] * 255 / d[3], d[3]] : [0, 0, 0, 0]; };
      const of = sel => [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => rgba(getComputedStyle(e).backgroundColor));
      return { seg: of(".wbar .seg"), z: of(".zbar > div"), tm: of(".tm .t b"), ink: [...document.querySelectorAll(".wbar .seg i")].every(i => i.getBoundingClientRect().width === 0) };
    });
    assert.ok(px.ink, "no answers, no solid ink");
    for (const [k, list] of Object.entries({ seg: px.seg, z: px.z, tm: px.tm })) {
      assert.ok(list.length > 0, k + " present");
      list.forEach(c => { assert.ok(Math.abs(c[3] - (scheme === "dark" ? 107 : 89)) <= 4, scheme + " " + k + " alpha " + c[3]); assert.ok(Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) >= 40, scheme + " " + k + " is grey: " + c.map(Math.round)); });
    }
    assert.equal(new Set(px.seg.map(c => c.slice(0, 3).map(Math.round).join())).size, 8, "eight different hues in the bar");
    await ctx.close();
  }
});

await step("?sample=1 seeds demo progress in memory, is deterministic and never writes localStorage", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const s = await ctx.newPage(); watch(s);
  const snap = async () => { await s.goto(URL_ + "?sample=1&view=progress"); return s.evaluate(() => ({ seen: Object.keys(prog()[S.cert].q).length, mocks: prog()[S.cert].mocks.length, first: (startDrill({ domains: [1, 2, 3, 4, 5] }), S.drill.pool[0].id), ls: localStorage.length })); };
  const a = await snap(), b = await snap();
  assert.ok(a.seen > 20, `seeded ${a.seen} seen`);
  assert.equal(a.mocks, 3);
  assert.deepEqual(a, b, "same seed, same state");
  assert.equal(a.ls, 0, "localStorage untouched");
  assert.ok(await s.isVisible(".samplebar"));
  await ctx.close();
});

await step("?lang=es translates the chrome only; questions stay in English", async () => {
  const s = await browser.newPage(); watch(s);
  await s.goto(URL_ + "?lang=es&sample=1");
  assert.equal(await s.evaluate(() => document.documentElement.lang), "es");
  assert.ok(await s.isVisible("nav >> text=Simulacro"));
  assert.ok(await s.isVisible("text=Para hoy"));
  await s.close();
});

await step("print cheat sheet renders to a multi-page PDF in Chromium", async () => {
  await page.evaluate(() => { setCert("CCAR-F"); go("home"); });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.ok(pages >= 2, `${pages} pages`);
});

await step("<title> and description follow cert and view; Academy link per language", async () => {
  const s = await browser.newPage(); watch(s);
  await s.goto(URL_ + "?sample=1");
  assert.equal(await s.title(), "Claude Cert Studio: CCAR-F practice");
  await s.evaluate(() => { setCert("CCDV-F"); go("mock"); });
  assert.equal(await s.title(), "CCDV-F mock exam — Claude Cert Studio");
  assert.match(await s.getAttribute('meta[name="description"]', "content"), /53-item mock for Claude Certified Developer/);
  await s.goto(URL_ + "?sample=1");
  assert.equal(await s.getAttribute("#academyLink a", "href"), "https://ichisieben.dev/academy/certify/");
  await s.goto(URL_ + "?sample=1&lang=es");
  assert.equal(await s.getAttribute("#academyLink a", "href"), "https://ichisieben.dev/es/academy/certify/");
  await s.close();
});

await step("product files: manifest + icons, robots -> sitemap, og:image 1200x630, sw.js stamp current", async () => {
  const fs = await import("node:fs"); const { execFileSync } = await import("node:child_process");
  const app = path.resolve(import.meta.dirname, "../app");
  const man = JSON.parse(fs.readFileSync(path.join(app, "manifest.webmanifest"), "utf8"));
  man.icons.forEach(i => assert.ok(fs.existsSync(path.join(app, i.src)), i.src));
  assert.match(fs.readFileSync(path.join(app, "robots.txt"), "utf8"), /Sitemap: https:\/\/cert\.ichisieben\.dev\/sitemap\.xml/);
  assert.match(fs.readFileSync(path.join(app, "sitemap.xml"), "utf8"), /<loc>https:\/\/cert\.ichisieben\.dev\/<\/loc>/);
  const png = fs.readFileSync(path.join(app, "og.png"));
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
  assert.equal(await page.getAttribute('meta[property="og:image"]', "content"), "https://cert.ichisieben.dev/og.png");
  assert.equal(await page.getAttribute('link[rel="manifest"]', "href"), "manifest.webmanifest");
  execFileSync(process.execPath, [path.resolve(import.meta.dirname, "../tools/stamp-sw.mjs"), "--check"]);
});

await step("offline: the service worker serves the page and the bank with the network off", async () => {
  const http = await import("node:http"); const fs = await import("node:fs");
  const app = path.resolve(import.meta.dirname, "../app");
  const types = { ".html": "text/html", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png" };
  const srv = http.createServer((req, res) => {
    const f = path.join(app, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\/$/, "/index.html"));
    if (!f.startsWith(app) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const ctx = await browser.newContext();
  try {
    const s = await ctx.newPage(); watch(s);
    const base = `http://localhost:${srv.address().port}/`;
    await s.goto(base);
    await s.evaluate(() => navigator.serviceWorker.ready);
    await s.reload(); await s.evaluate(() => navigator.serviceWorker.ready);
    await ctx.setOffline(true);
    await s.reload();
    assert.equal(await s.$$eval(".wbar .seg", e => e.length), 5);
    assert.ok(await s.evaluate(() => window.QUESTIONS["CCDV-F"].length > 100));
  } finally { await ctx.close(); srv.close(); }
});

await step("no layout shift while the bank loads (CLS 0 with the data scripts delayed 800 ms)", async () => {
  const http = await import("node:http"); const fs = await import("node:fs");
  const app = path.resolve(import.meta.dirname, "../app");
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x"); const f = path.join(app, u.pathname === "/" ? "index.html" : u.pathname);
    if (!f.startsWith(app) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const send = () => { res.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".html") ? "text/html" : "application/octet-stream" }); res.end(fs.readFileSync(f)); };
    f.includes("questions-") ? setTimeout(send, 800) : send();
  });
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  try {
    for (const width of [412, 1350]) {
      const s = await browser.newPage({ viewport: { width, height: 840 } }); watch(s);
      await s.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true }); });
      await s.goto(`http://127.0.0.1:${srv.address().port}/`); await s.waitForFunction(() => window.QUESTIONS && document.querySelector(".wbar")); await s.waitForTimeout(300);
      const cls = await s.evaluate(() => window.__cls);
      assert.ok(cls < 0.01, `CLS ${cls.toFixed(3)} at ${width}px`); await s.close();
    }
  } finally { srv.close(); }
});

await step("LCP: the pre-rendered heading of the instrument is kept by the first render (not re-created), so it paints before the bank", async () => {
  const f = await browser.newPage();
  await f.route("**/data/*.js*", async r => { await new Promise(res => setTimeout(res, 600)); await r.continue(); });
  await f.addInitScript(() => { document.addEventListener("DOMContentLoaded", () => { const l = document.querySelector("#view .lead"); if (l) l.dataset.mark = "pre"; }); });
  await f.goto(URL_);
  await f.waitForSelector(".wbar");
  assert.equal(await f.$eval("#view .lead", e => e.dataset.mark), "pre");
  assert.equal(await f.$$eval("#view h1", els => els.length), 1);
  await f.goto(URL_ + "?lang=es");
  await f.waitForSelector(".wbar");
  assert.match(await f.textContent("#view h1"), /Claude Certified Architect/);
  assert.match(await f.textContent("nav"), /Simulacro/);
  await f.close();
});

await step("UI rules: no dash placeholders on a fresh profile, at most one filled primary per view, header one line", async () => {
  const f = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await f.goto(URL_);
  await f.evaluate(() => { localStorage.clear(); setCert("CCDV-F"); go("home"); });
  assert.equal(await f.$$eval(".kpi b", els => els.filter(e => /^[–—-]$/.test(e.textContent.trim())).length), 0);
  assert.ok(await f.$("#kpiNote"), "missing data is said in a sentence");
  for (const v of ["home", "concepts", "drill", "mock", "traps", "progress"]) {
    await f.evaluate(x => go(x), v);
    const n = await f.$$eval("#view .btn:not(.ghost):not(.link)", els => els.filter(e => e.offsetParent).length);
    assert.ok(n <= 1, `${v}: ${n} filled buttons`);
  }
  assert.ok(await f.$eval(".nav", e => e.getBoundingClientRect().height) < 64, "nav is one line on desktop");
  await f.close();
});

await step("axe: no violations on the 7 views, an answered drill and a mock result (light/dark, 1280/390)", async () => {
  const found = await axeAll(browser);
  assert.deepEqual(found, [], found.join(" | "));
});

await step("i18n: every key exists in EN and ES with the same parameters and tags, and every key the app asks for is defined", async () => {
  const fs = await import("node:fs");
  const d = await page.evaluate(() => window.I18N);
  const en = Object.keys(d.en), es = Object.keys(d.es);
  assert.deepEqual(en.filter(k => !(k in d.es)), [], "keys missing in ES");
  assert.deepEqual(es.filter(k => !(k in d.en)), [], "keys missing in EN");
  const sig = s => [...s.matchAll(/\{(\w+)\}|<\/?(\w+)[^>]*>/g)].map(m => m[1] ? "{" + m[1] + "}" : "<" + m[2] + ">").sort().join();
  en.forEach(k => assert.equal(sig(d.es[k]), sig(d.en[k]), `placeholders/tags differ in ${k}`));
  en.forEach(k => assert.ok(d.es[k].trim() && d.en[k].trim(), `empty ${k}`));
  const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/index.html"), "utf8");
  const used = new Set([...src.matchAll(/\bt\('([\w.]+)'/g)].map(m => m[1]).filter(k => !k.endsWith(".")));
  [...src.matchAll(/\btn\('([\w.]+)'/g)].forEach(m => { used.add(m[1] + ".one"); used.add(m[1] + ".other"); });
  ["home", "concepts", "drill", "mock", "traps", "progress"].forEach(v => { used.add("meta." + v + ".t"); used.add("meta." + v + ".d"); });
  ["drill", "mock", "traps", "progress"].forEach(v => used.add("view." + v));
  [1, 2, 3, 4].forEach(i => used.add("tr.order." + i)); used.add("kind.full"); used.add("kind.quick");
  assert.deepEqual([...used].filter(k => !(k in d.en)), [], "keys used by the app but not defined");
  assert.deepEqual(en.filter(k => !used.has(k)), [], "keys defined but never used");
});

await step("language toggle: ES switches the whole chrome and the URL, no unresolved {placeholders} on any view in either language", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const s = await ctx.newPage(); watch(s);
  const views = ["home", "blueprint", "concepts", "drill", "mock", "traps", "progress"];
  for (const lang of ["en", "es"]) for (const v of views.filter(x => x !== "concepts")) {
    await s.goto(URL_ + `?sample=1&lang=${lang}&view=${v}`);
    const txt = await s.evaluate(() => document.body.innerText);
    assert.ok(!/\{\w+\}/.test(txt), `${lang}/${v}: unresolved placeholder`);
    assert.equal(await s.evaluate(() => document.documentElement.lang), lang);
  }
  await s.goto(URL_ + "?sample=1&view=home&cert=CCDV-F");
  await s.click("#langBtn");
  assert.match(await s.evaluate(() => location.search), /lang=es/);
  assert.ok(await s.isVisible("nav >> text=Simulacro"));
  assert.ok(await s.isVisible("text=Para hoy"));
  await s.goto(URL_ + "?sample=1&lang=es");
  assert.match(await s.textContent("main"), /Las preguntas, las explicaciones y los task statements están en inglés/);
  await ctx.close();
});

await step("the pre-rendered header in the HTML equals what render() builds on a fresh home (no layout change on first paint)", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/index.html"), "utf8");
  const pre = src.match(/<header class="top"><div class="wrap">([\s\S]*?)<\/div><\/header>\n<main>/)[1];
  const ctx = await browser.newContext(); const s = await ctx.newPage(); watch(s);
  await s.goto(URL_);
  const r = await s.evaluate(pre => { const d = document.createElement("div"); d.innerHTML = pre; return [d.innerHTML, document.querySelector("header.top .wrap").innerHTML]; }, pre);
  assert.equal(r[0], r[1]); await ctx.close();
});

await step("instrument: state in the URL (cert, domain, task); every band is labelled (narrow ones on a second row); opened domain on its own 0-100% axis", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const s = await ctx.newPage(); watch(s);
  await s.goto(URL_ + "?sample=1&view=home&cert=CCDV-F&domain=5&task=5.2");
  assert.equal(await s.getAttribute('.keys .k[data-fk="kCCDV-F-5"]', "aria-pressed"), "true");
  assert.ok(await s.$eval("#tk-5\\.2", e => e.open), "task from the URL is open");
  const labels = await s.$$eval(".figs span", e => e.map(x => x.textContent));
  assert.ok(labels.length === 8 && labels.some(l => /^D3 /.test(l)) && labels.some(l => /^D4 /.test(l)), labels.join());
  const boxes = await s.$$eval(".figs span", e => e.map(x => { const r = x.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }));
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => assert.ok(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1], "bar labels never overlap")));
  await s.click('.keys .k[data-fk="kCCDV-F-6"]');
  assert.equal(await s.evaluate(() => location.search.includes("domain=6") && !location.search.includes("task=")), true);
  assert.match(await s.textContent(".dsec:not(.off) .zeq"), /= 11 % of the exam/);
  assert.match(await s.textContent(".dsec:not(.off) .zscale"), /0%.*50%.*100%/);
  const zs = await s.$$eval(".dsec:not(.off) .zbar > div", d => d.reduce((a, x) => a + parseFloat(x.style.flexGrow), 0));
  assert.ok(Math.abs(zs - 11) < 0.1, `task weights add up to the domain weight (${zs})`);
  await s.click(".dsec:not(.off) details.tk >> nth=0 >> summary");
  await s.waitForFunction(() => location.search.includes("task=6.1"));
  assert.ok(await s.isVisible("details.tk[open] >> text=Drill CCDVF-6.1"));
  await s.goto(URL_ + "?sample=1&view=blueprint&cert=CCAR-F");
  assert.equal(await s.$$eval("details.tk[open]", e => e.filter(x => x.offsetParent).length), 7, "the blueprint alias opens the instrument with every task of the opened domain expanded");
  assert.equal(await s.getAttribute("#expandBtn", "aria-pressed"), "true");
  assert.ok(await s.evaluate(() => location.search.includes("expand=1") && location.search.includes("view=home")), "the alias is rewritten to the canonical URL");
  await s.click("#expandBtn");
  assert.equal(await s.$$eval("details.tk[open]", e => e.length), 0, "collapse closes them all");
  assert.ok(await s.evaluate(() => !location.search.includes("expand")));
  await s.click("#expandBtn");
  assert.equal(await s.$$eval("details.tk[open]", e => e.filter(x => x.offsetParent).length), 7);
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } }); watch(m);
  await m.goto(URL_ + "?sample=1&view=home");
  const top = await m.$eval(".mockm", e => e.getBoundingClientRect().top), keysBottom = await m.$eval(".keys", e => e.getBoundingClientRect().bottom);
  assert.ok(await m.isVisible(".mockm") && top >= keysBottom - 1, "mobile: Start mock sits under the instrument");
  assert.equal(await m.isVisible("#navMock"), false, "and leaves the nav");
  await m.close(); await ctx.close();
});

await step("exam cockpit: nav hidden, keys sink in place on A-D, cells coloured only when answered, flag, big mono clock", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const s = await ctx.newPage(); watch(s);
  await s.goto(URL_ + "?sample=1&view=home&cert=CCDV-F");
  await s.evaluate(() => startMock("quick"));
  assert.equal(await s.isVisible("header.top"), false); assert.equal(await s.isVisible("footer"), false);
  assert.ok((await s.$eval("#clock", e => parseFloat(getComputedStyle(e).fontSize))) >= 28);
  assert.match(await s.$eval("#clock", e => getComputedStyle(e).fontFamily), /Geist Mono/);
  const node = await s.$("#opts .opt[data-k=B]");
  await s.keyboard.press("b");
  assert.equal(await node.getAttribute("aria-pressed"), "true", "same node pressed: updated in place");
  assert.equal(await s.$$eval(".cell.a", e => e.length), 1);
  const bg = await s.$eval(".cell.a", e => getComputedStyle(e).backgroundColor), plain = await s.$eval(".cell:not(.a):not(.cur)", e => getComputedStyle(e).backgroundColor);
  assert.notEqual(bg, plain);
  assert.equal(await s.$eval("#opts .opt[data-k=B]", e => getComputedStyle(e).transitionDuration.split(",").map(x => x.trim()).includes("0.15s")), true, "150 ms sink");
  await s.keyboard.press("f"); assert.equal(await s.$$eval(".cell.fl", e => e.length), 1);
  await s.keyboard.press("Enter"); assert.match(await s.textContent("#qcount"), /Question 2 of/);
  assert.equal((await s.textContent("main")).match(/Enter/g).length, 1, "shortcuts are listed once");
  await s.click("text=Leave mock"); assert.ok(await s.isVisible("header.top"));
  await ctx.close();
});

await step("result: instrument filled with the real ink, radar of the ten traps with a text equivalent, study-first = weight x error rate", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const s = await ctx.newPage(); watch(s);
  await s.goto(URL_ + "?sample=1&view=home&cert=CCDV-F");
  const exp = await s.evaluate(() => { startMock("quick"); S.mock.pool.forEach((q, i) => S.mock.answers[i] = i % 3 ? q.answer.slice() : ["A"]); submitMock();
    const r = S.mock.result, b = BP(); return b.domains.filter(d => r.by[d.id].total && r.by[d.id].right < r.by[d.id].total).map(d => [d.id, d.weight * (1 - r.by[d.id].right / r.by[d.id].total)]).sort((a, c) => c[1] - a[1]).slice(0, 3).map(x => x[0]); });
  assert.equal(await s.$$eval(".trapl li", e => e.length), 10);
  assert.ok(await s.$("svg.radar[role=img] title"), "radar has a title and a desc");
  assert.ok(await s.$("svg.radar desc"));
  const shown = await s.$$eval(".first li .dn", e => e.map(x => +x.textContent.slice(1)));
  assert.deepEqual(shown, exp);
  assert.ok((await s.$$eval(".wbar .seg i", e => e.filter(x => parseFloat(getComputedStyle(x).width) > 0).length)) > 0);
  assert.ok(await s.isVisible("table >> text=Result by domain"));
  await ctx.close();
});

await step("answers show the trap, why the right one is right and a source; the questions without a ref say 'no source yet'", async () => {
  const r = await page.evaluate(() => { let linked = 0, none = 0, bad = 0, total = 0;
    for (const c of Object.keys(window.QUESTIONS)) window.QUESTIONS[c].forEach(q => { total++; const d = document.createElement("div"); S.cert = c; d.innerHTML = question(q, { chosen: q.answer.slice(), checked: true });
      const a = d.querySelector(".docref a"), n = d.querySelector(".nosrc .tag");
      if (q.ref) { if (a && !n) linked++; else bad++; } else { if (n && /no source yet/.test(n.textContent) && !a) none++; else bad++; }
      if (!/Why the right one is right/.test(d.textContent) || !d.querySelector(".tag.trap, .tag.ok")) bad++; });
    S.cert = "CCDV-F"; return { linked, none, bad, total }; });
  assert.equal(r.bad, 0); assert.equal(r.linked + r.none, r.total); assert.ok(r.none > 0 && r.linked > 90, JSON.stringify(r));
  const es = await browser.newPage(); watch(es); await es.goto(URL_ + "?lang=es&sample=1");
  assert.equal(await es.evaluate(() => { const q = QUESTIONS["CCDV-F"].find(x => !x.ref); const d = document.createElement("div"); d.innerHTML = question(q, { chosen: q.answer.slice(), checked: true }); return d.querySelector(".nosrc .tag").textContent; }), "sin fuente aún");
  await es.close();
});

await step("every exam claim links its source (both certification pages and the FAQ) with the consulted date", async () => {
  const ctx = await browser.newContext(); const s = await ctx.newPage(); watch(s);
  await s.goto(URL_ + "?sample=1");
  const cert = { "CCAR-F": "claude-certified-architect-foundations-certification", "CCDV-F": "claude-certified-developer-foundations-certification" };
  for (const c of Object.keys(cert)) {
    await s.goto(URL_ + `?sample=1&view=home&cert=${c}`);
    const hrefs = await s.$$eval(".src a", a => a.map(x => x.href));
    [cert[c], "page/faq-certifications"].forEach(u => assert.ok(hrefs.some(h => h.endsWith(u)), c + " " + u));
    assert.ok((await s.$$eval(".src", e => e.every(x => x.textContent.includes("2026-10-15")))));
  }
  for (const v of ["home", "mock"]) { await s.goto(URL_ + `?sample=1&view=${v}&cert=CCDV-F`); assert.ok(await s.$(".src a"), v + " links a source"); }
  await ctx.close();
});

await step("progress import: export then import round-trips exactly; a bad file changes nothing; the page says where progress lives", async () => {
  const fs = await import("node:fs"); const os = await import("node:os");
  const ctx = await browser.newContext({ acceptDownloads: true }); const s = await ctx.newPage(); watch(s);
  await s.goto(URL_);
  await s.evaluate(() => { setCert("CCDV-F"); const a = QS()[0], b = QS()[1]; record(a, true, a.answer); record(b, false, ["A", "B", "C", "D"].filter(k => !b.answer.includes(k)).slice(0, b.select)); go("progress"); });
  assert.match(await s.textContent("#where"), /only in this browser/);
  const before = await s.evaluate(() => localStorage.getItem("ccs:progress"));
  const [dl] = await Promise.all([s.waitForEvent("download"), s.click("text=Export progress (JSON)")]);
  const file = await dl.path(); assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), JSON.parse(before));
  await s.evaluate(() => { localStorage.removeItem("ccs:progress"); render(); });
  assert.equal(await s.evaluate(() => Object.keys(prog()[S.cert].q).length), 0);
  await s.setInputFiles("#importFile", file);
  await s.waitForFunction(() => /Imported/.test(document.getElementById("ioMsg").textContent));
  assert.deepEqual(JSON.parse(await s.evaluate(() => localStorage.getItem("ccs:progress"))), JSON.parse(before), "round trip is exact");
  const bad = path.join(os.tmpdir(), "ccs-bad.json"); fs.writeFileSync(bad, '{"hello":1}');
  await s.setInputFiles("#importFile", bad);
  await s.waitForFunction(() => /not a Cert Studio/.test(document.getElementById("ioMsg").textContent));
  assert.equal(await s.evaluate(() => localStorage.getItem("ccs:progress")), before, "bad file leaves progress untouched");
  fs.unlinkSync(bad); await ctx.close();
});

await step("design rules in the source: no arrows or midpoints, one uppercase-label rule, no outer shadows, every domain colour keeps AA contrast, D7 moved off the salmon", async () => {
  const fs = await import("node:fs"); const app = path.resolve(import.meta.dirname, "../app");
  const html = fs.readFileSync(path.join(app, "index.html"), "utf8"), i18n = fs.readFileSync(path.join(app, "data/i18n.js"), "utf8");
  for (const [n, s] of [["index.html", html], ["i18n.js", i18n]]) { assert.ok(!s.includes("→"), n + " has an arrow"); assert.ok(!s.includes("·"), n + " has a midpoint"); }
  assert.equal((html.match(/text-transform:uppercase/g) || []).length, 1, "only the task-statement code eyebrow is uppercase");
  assert.ok(!/box-shadow:[^;}]*\b\d+px \d+px \d+px/.test(html.replace(/inset [^,;}]*/g, "")), "no outer drop shadows");
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const darkBlk = html.match(/:root\{[\s\S]*?\n\}/)[0], light = html.match(/:root\[data-theme="light"\]\{[\s\S]*?\n\}/)[0];
  const get = (blk, n) => blk.match(new RegExp(`--d${n}:(#[0-9a-f]{6})`))[1], tok = (blk, k) => blk.match(new RegExp(`--${k}:(#[0-9a-f]{6})`))[1];
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const over = (c, bg, a) => c.map((v, i) => a * v + (1 - a) * bg[i]);   // c at alpha a over bg
  const lumRgb = c => { const l = c.map(v => v / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
  const crRgb = (a, b) => { const x = lumRgb(a), y = lumRgb(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mq = html.match(/@media \(prefers-color-scheme: light\)\{ :root:not\(\[data-theme="dark"\]\)\{[\s\S]*?\n\}\}/)[0];
  for (let n = 1; n <= 8; n++) assert.equal(get(mq, n), get(light, n), `D${n}: the OS-light block and data-theme=light agree`);
  // WCAG 1.4.3 / 1.4.11 for all 8 domains x 2 themes: the colour as text on every surface it sits on (>= 4.5), the solid
  // fill against the 42 percent (dark) or 35 percent (light) track it grows inside (>= 3), and the solid fill against the canvas and the card (>= 3)
  for (const [theme, blk] of [["dark", darkBlk], ["light", light]]) {
    const surf = ["canvas", "card", "well"].map(k => rgb(tok(blk, k))), canvas = rgb(tok(blk, "canvas")), card = rgb(tok(blk, "card"));
    for (let n = 1; n <= 8; n++) {
      const c = rgb(get(blk, n));
      surf.forEach(b => assert.ok(crRgb(c, b) >= 4.5, `D${n} ${theme} as text ${crRgb(c, b).toFixed(2)}`));
      [canvas, card].forEach(b => { const tr = over(c, b, theme === "dark" ? .42 : .35); assert.ok(crRgb(c, tr) >= 3, `D${n} ${theme} fill vs track ${crRgb(c, tr).toFixed(2)}`); assert.ok(crRgb(c, b) >= 3, `D${n} ${theme} fill vs surface`); });
    }
  }
  assert.ok(!/--trk/.test(html), "no grey track token is left: tracks are color-mix(hue var(--ta), transparent)");
  assert.notEqual(get(darkBlk, 7), "#d77965"); assert.notEqual(get(light, 7), "#b4462f");
});

await step("importing a hostile or malformed progress file renders Progress with no injected element and no error", async () => {
  const s = await browser.newPage(); const errs = []; s.on("pageerror", e => errs.push(String(e))); s.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await s.goto(URL_ + "?view=progress&cert=CCAR-F");
  const evil = "<img src=x onerror=window.__x=1>";
  const good = { date: "2026-10-01", kind: "full", score: 700, pct: 60, misses: 3, byDomain: { [evil]: 50 }, ids: ["a"] };
  const raw = { "CCAR-F": { q: {}, traps: {}, mocks: [
    { ...good, date: evil }, { ...good, kind: evil }, { ...good, pct: "x" }, { ...good, misses: null }, { ...good, byDomain: "no", ids: "no" }, good ] } };
  await s.setInputFiles("#importFile", { name: "p.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(raw)) });
  await s.waitForFunction(() => document.getElementById("ioMsg").textContent.length > 0);
  assert.equal(await s.locator("img[src='x']").count(), 0);
  assert.equal(await s.evaluate(() => window.__x), undefined);
  assert.equal(await s.locator("table tr").count(), 3, "header + the two valid entries");
  await s.setInputFiles("#importFile", { name: "q.json", mimeType: "application/json", buffer: Buffer.from('{"CCAR-F":{"q":{},"mocks":[null,1]}}') });
  await s.waitForTimeout(200);
  assert.deepEqual(errs, []);
  await s.close();
});

await step("popstate to another certification clears the stale drill and mock", async () => {
  const s = await browser.newPage(); const errs = []; s.on("pageerror", e => errs.push(String(e)));
  await s.goto(URL_); await s.evaluate(() => { localStorage.clear(); setCert("CCDV-F"); go("mock"); go("home"); setCert("CCAR-F"); startDrill({}); });
  assert.ok(await s.evaluate(() => !!S.drill));
  await s.evaluate(() => history.go(-2)); await s.waitForFunction(() => S.cert === "CCDV-F");
  assert.equal(await s.evaluate(() => S.drill), null);
  await s.evaluate(() => history.go(2)); await s.waitForFunction(() => S.cert === "CCAR-F");
  assert.equal(await s.evaluate(() => S.drill === null && S.mock === null), true);
  assert.deepEqual(errs, []);
  await s.close();
});

await step("a mock that times out records answered items only, not blanks", async () => {
  const s = await browser.newPage(); watch(s);
  await s.goto(URL_); await s.evaluate(() => { localStorage.clear(); setCert("CCAR-F"); startMock("quick"); });
  await answerCurrent(s, "mock");
  await s.evaluate(() => { S.mock.end = Date.now() - 1; });
  await s.waitForSelector(".score");
  const n = await s.evaluate(() => Object.keys(prog()["CCAR-F"].q).length);
  assert.equal(n, 1);
  assert.ok(await s.evaluate(() => S.mock.result.misses.length) > 1, "blanks still count as misses");
  await s.close();
});

await step("switching certification during an unsubmitted mock asks first and can be declined", async () => {
  const s = await browser.newPage(); const msgs = []; let accept = false;
  s.on("dialog", d => { msgs.push(d.message()); accept ? d.accept() : d.dismiss(); });
  await s.goto(URL_); await s.evaluate(() => { localStorage.clear(); setCert("CCAR-F"); startMock("quick"); });
  await s.evaluate(() => setCert("CCDV-F"));
  assert.equal(msgs.length, 1);
  assert.equal(await s.evaluate(() => S.cert + "|" + !!S.mock), "CCAR-F|true");
  accept = true; await s.evaluate(() => setCert("CCDV-F"));
  assert.equal(await s.evaluate(() => S.cert + "|" + !!S.mock), "CCDV-F|false");
  await s.close();
});

await step("i18n strings used inside inline JS contain no apostrophe", async () => {
  const s = await browser.newPage(); await s.goto(URL_);
  const bad = await s.evaluate(() => ["en", "es"].flatMap(l => ["mock.confirm", "pg.resetConfirm", "mock.switch"].filter(k => /['’]/.test(window.I18N[l][k])).map(k => l + ":" + k)));
  assert.deepEqual(bad, []);
  await s.close();
});

await step("Enter on a focused option selects it in the mock; the URL keeps lang=en", async () => {
  const s = await browser.newPage(); watch(s);
  await s.goto(URL_); await s.evaluate(() => { localStorage.clear(); setCert("CCAR-F"); startMock("quick"); });
  assert.match(await s.evaluate(() => location.search), /lang=en/);
  await s.focus(".opt[data-k='B']"); await s.keyboard.press("Enter");
  assert.deepEqual(await s.evaluate(() => [S.mock.i, S.mock.chosen.join()]), [0, "B"]);
  await s.close();
});

// Local YYYY-MM-DD for today + n days (same machine, same timezone as the browser).
const dayPlus = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

await step("exam date: set and clear per certification, daily plan at the cap, pace line on the instrument, past dates refused, survives export/import", async () => {
  const s = await browser.newPage(); watch(s);
  await s.goto(URL_); await s.evaluate(() => { localStorage.clear(); setCert("CCDV-F"); go("home"); });
  assert.equal(await s.$("#paceLine"), null, "no date, no pace line");
  await s.evaluate(() => go("progress"));
  assert.equal(await s.$("#examPlan"), null, "no date, no plan");
  await s.fill("#examDate", dayPlus(20));
  assert.equal(await s.evaluate(() => progOf("CCDV-F").exam), dayPlus(20));
  const bank = await s.evaluate(() => QS().length);
  assert.match(await s.textContent("#examPlan li:first-child"), new RegExp(`Today\s*${Math.min(10, Math.ceil(bank / 20))} questions`));
  const rows = await s.$$eval("#examPlan li", l => l.length); assert.ok(rows >= 5 && rows <= 7, "plan lists the next days, got " + rows);
  await s.evaluate(() => go("home"));
  assert.equal((await s.textContent("#paceLine")).trim(), `At your pace (10 a day): ${Math.ceil(bank / 10)} days of work left, 20 days to the exam.`);
  await s.evaluate(() => setCert("CCAR-F")); assert.equal(await s.$("#paceLine"), null, "the date belongs to one certification");
  await s.evaluate(() => { setCert("CCDV-F"); go("progress"); setExam("2020-01-01"); });
  assert.match(await s.textContent("#exMsg"), /already passed/); assert.equal(await s.evaluate(() => progOf("CCDV-F").exam), dayPlus(20), "a past date saves nothing");
  const n = await s.evaluate(() => normalizeProgress(JSON.parse(localStorage.getItem("ccs:progress"))).data["CCDV-F"].exam);
  assert.equal(n, dayPlus(20), "import keeps the date");
  assert.equal(await s.evaluate(() => normalizeProgress({ "CCDV-F": { q: {}, exam: "2026-13-45" } }).data["CCDV-F"].exam), undefined, "a malformed date is dropped");
  await s.click("#examClear");
  assert.equal(await s.evaluate(() => progOf("CCDV-F").exam), undefined); assert.equal(await s.$("#examPlan"), null);
  await s.close();
});

await step("docs state the e2e test count and it matches this file", async () => {
  const fs = await import("node:fs"); const root = path.resolve(import.meta.dirname, "..");
  const n = (fs.readFileSync(import.meta.filename, "utf8").match(/^await step\(/gm) || []).length;
  for (const f of ["README.md", "README.en.md", "docs/FICHA-LANDING.md", "docs/arquitectura.html"]) {
    const txt = fs.readFileSync(path.join(root, f), "utf8");
    const found = [...txt.matchAll(/\b(\d+)\s+(?:tests e2e|e2e tests|e2e con Playwright|Playwright e2e|pruebas de punta a punta|pruebas|casos)\b/g)].map(m => +m[1]);
    assert.ok(found.length > 0, f + " states a count"); found.forEach(x => assert.equal(x, n, `${f} says ${x}, the suite has ${n}`));
  }
});

await step("zero console errors", async () => { assert.deepEqual(errors, [], errors.join(" | ")); });

await browser.close();
for (const [s, n] of results) console.log(`${s}  ${n}`);
const failed = results.filter(r => r[0] === "FAIL").length;
console.log(failed ? `\n${failed} FAILED` : `\nALL ${results.length} PASSED`);
process.exit(failed ? 1 : 0);
