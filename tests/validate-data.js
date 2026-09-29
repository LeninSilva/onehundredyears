// Validates the commentary data without needing the novel's text:
// citation targets, subsection ranges, character/motif references and tree links.
// Usage: node tests/validate-data.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'assets', 'js', 'data');
const ctx = { window: {} }; vm.createContext(ctx);
['book.js', 'characters.js', ...Array.from({ length: 20 }, (_, i) => `ch${String(i + 1).padStart(2, '0')}.js`)]
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const C = ctx.window.CIEN; let errors = 0;
const fail = m => { console.log('FAIL', m); errors++; };
C.chapters.sort((a, b) => a.n - b.n);
if (C.chapters.length !== 20) fail('expected 20 chapters');
C.chapters.forEach(c => {
  let prev = 0;
  c.subs.forEach(s => { if (s.start !== prev + 1) fail(`range gap ${c.n}.${s.n}`); if (s.end < s.start) fail(`range ${c.n}.${s.n}`); prev = s.end; if (!s.anchor) fail(`anchor ${c.n}.${s.n}`); });
  if (prev !== C.book.expectedParas[c.n - 1]) fail(`chapter ${c.n} ends at ${prev}`);
});
const all = fs.readdirSync(root).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const re = /\[@(\d+):(\d+)(?:-(\d+))?\]/g; let m, n = 0;
while ((m = re.exec(all))) { n++; const ch = +m[1], p = +m[2]; if (ch < 1 || ch > 20 || p < 1 || p > C.book.expectedParas[ch - 1]) fail('bad citation ' + m[0]); }
const ids = new Set(C.characters.map(c => c.id));
const motif = id => C.book.motifs.some(x => x.id === id) || C.book.themes.some(x => x.id === id);
C.chapters.forEach(c => {
  c.characters.forEach(id => ids.has(id) || fail(`char ${id} in ch ${c.n}`));
  c.motifs.forEach(id => motif(id) || fail(`motif ${id} in ch ${c.n}`));
  c.subs.forEach(s => { (s.chars || []).forEach(id => ids.has(id) || fail(`char ${id} in ${c.n}.${s.n}`)); (s.quotes || []).forEach(q => /^\d+:\d+$/.test(q.p) || fail(`quote locator ${c.n}.${s.n}`)); });
});
C.characters.forEach(c => (c.relations || []).forEach(([id]) => ids.has(id) || fail(`relation ${c.id} -> ${id}`)));
C.treeEdges.forEach(([a, b, k]) => [a, b, k].forEach(x => x && !ids.has(x) && fail('tree edge ' + x)));
C.treeUnions.forEach(([a, b]) => [a, b].forEach(x => ids.has(x) || fail('tree union ' + x)));
console.log(`${n} citations, ${C.chapters.reduce((a, c) => a + c.subs.length, 0)} stops, ${C.characters.length} characters: ${errors ? errors + ' errors' : 'OK'}`);
process.exit(errors ? 1 : 0);
