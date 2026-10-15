// axe-core over the 8 views, light and dark, 1280 and 390 px, in sample mode (so the progress views have data).
// One page at a time (Windows). Exit 1 on any violation.  node tools/axe.mjs
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const base = pathToFileURL(path.join(root, "app/index.html")).href;
export const VIEWS = ["start", "home", "blueprint", "concepts", "drill", "mock", "traps", "progress"];

const STATES = [
  ["drill-checked", () => { startDrill({ domains: [1, 2, 3, 4, 5, 6, 7, 8] }); const q = S.drill.pool[0]; S.drill.chosen = [Object.keys(q.options).find(k => !q.answer.includes(k))].concat(q.answer).slice(0, q.select); drillCheck(); }],
  ["mock-result", () => { startMock("quick"); S.mock.pool.forEach((q, i) => S.mock.answers[i] = i % 2 ? q.answer.slice() : ["A"]); submitMock(); }],
];

export async function axeAll(browser) {
  const found = [];
  for (const scheme of ["light", "dark"]) for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
    for (const view of VIEWS) {
      await page.goto(`${base}?sample=1&view=${view}`);
      await page.waitForFunction(() => document.querySelector("#view").children.length > 0);
      await page.addScriptTag({ content: AXE });
      const r = await page.evaluate(() => axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }));
      for (const v of r.violations) found.push(`${view} ${scheme} ${width}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map(n => n.target.join(" ")).join(" | ")}`);
    }
    // the states behind the views: an answered drill question (explanation + trap tags) and a mock result
    for (const [name, setup] of STATES) {
      await page.goto(`${base}?sample=1&view=home`);
      await page.waitForFunction(() => document.querySelector("#view").children.length > 0);
      await page.evaluate(setup);
      await page.addScriptTag({ content: AXE });
      const r = await page.evaluate(() => axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }));
      for (const v of r.violations) found.push(`${name} ${scheme} ${width}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map(n => n.target.join(" ")).join(" | ")}`);
    }
    await page.close();
  }
  return found;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const found = await axeAll(browser);
  await browser.close();
  found.forEach(f => console.log(f));
  console.log(`axe: ${VIEWS.length} views x 2 themes x 2 widths, ${found.length} violations`);
  process.exit(found.length ? 1 : 0);
}
