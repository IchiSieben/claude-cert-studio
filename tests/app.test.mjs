// End-to-end smoke test for app/index.html over file:// (no server, no network).
// Run: npm test   (needs `npm i -D playwright`; uses Playwright's Chromium, or set CHROME_PATH
// to a system Chromium/Edge if the browser download is blocked).
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

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

await step("zero console errors", async () => { assert.deepEqual(errors, []); });

await browser.close();
for (const [s, n] of results) console.log(`${s}  ${n}`);
const failed = results.filter(r => r[0] === "FAIL").length;
console.log(failed ? `\n${failed} FAILED` : `\nALL ${results.length} PASSED`);
process.exit(failed ? 1 : 0);
