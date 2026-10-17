// Post-deploy check against the live site: bank size, service worker and its cache, fonts, offline,
// console errors, failed responses, CLS. `node tools/live-check.mjs [url]`. Exit 1 on any failure.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL_ = process.argv[2] || "https://cert.ichisieben.dev/";
const want = fs.readFileSync(path.resolve(import.meta.dirname, "../app/sw.js"), "utf8").match(/const VERSION = '([^']+)'/)[1];
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [], bad = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", e => errors.push(String(e)));
page.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
await page.goto(URL_ + "?cert=CCDV-F&view=home", { waitUntil: "networkidle" });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(1500);
const r = await page.evaluate(async () => ({
  bank: Object.fromEntries(Object.entries(window.QUESTIONS).map(([k, v]) => [k, v.length])),
  caches: await caches.keys(),
  fonts: [...document.fonts].filter(f => f.status === "loaded").map(f => f.family),
  sans: getComputedStyle(document.body).fontFamily.split(",")[0],
  cls: window.__cls,
}));
await ctx.setOffline(true);
await page.reload();
const off = await page.evaluate(() => Object.values(window.QUESTIONS).map(v => v.length).join("/"));
await browser.close();
const fails = [];
if (r.bank["CCAR-F"] !== 120 || r.bank["CCDV-F"] !== 120) fails.push("bank " + JSON.stringify(r.bank));
if (!r.caches.includes(want)) fails.push(`cache ${r.caches} != ${want}`);
if (!r.fonts.includes("Inter") || !r.fonts.includes("Geist Mono")) fails.push("fonts " + r.fonts);
if (off !== "120/120") fails.push("offline " + off);
if (r.cls > 0.01) fails.push("CLS " + r.cls.toFixed(3));
if (errors.length) fails.push("console " + errors.join(" | "));
if (bad.length) fails.push(">=400 " + bad.join(" | "));
console.log(`live ${URL_}: bank ${r.bank["CCAR-F"]}/${r.bank["CCDV-F"]} · sw cache ${r.caches.join(",")} · fonts ${[...new Set(r.fonts)].join(", ")} · offline ${off} · CLS ${r.cls.toFixed(3)} · console errors ${errors.length} · >=400 ${bad.length}`);
fails.forEach(f => console.log("FAIL " + f));
process.exit(fails.length ? 1 : 0);
