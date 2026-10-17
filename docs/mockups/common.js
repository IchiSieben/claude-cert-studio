// Shared by the three identity mockups (docs/DIRECCIONES.md). Real blueprint data comes from
// ../../app/data/blueprints.js; the user's "ink" here is SYNTHETIC demo progress, labelled as such on screen.
// URL: ?cert=CCDV-F|CCAR-F  ?theme=light|dark  ?open=<domain id>  (open defaults to the heaviest domain)
//      ?ink=0  all progress at zero (the empty state; added with the fidelity gate, tests/fidelity.test.mjs)
(function () {
  const q = new URLSearchParams(location.search);
  const theme = q.get("theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;

  // demo progress: share of each domain answered right (0..1). Not a user's data.
  const DEMO = {
    "CCDV-F": { 1: 0.62, 2: 0.41, 3: 0.8, 4: 0, 5: 0.55, 6: 0.7, 7: 0.3, 8: 0.48 },
    "CCAR-F": { 1: 0.5, 2: 0.35, 3: 0.66, 4: 0.44, 5: 0.2 }
  };

  // expected items per domain: largest-remainder split of the exam's item count by official weight
  function alloc(b) {
    const raw = b.domains.map(d => (b.items * d.weight) / 100);
    const n = raw.map(Math.floor);
    let left = b.items - n.reduce((a, x) => a + x, 0);
    raw.map((r, i) => [r - Math.floor(r), i]).sort((a, c) => c[0] - a[0]).slice(0, left).forEach(([, i]) => n[i]++);
    return n;
  }

  // task weight in % of the exam: CCDV-F states it in the text "(6.8%)"; CCAR-F has no per-task weight,
  // so the domain weight is split evenly and the UI says so.
  function taskWeight(d, t) {
    const m = /\((\d+(?:\.\d+)?)%\)\s*$/.exec(t.text);
    return m ? { w: +m[1], official: true } : { w: d.weight / d.tasks.length, official: false };
  }
  // demo per-task ink: deterministic wobble around the domain value
  function taskInk(cert, d, i) {
    if (q.get("ink") === "0") return 0;
    const base = DEMO[cert][d.id];
    const v = base + (((d.id * 7 + i * 13) % 9) - 4) * 0.06;
    return Math.max(0, Math.min(1, base === 0 ? 0 : v));
  }

  const fmt = (x, digits = 1) => x.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: digits });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function state() {
    const cert = q.get("cert") === "CCAR-F" ? "CCAR-F" : "CCDV-F";
    const b = window.BLUEPRINTS[cert];
    const heaviest = b.domains.reduce((a, d) => (d.weight > a.weight ? d : a));
    const open = b.domains.find(d => String(d.id) === q.get("open")) || heaviest;
    return { cert, b, open, ink: q.get("ink") === "0" ? Object.fromEntries(Object.keys(DEMO[cert]).map(k => [k, 0])) : DEMO[cert], cells: alloc(b) };
  }
  function nav(patch) {
    const u = new URL(location.href);
    Object.entries(patch).forEach(([k, v]) => u.searchParams.set(k, v));
    if (patch.cert) u.searchParams.delete("open");
    history.replaceState(null, "", u);
    q.delete("open"); new URLSearchParams(u.search).forEach((v, k) => q.set(k, v));
    window.MOCK.render();
  }
  window.MOCK = { alloc, taskWeight, taskInk, fmt, esc, state, nav, render: () => {} };
})();
