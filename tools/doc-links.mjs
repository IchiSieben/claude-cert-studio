// Official-doc links for the bank's explanations, verified at run time, never from memory.
//   node tools/doc-links.mjs --check              every `ref` in the bank: HTTP 200 and the #anchor exists
//   node tools/doc-links.mjs --fill <findings-dir> give `ref` to questions without one: for each source URL
//        the reviewer recorded, find the section (heading id) whose text contains a passage the reviewer
//        quoted verbatim; no verified section -> no link, listed in docs/LINKS-PENDING.md
// Pages are cached for the run in $DOC_CACHE (default: OS temp dir). Exit 1 on any failed check.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const DATA = path.join(root, 'app/data');
const FILES = { 'CCAR-F': 'questions-ccar-f.js', 'CCDV-F': 'questions-ccdv-f.js' };
const CACHE = process.env.DOC_CACHE || path.join(os.tmpdir(), 'ccs-doc-cache');
fs.mkdirSync(CACHE, { recursive: true });

function loadBank(cert) {
  const f = path.join(DATA, FILES[cert]); const src = fs.readFileSync(f, 'utf8');
  const tag = `window.QUESTIONS["${cert}"] = `; const i = src.indexOf(tag) + tag.length;
  const body = src.slice(i); const j = body.lastIndexOf(']') + 1;
  return { f, head: src.slice(0, i), tail: body.slice(j), qs: JSON.parse(body.slice(0, j)) };
}
const saveBank = b => fs.writeFileSync(b.f, b.head + JSON.stringify(b.qs, null, 1) + b.tail);

const pages = new Map();
async function page(url) {
  if (pages.has(url)) return pages.get(url);
  const key = path.join(CACHE, crypto.createHash('sha1').update(url).digest('hex') + '.json');
  let res;
  if (fs.existsSync(key)) res = JSON.parse(fs.readFileSync(key, 'utf8'));
  else {
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'cert-studio-doc-links' } });
      res = { status: r.status, final: r.url, html: r.ok ? await r.text() : '' };
    } catch (e) { res = { status: 'ERR ' + e.message, final: url, html: '' }; }
    if (res.status === 200) fs.writeFileSync(key, JSON.stringify(res));
  }
  res.sections = res.html ? sections(res.html) : [];
  res.ids = new Set(res.sections.map(s => s.id).concat([...res.html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
  pages.set(url, res); return res;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', mdash: '—', ndash: '–', hellip: '…' };
const norm = t => t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? m))
  .replace(/[‘’`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();
function sections(html) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const hs = [...html.matchAll(/<h([1-4])\b[^>]*\sid="([^"]+)"[^>]*>/gi)].filter(m => !m[2].startsWith('_R_'));
  return hs.map((m, k) => {
    const end = k + 1 < hs.length ? hs[k + 1].index : html.length;
    return { id: m[2], text: norm(html.slice(m.index, end).replace(/<[^>]+>/g, ' ')) };
  });
}
// passages the reviewer quoted verbatim in notes/issues; long ones split at ellipses
function quotes(f) {
  const txt = [f.notes || '', ...(f.issues || [])].join(' \n ');
  const out = [];
  for (const re of [/"([^"]{20,})"/g, /“([^”]{20,})”/g, /(?:^|[\s(:=,])'(.{20,}?)'(?=[\s).,;:]|$)/gm]) for (const m of txt.matchAll(re)) out.push(m[1]);
  return [...new Set(out.flatMap(q => q.split(/\.\.\.|…/)).map(norm).filter(q => q.length >= 20))].sort((a, b) => b.length - a.length);
}

const mode = process.argv[2];
if (mode === '--check') {
  let bad = 0, n = 0;
  for (const cert of Object.keys(FILES)) for (const q of loadBank(cert).qs) {
    if (!q.ref) continue; n++;
    const [u, a] = q.ref.split('#'); const p = await page(u);
    const ok = p.status === 200 && (!a || p.ids.has(a));
    if (!ok) { bad++; console.log(`FAIL ${q.id} ${p.status} ${a && !p.ids.has(a) ? 'missing #' + a : ''} ${q.ref}`); }
  }
  console.log(`doc-links: ${n} refs checked, ${bad} failing`); process.exit(bad ? 1 : 0);
} else if (mode === '--fill') {
  const dir = process.argv[3]; const F = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) for (const x of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) F[x.id] = x;
  const pending = []; let added = 0, kept = 0;
  for (const cert of Object.keys(FILES)) {
    const bank = loadBank(cert);
    for (const q of bank.qs) {
      if (q.ref) { kept++; continue; }
      const f = F[q.id];
      if (!f || !(f.sources || []).length) { pending.push([q.id, 'no source recorded by the review', '']); continue; }
      const qs = quotes(f);
      if (!qs.length) { pending.push([q.id, 'the review quoted no passage to locate', f.sources.join(' ')]); continue; }
      let best = null;
      for (const src of f.sources) {
        const p = await page(src); if (p.status !== 200) continue;
        for (const s of p.sections) { const hit = qs.find(t => s.text.includes(t)); if (hit && (!best || hit.length > best.len)) best = { url: p.final.split('#')[0], id: s.id, len: hit.length }; }
      }
      if (best) { q.ref = `${best.url}#${best.id}`; added++; }
      else pending.push([q.id, 'quoted passage not found in any section of the sources (page changed or quote paraphrased)', f.sources.join(' ')]);
    }
    saveBank(bank);
  }
  const md = ['# Enlaces a la documentación pendientes', '',
    `Generado por \`node tools/doc-links.mjs --fill\` el ${new Date().toISOString().slice(0, 10)}. Estas preguntas no muestran enlace a la doc porque no se pudo verificar en ese momento qué sección respalda la respuesta (una página que responde 200 no basta: tiene que existir el ancla y contener el pasaje citado por la revisión).`, '',
    `Con enlace verificado: ${added + kept}. Pendientes: ${pending.length}.`, '',
    '| id | Motivo | Fuentes candidatas |', '|---|---|---|', ...pending.map(([id, why, src]) => `| ${id} | ${why} | ${src.split(' ').filter(Boolean).map(u => `<${u}>`).join(' ')} |`), ''];
  fs.writeFileSync(path.join(root, 'docs/LINKS-PENDING.md'), md.join('\n'));
  console.log(`doc-links: ${added} added, ${kept} already had one, ${pending.length} pending -> docs/LINKS-PENDING.md`);
} else { console.log('usage: node tools/doc-links.mjs --check | --fill <findings-dir>'); process.exit(2); }
