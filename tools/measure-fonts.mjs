import { chromium } from "playwright";
import { pathToFileURL } from "node:url"; import path from "node:path"; import fs from "node:fs";
const dir = path.resolve(import.meta.dirname, "../app/fonts");
const html = `<style>@font-face{font-family:IN;src:url(${pathToFileURL(path.join(dir,"inter-latin-wght-normal.woff2"))});font-weight:100 900}
@font-face{font-family:GM;src:url(${pathToFileURL(path.join(dir,"geist-mono-latin-wght-normal.woff2"))});font-weight:100 900}</style><body>x`;
const f = path.join(path.resolve(import.meta.dirname, ".."), "app/_m.html"); fs.writeFileSync(f, html);
const b = await chromium.launch(); const p = await b.newPage(); await p.goto(pathToFileURL(f).href);
const TXT = "The quick brown fox jumps over the lazy dog. Understanding requirements and infrastructure from business needs, 0123456789 % Domain Tool Design & MCP Integration";
const r = await p.evaluate(async (TXT) => {
  await Promise.all(["400 1000px IN","600 1000px IN","400 1000px GM","500 1000px GM"].map(x => document.fonts.load(x)));
  const c = document.createElement("canvas").getContext("2d"); const m = (font) => { c.font = font; const t = c.measureText(TXT); return { w: t.width, a: t.fontBoundingBoxAscent, d: t.fontBoundingBoxDescent }; };
  return { in400: m("400 1000px IN"), in600: m("600 1000px IN"), ar400: m("400 1000px Arial"), ar700: m("700 1000px Arial"), gm400: m("400 1000px GM"), cn400: m("400 1000px 'Courier New'"), gm500: m("500 1000px GM"), cn500: m("500 1000px 'Courier New'") };
}, TXT);
fs.unlinkSync(f); await b.close();
const pr = (n, web, fb) => { const sa = web.w / fb.w; console.log(n, "size-adjust", (sa*100).toFixed(2)+"%", "ascent", (web.a/1000/sa*100).toFixed(2)+"%", "descent", (web.d/1000/sa*100).toFixed(2)+"%"); };
pr("Inter 400 / Arial", r.in400, r.ar400); pr("Inter 600 / Arial Bold", r.in600, r.ar700); pr("Geist Mono 400 / Courier New", r.gm400, r.cn400); pr("Geist Mono 500 / Courier New", r.gm500, r.cn500);
console.log(JSON.stringify(r));
