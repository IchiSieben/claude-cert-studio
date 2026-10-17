# SPEC — V3c F4.2 personalisation (2026-10-16)

Source: `../docs/PROMPT-ecosistema-claude-code.md` §15 "Mockup Raycast APROBADO + FASE 4", F4.2, plus the
top-10 of `docs/INVESTIGACION-UX.md`. App: `app/index.html` + `app/data/i18n.js`, vanilla JS, no build.

## Inputs
- Progress in `localStorage` (shape normalised by `normalizeProgress`; export/import must round-trip any new field).
- Banks `app/data/questions-*.js`: every item has `apply` (string).

## Features (each one: ES + EN strings, e2e test, AA, works offline and on file://)
1. **Exam date (optional, per cert).** Set/clear in Progress (`<input type=date>`). With a date:
   a day-by-day plan (items/day = remaining unseen + due, divided by days left, capped at 10/day for
   reviews-first ordering) and the instrument shows one line "at your pace: N days of work left / N days
   to the exam". Without a date nothing changes.
2. **Final-week mode.** Automatic when the date is ≤ 7 days away; can be switched off. SM-2 intervals are
   capped so no review lands after the exam date; the daily deck prefers the weakest domains by points at
   stake (weight × (1 − ink)). The UI says which mode is on and why.
3. **Streak + session summary.** Streak = consecutive days with ≥ 1 answer (local date). Session summary
   when leaving a drill or after the due deck is empty: answered, right, minutes, traps hit. No confetti.
4. **Light adaptive difficulty, explained.** In drill: after 2 misses in a domain within a session, the next
   items of that domain come from tasks with the lowest ink; after 2 correct in a row, prefer unseen
   items. One visible sentence states the rule that picked the item ("Te muestro otra de D3 porque
   fallaste 2 seguidas"). Deterministic given the state; testable.
5. **`apply` shown after answering** under the heading "La pregunta real que te haría el arquitecto" /
   "The real question an architect would ask you". Collapsed by default inside the explanation, expandable.
6. **Share result as an image.** On the mock result: a canvas-rendered PNG (score, pass line, per-domain
   bars in the domain colours, no personal data), `navigator.share` with a file when available, otherwise a
   download link. No external libraries.
7. From the research top-10, if not already present: daily cap ~10 with reviews first; option shuffle and
   prefer-unseen in the mock; the notice "the mock score does not predict the real score"; a "report an
   error" link to the public repo issues (`https://github.com/IchiSieben/claude-cert-studio/issues/new`)
   with the question id prefilled; flag-for-review and a pace indicator in the mock cockpit.

## Invariants
- Design rules of `docs/DISENO.md` (Raycast base): achromatic except domain colours and right/wrong;
  one filled button per view (an e2e test enforces it); no spaced uppercase labels; no `→` on buttons;
  no outer shadows; Smoke never carries text.
- ES/EN key parity test stays green; no apostrophes in strings interpolated into inline JS.
- axe 0 (8 views × 2 themes × 2 widths); zero console errors; CLS 0.
- `sw.js` FILES and `tools/deploy-cert.sh` FILES in sync; restamp with `node tools/stamp-sw.mjs`.
- Test count stated in READMEs/FICHA/arch doc matches the suite.

## Out of scope
- Accounts, servers, analytics, any network call except the share/issue links the user clicks.
- Anything that does not fit goes to `docs/BACKLOG.md` with the reason.
