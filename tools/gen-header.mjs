// Prints (or with --write, writes into app/index.html) the pre-rendered header: the exact markup render() builds on the
// instrument (home) view in English with no stored state. Shipping it in the HTML keeps the first paint and CLS identical to the
// JS-rendered one. A test compares the two, so run `node tools/gen-header.mjs --write` after changing navHtml().
import { chromium } from "playwright";
import { pathToFileURL } from "node:url"; import path from "node:path"; import fs from "node:fs";
const file = path.resolve(import.meta.dirname, "../app/index.html");
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const p = await (await b.newContext()).newPage();
await p.goto(pathToFileURL(file).href);
const nav = await p.evaluate(() => { S.view = "home"; S.cert = "CCAR-F"; return navHtml(); });
await b.close();
const html = `<header class="top"><div class="wrap">${nav}</div></header>`;
if (process.argv.includes("--write")) {
  const src = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, src.replace(/<header class="top"><div class="wrap">[\s\S]*?<\/div><\/header>(?=\n<main>)/, () => html));
  console.log("header written");
} else console.log(html);
