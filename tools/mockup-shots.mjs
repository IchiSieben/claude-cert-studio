// Identity mockups (docs/DIRECCIONES.md): docs/mockups/{a,b,c}.html in light and dark at 1440 and 390 px,
// viewport-sized, CCDV-F with its heaviest domain open. Writes evidence/identidad/<x>-<theme>-<width>.png.
//   node tools/mockup-shots.mjs [a b c raycast]
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "evidence/identidad");
fs.mkdirSync(out, { recursive: true });
const which = process.argv.slice(2).length ? process.argv.slice(2) : ["a", "b", "c"];
const SIZES = [[1440, 900], [390, 844]];
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const errors = [];
// raycast.html has two screens: the overview (default) and exam mode (?view=exam)
const jobs = which.flatMap(x => x === "raycast" ? [["raycast", ""], ["raycast-exam", "&view=exam"]] : [[x, ""]]);
for (const [x, extra] of jobs) for (const theme of ["light", "dark"]) for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: "reduce" });
  page.on("pageerror", e => errors.push(`${x} ${theme} ${w}: ${e.message}`));
  page.on("console", m => m.type() === "error" && errors.push(`${x} ${theme} ${w}: ${m.text()}`));
  await page.goto(pathToFileURL(path.join(root, "docs/mockups", `${x.replace(/-exam$/, "")}.html`)).href + `?cert=CCDV-F&theme=${theme}${extra}`);
  await page.waitForFunction(() => document.querySelector("#view").children.length > 0);
  await page.evaluate(() => document.fonts.ready);
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  if (scrollW > w) errors.push(`${x} ${theme} ${w}: horizontal scroll (${scrollW}px)`);
  await page.screenshot({ path: path.join(out, `${x}-${theme}-${w}.png`) });
  await page.close();
}
await browser.close();
console.log(`mockup-shots: ${jobs.length * 4} captures -> evidence/identidad/`);
if (errors.length) { console.log(errors.join("\n")); process.exit(1); }
