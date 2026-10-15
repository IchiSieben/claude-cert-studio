// Validate both question banks against the blueprints: schema, answer count = select, every wrong
// option tagged with a known trap, unique ids, task ids that exist. Prints counts; exit 1 on any error.
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
globalThis.window = {};
const data = path.resolve(import.meta.dirname, '../app/data');
for (const f of ['blueprints.js', 'questions-ccar-f.js', 'questions-ccdv-f.js']) require(path.join(data, f));
const { BLUEPRINTS, QUESTIONS, TRAPS } = window;
let bad = 0;
for (const [cert, qs] of Object.entries(QUESTIONS)) {
  const tasks = new Set(BLUEPRINTS[cert].domains.flatMap(d => d.tasks.map(t => t.id)));
  const ids = new Set(); const e = [];
  for (const q of qs) {
    if (ids.has(q.id)) e.push(q.id + ': duplicate id'); ids.add(q.id);
    if (!tasks.has(q.task)) e.push(q.id + ': unknown task ' + q.task);
    if (q.answer.length !== q.select) e.push(q.id + ': answer count != select');
    for (const k of Object.keys(q.options)) if (!q.answer.includes(k) && !TRAPS[q.distractors[k]]) e.push(q.id + ':' + k + ' untagged');
  }
  console.log(`${cert}: ${qs.length} questions, ${qs.filter(q => q.select === 2).length} select-two, ${e.length ? e.length + ' errors' : 'OK'}`);
  e.slice(0, 20).forEach(x => console.log('  ' + x)); bad += e.length;
}
process.exit(bad ? 1 : 0);
