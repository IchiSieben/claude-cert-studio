// Version the app's cached assets so neither the hosting CDN (which keeps .js for a week) nor the service
// worker can serve an old bank:
//   1. every data script gets `?v=<sha256 of its content>` in index.html and in sw.js's FILES;
//   2. sw.js's VERSION (its cache name) = hash of all the files it caches.
// `node tools/stamp-sw.mjs` writes both; `--check` exits 1 if either is stale (run by the e2e suite and the deploy).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const app = path.resolve(import.meta.dirname, '../app');
const DATA = ['data/blueprints.js', 'data/questions-ccar-f.js', 'data/questions-ccdv-f.js', 'data/i18n.js'];
const sha = (buf, n) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, n);
const read = f => fs.readFileSync(path.join(app, f), 'utf8');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let html = read('index.html'), sw = read('sw.js');
for (const d of DATA) {
  const v = sha(fs.readFileSync(path.join(app, d)), 8);
  html = html.replace(new RegExp(`src="${esc(d)}(\\?v=[0-9a-f]+)?"`), `src="${d}?v=${v}"`);
  sw = sw.replace(new RegExp(`'${esc(d)}(\\?v=[0-9a-f]+)?'`), `'${d}?v=${v}'`);
}
const files = JSON.parse(sw.match(/const FILES = (\[[^\]]*\])/)[1].replace(/'/g, '"')).filter(f => f !== './');
const h = crypto.createHash('sha256');
for (const f of files) { const p = f.split('?')[0]; h.update(p + '\0').update(p === 'index.html' ? html : fs.readFileSync(path.join(app, p))); }
const want = 'ccs-' + h.digest('hex').slice(0, 10);
const have = sw.match(/const VERSION = '([^']+)'/)[1];
sw = sw.replace(`const VERSION = '${have}'`, `const VERSION = '${want}'`);

const stale = [html !== read('index.html') && 'index.html data ?v=', sw !== read('sw.js') && 'sw.js'].filter(Boolean);
if (process.argv.includes('--check')) {
  console.log(stale.length ? `stamp STALE (${stale.join(', ')}); run node tools/stamp-sw.mjs` : `stamp ok (${have})`);
  process.exit(stale.length ? 1 : 0);
}
fs.writeFileSync(path.join(app, 'index.html'), html); fs.writeFileSync(path.join(app, 'sw.js'), sw);
console.log(stale.length ? `stamped: ${stale.join(', ')} -> ${want}` : `already current (${have})`);
