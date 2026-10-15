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
  catch (e) { results.push(["FAIL", name + " — " + e.message.split("\n")[0]]); }
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
    if (i < n - 1) await page.click("text=Next →");
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
    await page.click(i < 4 ? "text=Next →" : "text=Next →");
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
  await page.click("text=Save & see progress");
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

await step("blueprint print view hides chrome and shows per-task mastery bars", async () => {
  await page.evaluate(() => go("blueprint"));
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.isVisible("header"), false);
  assert.equal(await page.isVisible("#printBtn"), false);
  assert.ok(await page.isVisible(".printonly .bar >> nth=0"));
  await page.emulateMedia({ media: "screen" });
});

await step("CCDV-F: switch cert, concepts and blueprint render", async () => {
  await page.evaluate(() => setCert("CCDV-F"));
  await page.evaluate(() => go("concepts"));
  assert.ok((await page.$$eval("#conceptGrid .concept", e => e.length)) > 0);
  await page.evaluate(() => go("blueprint"));
  assert.ok(await page.isVisible("text=Blueprint · CCDV-F"));
});

await step("mobile 390 px: no horizontal scroll on any view", async () => {
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(m);
  await m.goto(URL_);
  const bad = [];
  for (const v of ["start", "home", "blueprint", "concepts", "drill", "mock", "traps", "progress"]) {
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

await step("fresh visitor lands on the start page: both certs, weights sum to 100, listed (no noindex), disclaimer", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const s = await ctx.newPage(); watch(s);
  await s.goto(URL_);
  assert.equal(await s.evaluate(() => S.view), "start");
  assert.equal(await s.$$eval(".certcard", e => e.length), 2);
  const sums = await s.$$eval(".certcard .wbar", bars => bars.map(b => [...b.children].reduce((a, i) => a + parseFloat(i.style.width), 0)));
  sums.forEach(x => assert.ok(Math.abs(x - 100) < 0.6, `weights sum ${x}`));
  assert.equal(await s.$('meta[name="robots"]'), null);
  assert.match(await s.textContent("#disclaimer"), /Unofficial study aid\. Not affiliated with or endorsed by Anthropic\./);
  await s.click(".certcard >> nth=1 >> button");
  assert.equal(await s.evaluate(() => [S.view, S.cert].join()), "home,CCDV-F");
  await ctx.close();
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
  assert.ok(await s.isVisible("nav >> text=Inicio"));
  assert.ok(await s.isVisible("text=Dos certificaciones de Claude"));
  await s.close();
});

await step("print cheat sheet renders to a multi-page PDF in Chromium", async () => {
  await page.evaluate(() => { setCert("CCAR-F"); go("blueprint"); });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.ok(pages >= 2, `${pages} pages`);
});

await step("<title> and description follow cert and view; Academy link per language", async () => {
  const s = await browser.newPage(); watch(s);
  await s.goto(URL_ + "?sample=1");
  assert.match(await s.title(), /^Claude Cert Studio · CCAR-F and CCDV-F practice$/);
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
    assert.equal(await s.$$eval(".certcard", e => e.length), 2);
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
      await s.goto(`http://127.0.0.1:${srv.address().port}/`); await s.waitForFunction(() => window.QUESTIONS && document.querySelector(".certcard")); await s.waitForTimeout(300);
      const cls = await s.evaluate(() => window.__cls);
      assert.ok(cls < 0.01, `CLS ${cls.toFixed(3)} at ${width}px`); await s.close();
    }
  } finally { srv.close(); }
});

await step("UI rules: no dash placeholders on a fresh profile, at most one filled primary per view, header one line", async () => {
  const f = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await f.goto(URL_);
  await f.evaluate(() => { localStorage.clear(); setCert("CCDV-F"); go("home"); });
  assert.equal(await f.$$eval(".kpi b", els => els.filter(e => /^[–—-]$/.test(e.textContent.trim())).length), 0);
  assert.ok(await f.$("#kpiNote"), "missing data is said in a sentence");
  for (const v of ["start", "home", "blueprint", "concepts", "drill", "mock", "traps", "progress"]) {
    await f.evaluate(x => go(x), v);
    const n = await f.$$eval("#view .btn:not(.ghost):not(.link)", els => els.filter(e => e.offsetParent).length);
    assert.ok(n <= 1, `${v}: ${n} filled buttons`);
  }
  assert.equal(await f.$eval(".bar1", e => e.getBoundingClientRect().height), 48);
  await f.close();
});

await step("axe: no violations on the 8 views, an answered drill and a mock result (light/dark, 1280/390)", async () => {
  const found = await axeAll(browser);
  assert.deepEqual(found, [], found.join(" | "));
});

await step("zero console errors", async () => { assert.deepEqual(errors, [], errors.join(" | ")); });

await browser.close();
for (const [s, n] of results) console.log(`${s}  ${n}`);
const failed = results.filter(r => r[0] === "FAIL").length;
console.log(failed ? `\n${failed} FAILED` : `\nALL ${results.length} PASSED`);
process.exit(failed ? 1 : 0);
