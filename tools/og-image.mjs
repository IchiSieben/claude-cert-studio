// Render app/og.png (1200x630) from the start page: `node tools/og-image.mjs`. Sample mode, light theme,
// over file:// so it never depends on the deployed copy.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url'; import path from 'node:path';
const app = path.resolve(import.meta.dirname, '../app');
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
await p.goto(pathToFileURL(path.join(app, 'index.html')).href + '?sample=1');
await p.addStyleTag({ content: '#sampleBanner{display:none!important} main .wrap{padding-top:28px}' });
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(app, 'og.png') });
await b.close();
console.log('og.png written');
