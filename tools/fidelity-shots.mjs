// Fidelity evidence (V3c fix): the instrument view ("/") against the approved mockup 45ad075.
// One browser, CCDV-F (the mockup's certification, heaviest domain open), light and dark, 1440x900 and 390x844,
// in two states: fresh (empty storage, nothing answered: the bar must already be in colour) and sample (?sample=1).
// Writes evidence/identidad/fix/<state>-<theme>-<width>.png; then tools/fidelity-pairs.py joins each with the mockup.
//   node tools/fidelity-shots.mjs
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "evidence/identidad/fix");
fs.mkdirSync(out, { recursive: true });
const base = pathToFileURL(path.join(root, "app/index.html")).href;
const STATES = [["fresh", "?cert=CCDV-F&view=home"], ["sample", "?sample=1&cert=CCDV-F&view=home"]];
const SIZES = [[1440, 900], [390, 844]];
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let n = 0;
for (const [state, q] of STATES) for (const theme of ["dark", "light"]) for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });   // new context = empty localStorage
  const page = await ctx.newPage();
  await page.goto(base + q);
  await page.waitForFunction(() => document.querySelector(".wbar"));
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // finite entrance animations (the instrument draw) must end before the shot
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
  await page.screenshot({ path: path.join(out, `${state}-${theme}-${w}.png`) });
  await ctx.close(); n++;
}
await browser.close();
console.log(`fidelity-shots: ${n} captures -> evidence/identidad/fix/`);
