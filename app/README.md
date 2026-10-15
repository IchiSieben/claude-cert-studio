# Claude Cert Studio — study app

Static, single-page, zero-build study environment for the Claude Certified **Architect – Foundations (CCAR-F)** and **Developer – Foundations (CCDV-F)** exams. English UI, because the exam is in English.

- `index.html` — the app (no framework, no build, no network calls).
- `data/blueprints.js` — official domains, weights and task statements for both exams, plus the ten-type distractor taxonomy. **Single source of truth**; the `/cert` skill in the orquestador reads it too.
- `data/questions-ccar-f.js` — 106 original questions (16 select-two), as of 2026-10-15.
- `data/questions-ccdv-f.js` — 112 original questions (14 select-two), as of 2026-10-15. Both banks were reviewed against Anthropic's docs by a model, not yet by a human.

Open `index.html` directly from disk (`file://` works: data ships as `.js`, not `.json`, on purpose) or serve the folder.

## What it does

Start page (both certifications, weights, what the app does) · Overview (weights, KPIs) · Blueprint with per-task mastery · Drill by domain or task statement, unseen-first, retry-misses · Quick diagnostic (half length) and full timed mock drawn by official weight, scored 100–1000 with pass at 720 · Result page: per-domain %, weakest domain, which trap types caught you, review of misses · Concepts tab (one card per concept, searchable, with task drill links) · "Due today" spaced practice (misses and questions not seen for 3+ days) · Mocks draw never-used questions first · Print cheat sheet from the Blueprint tab (per-task mastery bars) · Traps tab (taxonomy + elimination order) · Progress with mock history and JSON export. Keyboard: A–D / 1–4 select, Enter check/next. Theme follows the system, toggle in the header. Listed publicly at https://cert.ichisieben.dev/ since 2026-10-15.

URL switches: `?sample=1` seeds deterministic demo progress in memory and never touches localStorage (used for public captures); `?lang=es` translates the navigation and the start page (questions stay in English, like the exam); `?cert=CCDV-F` and `?view=blueprint` open a given cert and tab.

Scoring note: the real exam uses an unpublished scaling; the app uses `100 + 900 × weighted_pct` where each domain's percent-correct is weighted by its official weight. Treat 720 here as "≈ 69 % weighted", a floor, not a promise.

## Deploy (Hostinger, static)

Any static host works: upload this folder keeping `data/`. The live copy is the Hostinger subdomain `cert.ichisieben.dev` (document root `public_html/cert-app`), uploaded with `tools/deploy-cert.sh` (TUS, overwrite-only, never deletes). `.htaccess` returns 404 unless the request comes through that subdomain. Progress lives in each browser's localStorage; nothing is sent anywhere.

**Unofficial study aid. Not affiliated with or endorsed by Anthropic. All questions are original; none reproduces a real exam item (the real items are confidential).**

## Extending the bank

Add objects to the arrays in `data/questions-*.js` following the schema at the top of each file; keep `id` = `CERT-task-seq`, tag every wrong option with a `TRAPS` key, and run the validator:

```bash
node -e "global.window={};require('./data/blueprints.js');require('./data/questions-ccar-f.js');require('./data/questions-ccdv-f.js');for(const c of Object.keys(window.QUESTIONS)){const q=window.QUESTIONS[c];const T=Object.keys(window.TRAPS);let e=[];q.forEach(x=>{if(x.answer.length!==x.select)e.push(x.id);Object.keys(x.options).filter(k=>!x.answer.includes(k)).forEach(k=>{if(!T.includes(x.distractors[k]))e.push(x.id+':'+k)})});console.log(c,q.length,e.length?e:'OK')}"
```

Questions are original, written from the official task statements. They are not, and must never try to be, real exam items (those are confidential).

## End-to-end test

```bash
npm install && npx playwright install chromium   # once
npm test                                         # tests/app.test.mjs, drives app/index.html over file://
```
Covers the start page, sample mode (deterministic, no localStorage writes), `?lang=es`, print-to-PDF of the cheat sheet, overview, drill, due-today drill, quick/full mock (no repeats inside a mock, fresh-first across mocks), progress, concepts, print view, cert switch, 390 px layout and zero console errors. Set `CHROME_PATH` to use a system Chromium/Edge if the browser download is blocked.
