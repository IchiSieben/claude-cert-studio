# Claude Cert Studio — study app

Static, single-page, zero-build study environment for the Claude Certified **Architect – Foundations (CCAR-F)** and **Developer – Foundations (CCDV-F)** exams. UI in English and Spanish (`?lang=es` or the ES button); questions stay in English because the exam is.

- `index.html` — the app (no framework, no build, no network calls).
- `data/i18n.js` — every UI string in EN and ES; a test fails if a key exists in one language only.
- `fonts/` — Inter and Geist Mono (OFL), self-hosted; metric-matched fallbacks measured by `tools/measure-fonts.mjs`.
- `data/blueprints.js` — official domains, weights and task statements for both exams, plus the ten-type distractor taxonomy. **Single source of truth**; the `/cert` skill in the orquestador reads it too.
- `data/questions-ccar-f.js` — 120 original questions (18 select-two), as of 2026-10-15.
- `data/questions-ccdv-f.js` — 120 original questions (15 select-two), as of 2026-10-15. Both banks are model-reviewed against Anthropic's docs; human sample pending (`data/REVIEW-SAMPLE.md`). Domain counts follow the official weights.

- `sw.js` + `manifest.webmanifest` + `icon*.{svg,png}` — installable, works offline: cache-first for the page and `data/*.js`, cache name = hash of those files (`node tools/stamp-sw.mjs` after any change; the e2e suite and `tools/deploy-cert.sh` refuse a stale stamp). Registered only over https or localhost, never in `?sample=1`.
- `robots.txt`, `sitemap.xml`, `og.png` (1200×630, `node tools/og-image.mjs` re-renders it from the start page). `<title>` and the description follow the certification and the view.

Open `index.html` directly from disk (`file://` works: data ships as `.js`, not `.json`, on purpose) or serve the folder.

## What it does

Instrument as the home view (`/`: weights, domain keys, KPIs, every task statement with its mastery, "Expand all task statements" = the old Blueprint; `?view=start` and `?view=blueprint` are aliases; the cert switch is in the header) · Drill by domain or task statement, unseen-first, retry-misses · Quick diagnostic (half length) and full timed mock drawn by official weight, scored 100–1000 with pass at 720 · Result page: per-domain %, weakest domain, which trap types caught you, review of misses · Concepts tab (one card per concept, searchable, with task drill links) · "Due today" spaced practice (misses and questions not seen for 3+ days) · Mocks draw never-used questions first · Print cheat sheet from the instrument (per-task mastery bars) · Traps tab (taxonomy + elimination order) · Progress with mock history and JSON export and import (import merges; the newer answer wins). The instrument (weight bar plus domain keys) is the navigation (the tabs are only Drill, Mock exam, Traps and Progress); the mock runs as a full-screen cockpit and ends with the instrument filled with your result, a ten-trap radar and a "study this first" ranking (weight x error rate). After `navHtml()` changes run `node tools/gen-header.mjs --write` (the pre-rendered header must match). Keyboard: A–D / 1–4 select, Enter check/next. Theme follows the system, toggle in the header. Listed publicly at https://cert.ichisieben.dev/ since 2026-10-15.

URL switches: `?sample=1` seeds deterministic demo progress in memory and never touches localStorage (used for public captures); `?lang=es|en` sets the interface language (questions stay in English, like the exam); `?cert=CCDV-F&view=home&domain=5&task=5.2` opens a cert, view, domain and task statement (the instrument writes these as you click).

Spaced practice is a simplified SM-2 per question (`ef`, `iv`, `reps` next to each answer): right answers come back after 1, 3, then `round(iv × ef)` days; a miss is due at once and lowers `ef`. Progress saved before SM-2 is read as-is (lazy migration, nothing rewritten).

Doc links: a question's `ref` points at the official doc section that backs its key. `node tools/doc-links.mjs --check` re-verifies every one (HTTP 200 and the anchor present); `--fill <findings-dir>` only adds a link when the section contains a passage the review quoted verbatim. Questions it could not verify show no link and are listed in `docs/LINKS-PENDING.md`.

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
Covers the instrument on first visit (every band already in its domain colour), sample mode (deterministic, no localStorage writes), `?lang=es`, print-to-PDF of the cheat sheet, overview, drill, due-today drill, quick/full mock (no repeats inside a mock, fresh-first across mocks), progress, concepts, print view, cert switch, 390 px layout and zero console errors. Set `CHROME_PATH` to use a system Chromium/Edge if the browser download is blocked.
