const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const EPUB = process.env.EPUB;
if (!EPUB) { console.error('Set EPUB=/path/to/your/book.epub'); process.exit(2); }
const BASE = process.env.BASE || 'http://localhost:8765/index.html';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  const check = (cond, msg) => { if (!cond) { errors.push('FAIL ' + msg); console.log('FAIL', msg); } };
  await page.goto(BASE);
  await page.waitForSelector('main h1');
  check((await page.textContent('main h1')).includes('Cien años'), 'home h1');
  const routes = ['#/chapters','#/structure','#/guide','#/characters','#/characters?g=4','#/tree','#/tree?id=ursula','#/themes','#/themes?m=hielo','#/philosophy','#/glossary','#/context','#/about','#/library','#/notebook','#/search?q=hielo','#/nope'];
  for (const r of routes) { await page.goto(BASE + r); await page.waitForTimeout(80); const h = await page.$('main h1'); check(h, 'h1 on ' + r); }
  const chars = await page.evaluate(() => window.CIEN.characters.map(c => c.id));
  for (const id of chars) { await page.goto(BASE + '#/character/' + id); await page.waitForTimeout(30); check(await page.$('main h1'), 'char ' + id); }
  const subs = await page.evaluate(() => window.CIEN.chapters.map(c => c.subs.length));
  for (let n = 1; n <= 20; n++) {
    await page.goto(BASE + '#/ch/' + n); await page.waitForTimeout(30); check(await page.$('main h1'), 'chapter ' + n);
    for (let s = 1; s <= subs[n - 1]; s++) { await page.goto(BASE + `#/ch/${n}/${s}`); await page.waitForTimeout(15); check(await page.$('article.sub h1'), `sub ${n}.${s}`); }
  }
  // Load EPUB
  await page.goto(BASE + '#/library');
  await page.setInputFiles('#epub-input', EPUB);
  await page.waitForFunction(() => window.__cien.book, null, { timeout: 60000 });
  const counts = await page.evaluate(() => window.__cien.book.chapters.map(c => c.length));
  console.log('counts', counts.join(','));
  const exp = await page.evaluate(() => window.CIEN.book.expectedParas);
  check(JSON.stringify(counts) === JSON.stringify(exp), 'paragraph counts match');
  const ranges = await page.evaluate(() => window.__cien.book.ranges.map((r, i) => r.map((x, j) => (x[0] + 1 === window.CIEN.chapters[i].subs[j].start && x[1] + 1 === window.CIEN.chapters[i].subs[j].end) ? 1 : 0)));
  check(ranges.flat().every(Boolean), 'ranges resolved equal data');
  const imgs = await page.evaluate(() => Object.keys(window.__cien.book.images || {}));
  console.log('images for chapters', imgs.join(','));
  await page.waitForTimeout(300);
  check((await page.textContent('#book-status')).includes('loaded'), 'book badge');
  // Sub page with text
  await page.goto(BASE + '#/ch/1/1');
  await page.waitForSelector('.reader .ptext');
  check((await page.$$('.reader .ptext')).length === 4, '1.1 has 4 paras');
  // Highlight via selection
  await page.evaluate(() => { const el = document.querySelector('.ptext[data-p="1"]'); const r = document.createRange(); const t = el.firstChild; r.setStart(t, 0); r.setEnd(t, 40); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForSelector('#sel-toolbar:not([hidden])', { timeout: 3000 });
  await page.click('#sel-toolbar .sw-yellow');
  await page.waitForSelector('.reader mark.hl-yellow');
  check((await page.textContent('.reader mark.hl-yellow')).startsWith('Muchos años después'), 'highlight text');
  await page.reload(); await page.waitForSelector('.reader mark.hl-yellow');
  // click mark -> change colour
  await page.click('.reader mark.hl-yellow');
  await page.waitForSelector('#sel-toolbar:not([hidden])');
  await page.click('#sel-toolbar .sw-blue');
  await page.waitForSelector('.reader mark.hl-blue');
  // cross-paragraph selection
  await page.evaluate(() => { const a = document.querySelector('.ptext[data-p="2"]'), b = document.querySelector('.ptext[data-p="3"]'); const r = document.createRange(); r.setStart(a.firstChild, 10); r.setEnd(b.firstChild, 5); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForSelector('#sel-toolbar:not([hidden])'); await page.click('#sel-toolbar .sw-green');
  await page.waitForTimeout(200);
  check((await page.$$('.reader mark.hl-green')).length === 2, 'cross para highlight 2 marks');
  // Note with auto quote
  await page.click('button[data-action="note-new"]');
  await page.fill('#note-body', 'The ice feels like it is boiling to the child; the father swears on it like a sacred text.');
  await page.waitForTimeout(500);
  const sugg = await page.textContent('#quote-suggest');
  console.log('suggestion:', sugg.replace(/\s+/g, ' ').slice(0, 220));
  check(/hielo|hirviendo|invento/i.test(sugg), 'auto quote relevant');
  await page.click('button[data-action="quote-next"]').catch(() => {});
  await page.click('#note-form button[type=submit]');
  await page.waitForSelector('.note-card');
  check((await page.$$('.note-card .note-quote')).length >= 1, 'note has quote');
  // selection -> note
  await page.goto(BASE + '#/ch/1/6');
  await page.waitForSelector('.reader .ptext');
  await page.evaluate(() => { const el = document.querySelector('.ptext[data-p="36"]'); const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForSelector('#sel-toolbar:not([hidden])'); await page.click('#sel-toolbar [data-action="hl-note"]');
  await page.waitForSelector('#note-body');
  await page.fill('#note-body', 'Epiphany.');
  await page.click('#note-form button[type=submit]');
  await page.waitForSelector('.note-card');
  check((await page.textContent('.note-card')).includes('gran invento'), 'selection note quote');
  // para note
  await page.click('.pnum[data-p="35"]'); await page.waitForSelector('#note-body'); await page.fill('#note-body', 'Aureliano says hirviendo'); await page.click('#note-form button[type=submit]'); await page.waitForTimeout(200);
  // answer question
  await page.click('#reflect button[data-action="answer-q"]'); await page.waitForSelector('#note-body'); await page.fill('#note-body', 'An answer about ice and time.'); await page.click('#note-form button[type=submit]'); await page.waitForTimeout(200);
  check((await page.$$('.note-card')).length >= 3, 'multiple notes on 1.6');
  // edit & delete
  page.on('dialog', d => d.accept());
  await page.click('.note-card button[data-action="note-edit"]'); await page.waitForSelector('#note-body'); await page.fill('#note-body', 'Edited note body'); await page.click('#note-form button[type=submit]'); await page.waitForTimeout(200);
  check((await page.textContent('#notes')).includes('Edited note body'), 'edit note');
  const before = (await page.$$('.note-card')).length;
  await page.click('.note-card button[data-action="note-delete"]'); await page.waitForTimeout(200);
  check((await page.$$('.note-card')).length === before - 1, 'delete note');
  // mark read
  await page.click('button[data-action="mark-read"]'); check((await page.getAttribute('button[data-action="mark-read"]', 'aria-pressed')) === 'true', 'mark read');
  // keyboard nav
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); check(page.url().includes('#/ch/2/1'), 'arrow next: ' + page.url());
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150); check(page.url().includes('#/ch/1/6'), 'arrow prev');
  // cite link with ?p=
  await page.goto(BASE + '#/ch/15/5?p=25'); await page.waitForTimeout(300); check(await page.$('#p25'), 'p25 present');
  // chapter page note + end question
  await page.goto(BASE + '#/ch/3'); await page.click('#q-end button[data-action="answer-q"]'); await page.fill('#note-body', 'The plague of forgetting and memory labels'); await page.waitForTimeout(400);
  check(/olvid|memori|letrero|vaca|Dios/i.test(await page.textContent('#quote-suggest')), 'chapter-level suggestion');
  await page.click('#note-form button[type=submit]'); await page.waitForTimeout(200);
  // notebook
  await page.goto(BASE + '#/notebook'); await page.waitForSelector('.note-card');
  const [dl1] = await Promise.all([page.waitForEvent('download'), page.click('button[data-action="export-md"]')]);
  const md = await (await dl1.createReadStream()).toArray(); const mdText = Buffer.concat(md).toString(); check(mdText.includes('García Márquez, 2017, ch.'), 'md export content');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('button[data-action="export-json"]')]);
  const jsonPath = require('os').tmpdir() + '/cien-export.json'; await dl2.saveAs(jsonPath);
  await page.selectOption('#nb-ch', '1'); await page.waitForTimeout(300); check(page.url().includes('ch=1'), 'notebook filter');
  // clear and import
  await page.click('button[data-action="clear-notes"]'); await page.waitForTimeout(200);
  check((await page.$$('.note-card')).length === 0, 'cleared');
  await page.setInputFiles('#import-input', jsonPath); await page.waitForTimeout(400);
  check((await page.$$('.note-card')).length > 0, 'imported');
  // tree interactions
  await page.goto(BASE + '#/tree'); await page.waitForSelector('#tree-svg');
  await page.click('#tree-svg g[data-id="aureliano-segundo"]'); await page.waitForTimeout(150);
  check((await page.textContent('#tree-panel')).includes('Aureliano Segundo'), 'tree panel');
  check((await page.$$('#tree-svg .node.dim')).length > 5, 'tree dims');
  for (const z of ['in', 'in', 'out', 'fit']) await page.click(`button[data-z="${z}"]`);
  await page.focus('#tree-svg g[data-id="ursula"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  check((await page.textContent('#tree-panel')).includes('Úrsula'), 'tree keyboard');
  await page.click('#tree-panel button[data-action="tree-select"]'); await page.waitForTimeout(100);
  check((await page.$$('#tree-svg .node.dim')).length === 0, 'tree clear');
  // settings
  await page.click('button[data-action="toggle-settings"]'); await page.click('button[data-action="theme"][data-value="dark"]');
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'dark theme');
  await page.click('button[data-action="size"][data-value="xl"]'); check((await page.getAttribute('html', 'data-size')) === 'xl', 'size');
  await page.click('button[data-action="theme"][data-value="auto"]'); await page.click('button[data-action="size"][data-value="m"]');
  // search with book
  await page.goto(BASE + '#/search?q=mariposas amarillas'); await page.waitForTimeout(400);
  check((await page.$$('.search-results li')).length > 3, 'search results');
  await page.fill('#search-q', 'hielo'); await page.click('#search-form button'); await page.waitForTimeout(300); check(page.url().includes('q=hielo'), 'search submit');
  // glossary filter & characters filter
  await page.goto(BASE + '#/glossary'); await page.fill('#gloss-search', 'soledad'); await page.waitForTimeout(100);
  check((await page.$$('#gloss-table tbody tr:not([hidden])')).length >= 1, 'gloss filter');
  await page.goto(BASE + '#/characters'); await page.fill('#char-search', 'fernanda'); await page.waitForTimeout(100);
  check((await page.$$('#char-grid li:not([hidden])')).length >= 1, 'char filter');
  // philosophy answer
  await page.goto(BASE + '#/philosophy'); await page.click('button[data-action="answer-q"]'); await page.waitForSelector('#note-body'); await page.click('button[data-action="note-cancel"]');
  // toc scroll links
  await page.goto(BASE + '#/ch/5'); await page.click('.toc a[href="#terms"]'); await page.waitForTimeout(200); check(page.url().endsWith('#/ch/5'), 'toc keeps route');
  // chapter illustration
  await page.goto(BASE + '#/ch/3'); await page.waitForTimeout(200); console.log('illus ch3', !!(await page.$('.illus img')));
  // mobile layout & overflow
  const m = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage(); mp.on('pageerror', e => errors.push('M PAGEERROR ' + e.message));
  for (const r of ['', '#/chapters', '#/ch/1', '#/ch/1/1', '#/tree', '#/characters', '#/themes', '#/philosophy', '#/glossary', '#/notebook', '#/library', '#/structure', '#/about']) {
    await mp.goto(BASE + r); await mp.waitForTimeout(150);
    const ov = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(ov <= 1, 'mobile overflow ' + r + ' ' + ov);
  }
  await mp.click('#menu-btn'); check(await mp.isVisible('#site-nav a[data-nav="tree"]'), 'mobile menu opens');
  await mp.click('#site-nav a[data-nav="tree"]'); await mp.waitForTimeout(200); check(!(await mp.isVisible('#site-nav a[data-nav="themes"]')), 'menu closes after nav');
  // remove book
  await page.goto(BASE + '#/library'); await page.click('button[data-action="book-remove"]'); await page.waitForTimeout(300);
  check(!(await page.evaluate(() => window.__cien.book)), 'book removed');
  await page.goto(BASE + '#/ch/1/1'); check(await page.$('.empty-reader'), 'empty reader after removal');
  console.log(errors.length ? errors.join('\n') : 'ALL OK');
  await browser.close();
})().catch(e => { console.error('CRASH', e); process.exit(1); });
