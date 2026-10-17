// UI evidence: the 8 views in sample mode, light and dark at 1280 px and light at 390 px, viewport-sized
// (what a visitor sees first, not a full-page scroll). Writes evidence/ui/<tag>/<view>-<variant>.png.
//   node tools/ui-shots.mjs <tag>      e.g. before | after
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const tag = process.argv[2] || "after";
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "evidence/ui", tag);
fs.mkdirSync(out, { recursive: true });
const base = pathToFileURL(path.join(root, "app/index.html")).href;
const VIEWS = ["home", "home&expand=1", "concepts", "drill", "mock", "traps", "progress"];
const VARIANTS = [["light", 1280, 800], ["dark", 1280, 800], ["390", 390, 844]];

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
for (const [v, w, h] of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: v === "dark" ? "dark" : "light" });
  for (const view of VIEWS) {
    await page.goto(`${base}?sample=1&cert=CCDV-F&view=${view}`);
    await page.waitForFunction(() => document.querySelector("#view").children.length > 0);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    // finite entrance animations (the instrument draw) must end before the shot
    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
    await page.screenshot({ path: path.join(out, `${view.replace("&expand=1","-expanded")}-${v}.png`) });
  }
  await page.close();
}
await browser.close();
console.log(`ui-shots: ${VIEWS.length * VARIANTS.length} captures -> evidence/ui/${tag}/`);
