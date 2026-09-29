/* Cien años de soledad — Lectura profunda
   Single-page app. No build step. All data lives in assets/js/data/*.js.
   The novel's text is never shipped with the site: readers load their own
   EPUB, which is parsed and stored only in their browser (IndexedDB). */
(function () {
  'use strict';

  const C = window.CIEN;
  C.chapters.sort((a, b) => a.n - b.n);
  const CH = C.chapters;
  const B = C.book;
  const CHARS = C.characters;
  const charById = Object.fromEntries(CHARS.map(c => [c.id, c]));
  const motifById = Object.fromEntries(B.motifs.map(m => [m.id, m]));
  const themeById = Object.fromEntries(B.themes.map(t => [t.id, t]));
  const TOTAL_SUBS = CH.reduce((n, c) => n + c.subs.length, 0);
  const STAGE_LABEL = Object.fromEntries(B.structure.map(s => [s.id, s.label]));
  const HL_COLORS = [
    { id: 'yellow', label: 'Butterfly yellow (amarillo mariposa)' },
    { id: 'blue', label: 'House blue (azul de la casa)' },
    { id: 'rose', label: 'Rose (rosa)' },
    { id: 'green', label: 'Almond green (verde almendro)' }
  ];

  // ------------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const anchorKey = s => norm(s).split(' ').slice(0, 5).join(' ');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const stripTags = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const chapter = n => CH[n - 1];
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  function citeText(ch, p, p2) {
    return `(${B.citeShort}, ch. ${ch}, para. ${p}${p2 && p2 !== p ? '–' + p2 : ''})`;
  }
  // Which subsection (by the site's own paragraph numbering) contains paragraph p.
  function subForPara(ch, p) {
    const c = chapter(ch); if (!c) return null;
    return c.subs.find(s => p >= s.start && p <= s.end) || c.subs[c.subs.length - 1];
  }
  function citeLink(ch, p, p2) {
    ch = +ch; p = +p;
    const c = chapter(ch);
    if (!c) return esc(`[${ch}:${p}]`);
    const s = subForPara(ch, p);
    return `<a class="cite" href="#/ch/${ch}/${s.n}?p=${p}" title="Go to chapter ${ch}, paragraph ${p}">${esc(citeText(ch, p, p2))}</a>`;
  }
  // Render [@ch:p] and [@ch:p-q] citation markers inside trusted data HTML.
  function rich(html) {
    return String(html || '').replace(/\[@(\d+):(\d+)(?:-(\d+))?\]/g, (m, ch, p, p2) => citeLink(ch, p, p2));
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard.'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); toast('Copied to clipboard.'); } catch (e2) { toast('Could not copy.'); }
      ta.remove();
    }
  }

  // ------------------------------------------------------------------
  // Persistent state
  // ------------------------------------------------------------------
  let NOTES = store.get('cien.notes', []);
  let HLS = store.get('cien.highlights', []);
  let READ = store.get('cien.read', {});
  let PREFS = Object.assign({ theme: 'auto', size: 'm' }, store.get('cien.prefs', {}));
  let LAST = store.get('cien.last', null);
  const saveNotes = () => { if (!store.set('cien.notes', NOTES)) toast('Could not save: browser storage is unavailable.'); };
  const saveHls = () => { if (!store.set('cien.highlights', HLS)) toast('Could not save: browser storage is unavailable.'); };
  const saveRead = () => store.set('cien.read', READ);
  const savePrefs = () => store.set('cien.prefs', PREFS);

  function applyPrefs() {
    const root = document.documentElement;
    if (PREFS.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', PREFS.theme);
    root.setAttribute('data-size', PREFS.size);
    $$('[data-action="theme"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === PREFS.theme)));
    $$('[data-action="size"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === PREFS.size)));
  }

  // ------------------------------------------------------------------
  // IndexedDB (the reader's own book, stored only on their device)
  // ------------------------------------------------------------------
  const idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        try {
          const r = indexedDB.open('cien-anos-lectura', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('kv');
          r.onsuccess = () => { this.db = r.result; res(this.db); };
          r.onerror = () => rej(r.error);
        } catch (e) { rej(e); }
      });
    },
    async get(k) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const r = db.transaction('kv').objectStore('kv').get(k);
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
    },
    async put(k, v) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k);
        tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
      });
    },
    async del(k) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k);
        tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
      });
    }
  };

  // BOOK = { meta, chapters: [[para,...] x20], ranges: [[[s,e],...] per chapter], images: {n: Blob} }
  let BOOK = null;
  const imageUrls = {};

  function resolveRanges(chs) {
    return CH.map((c, i) => {
      const paras = chs[i] || [];
      const keys = paras.map(p => norm(p));
      const starts = [];
      let from = 0;
      c.subs.forEach((s, k) => {
        const key = anchorKey(s.anchor);
        let idx = -1;
        for (let j = from; j < keys.length; j++) { if (keys[j].startsWith(key)) { idx = j; break; } }
        if (idx < 0) idx = Math.min(Math.max(s.start - 1, from), Math.max(paras.length - 1, 0));
        if (k === 0) idx = 0;
        starts.push(idx); from = idx + 1;
      });
      return starts.map((st, k) => [st, k < starts.length - 1 ? Math.max(st, starts[k + 1] - 1) : paras.length - 1]);
    });
  }

  function setBook(b) {
    BOOK = b;
    Object.keys(imageUrls).forEach(k => { URL.revokeObjectURL(imageUrls[k]); delete imageUrls[k]; });
    if (b && b.images) Object.keys(b.images).forEach(k => {
      try { imageUrls[k] = URL.createObjectURL(b.images[k]); } catch (e) { /* ignore */ }
    });
    if (b) b.ranges = resolveRanges(b.chapters);
    updateBookBadge();
  }
  function updateBookBadge() {
    const el = $('#book-status');
    if (!el) return;
    el.textContent = BOOK ? 'Book loaded' : 'Load your book';
    el.classList.toggle('loaded', !!BOOK);
  }

  // ---- EPUB parsing -------------------------------------------------
  // A minimal ZIP reader built on the browser's native DecompressionStream,
  // so no third-party library or network access is needed to open an EPUB.
  async function openZipNative(file) {
    if (typeof DecompressionStream === 'undefined') return null;
    const buf = new Uint8Array(await file.arrayBuffer());
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('This file is not a valid EPUB (ZIP) archive.');
    const count = dv.getUint16(eocd + 10, true);
    let off = dv.getUint32(eocd + 16, true);
    const dec = new TextDecoder('utf-8');
    const entries = {};
    for (let k = 0; k < count; k++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const csize = dv.getUint32(off + 20, true);
      const nlen = dv.getUint16(off + 28, true), xlen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
      const local = dv.getUint32(off + 42, true);
      const name = dec.decode(buf.subarray(off + 46, off + 46 + nlen));
      entries[name] = { method, csize, local };
      off += 46 + nlen + xlen + clen;
    }
    async function bytes(e) {
      const lnlen = dv.getUint16(e.local + 26, true), lxlen = dv.getUint16(e.local + 28, true);
      const start = e.local + 30 + lnlen + lxlen;
      const data = buf.subarray(start, start + e.csize);
      if (e.method === 0) return data;
      if (e.method !== 8) throw new Error('Unsupported compression in EPUB.');
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return {
      file(name) {
        const e = entries[name]; if (!e) return null;
        return { async: async type => { const b = await bytes(e); return type === 'string' ? dec.decode(b) : b; } };
      }
    };
  }
  async function openZip(file) {
    try { const z = await openZipNative(file); if (z) return z; } catch (e) { if (/not a valid/.test(e.message)) throw e; }
    const JSZip = await loadJSZip();
    return JSZip.loadAsync(file);
  }
  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = () => window.JSZip ? res(window.JSZip) : rej(new Error('JSZip unavailable'));
      s.onerror = () => rej(new Error('Could not load the EPUB reader library (check your connection).'));
      document.head.appendChild(s);
    });
  }
  function resolvePath(base, href) {
    const parts = (base ? base.split('/') : []);
    href.split('/').forEach(seg => {
      if (seg === '..') parts.pop(); else if (seg !== '.' && seg !== '') parts.push(seg);
    });
    return parts.join('/');
  }
  function parseXml(text, type) {
    const dp = new DOMParser();
    let doc = dp.parseFromString(text, type || 'application/xhtml+xml');
    if (doc.getElementsByTagName('parsererror').length) doc = dp.parseFromString(text, 'text/html');
    return doc;
  }
  async function parseEpub(file, onStatus) {
    onStatus('Opening the EPUB…');
    const zip = await openZip(file);
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('This does not look like an EPUB file (META-INF/container.xml missing).');
    const container = parseXml(await containerFile.async('string'), 'application/xml');
    const rootEl = container.getElementsByTagName('rootfile')[0];
    if (!rootEl) throw new Error('EPUB rootfile not found.');
    const opfPath = rootEl.getAttribute('full-path');
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';
    const opf = parseXml(await zip.file(opfPath).async('string'), 'application/xml');
    const manifest = {};
    Array.from(opf.getElementsByTagName('item')).forEach(it => {
      manifest[it.getAttribute('id')] = { href: it.getAttribute('href'), type: it.getAttribute('media-type') || '' };
    });
    const titleEl = opf.getElementsByTagName('dc:title')[0] || opf.getElementsByTagName('title')[0];
    const spine = Array.from(opf.getElementsByTagName('itemref')).map(r => manifest[r.getAttribute('idref')]).filter(Boolean);
    const stream = []; // {text, doc}
    const docImages = []; // {doc, path}
    let d = 0;
    for (const item of spine) {
      if (!/html|xml/.test(item.type)) continue;
      const path = resolvePath(opfDir, decodeURIComponent(item.href));
      const f = zip.file(path); if (!f) continue;
      onStatus(`Reading ${path}…`);
      const doc = parseXml(await f.async('string'));
      const docDir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      Array.from(doc.getElementsByTagName('p')).forEach(p => {
        const t = (p.textContent || '').replace(/\s+/g, ' ').trim();
        if (t && !/^[\divxlcIVXLC.\s]{1,6}$/.test(t)) stream.push({ text: t, doc: d });
      });
      Array.from(doc.getElementsByTagName('img')).forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('xlink:href');
        if (src) docImages.push({ doc: d, path: resolvePath(docDir, decodeURIComponent(src)) });
      });
      d++;
    }
    onStatus('Finding the twenty chapters…');
    const keys = stream.map(s => norm(s.text));
    const anchors = B.chapterAnchors.map(anchorKey);
    const starts = [];
    let from = 0;
    anchors.forEach(a => {
      let found = -1;
      for (let i = from; i < keys.length; i++) { if (keys[i].startsWith(a)) { found = i; break; } }
      starts.push(found);
      if (found >= 0) from = found + 1;
    });
    const foundCount = starts.filter(s => s >= 0).length;
    if (foundCount < 10) throw new Error('Could not recognise the chapters. Please load a Spanish edition of «Cien años de soledad».');
    const endKey = norm(B.endAnchor);
    const chapters = starts.map((st, i) => {
      if (st < 0) return [];
      let next = keys.length;
      for (let j = i + 1; j < starts.length; j++) if (starts[j] > st) { next = starts[j]; break; }
      if (i === starts.length - 1) {
        for (let k = st; k < keys.length; k++) if (keys[k].includes(endKey)) { next = k + 1; break; }
        next = Math.min(next, st + 200);
      }
      return stream.slice(st, next).map(s => s.text);
    });
    // Illustrations: first image inside a document that holds a chapter's text.
    const images = {};
    const docOfChapter = starts.map(st => (st >= 0 ? stream[st].doc : -1));
    for (const im of docImages) {
      const chIdx = docOfChapter.findIndex((dd, i) => {
        if (dd < 0) return false;
        const endDoc = (chapters[i].length ? stream[starts[i] + chapters[i].length - 1].doc : dd);
        return im.doc >= dd && im.doc <= endDoc;
      });
      if (chIdx >= 0 && !images[chIdx + 1]) {
        const f = zip.file(im.path);
        if (f) {
          const ext = im.path.split('.').pop().toLowerCase();
          const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          try { images[chIdx + 1] = new Blob([await f.async('uint8array')], { type: mime }); } catch (e) { /* skip */ }
        }
      }
    }
    return {
      meta: { title: titleEl ? titleEl.textContent : file.name, file: file.name, loadedAt: new Date().toISOString(), found: foundCount },
      chapters, images
    };
  }

  // ------------------------------------------------------------------
  // Automatic quotation (note -> best matching sentence)
  // ------------------------------------------------------------------
  const STOP = new Set(('a al algo algun alguna alguno ante antes aqui asi aun aunque bajo bien cada casi como con contra cual cuando de del desde donde dos el ella ellas ello ellos en entre era eran es esa ese eso esta este esto estos fue fueron ha habia hacia han hasta hay la las le les lo los mas me mi mientras muy nada ni no nos o otra otro para pero poco por porque que quien se sea segun ser si sin sino sobre solo su sus tambien tan tanto te tenia todo todos tu un una uno unos y ya yo ' +
    'the a an and or but of to in on at for with from by as is are was were be been being it its this that these those he she they them his her their i me my we our you your not no so if then than too very can could would should will just about into over after before when where why how what which who whom also only even more most much many some any all each both there here up down out off again once do does did have has had ' +
    'chapter para paragraph novel book reading read note think feel seems seem like really').split(/\s+/));
  const NAME_TOKENS = ['ursula', 'amaranta', 'aureliano', 'arcadio', 'melquiades', 'remedios', 'rebeca', 'fernanda', 'petra', 'pilar', 'ternera', 'gerineldo', 'crespi', 'pietro', 'moncada', 'prudencio', 'meme', 'mauricio', 'babilonia', 'gaston', 'nigromanta', 'santa', 'sofia', 'visitacion', 'apolinar', 'moscote', 'macondo', 'coronel', 'buendia', 'herbert', 'brown', 'catalan', 'nicanor', 'drake', 'riohacha'];
  function queryStems(text) {
    const words = norm(text).split(' ').filter(w => w.length > 2 && !STOP.has(w));
    const stems = new Set();
    words.forEach(w => {
      if (NAME_TOKENS.includes(w)) { stems.add(w); return; }
      const lex = B.lexicon[w] || B.lexicon[w.replace(/s$/, '')];
      if (lex) lex.forEach(x => stems.add(norm(x).slice(0, 5)));
      stems.add(w.slice(0, 5));
    });
    return Array.from(stems).filter(s => s.length >= 3);
  }
  function splitSentences(text) {
    const out = [];
    const re = /[^.!?…]+(?:[.!?…]+[»"”)]?|$)/g;
    let m;
    while ((m = re.exec(text))) { const s = m[0].trim(); if (s.length > 1) out.push(s); if (!m[0]) break; }
    // merge very short fragments with the next sentence
    const merged = [];
    out.forEach(s => {
      if (merged.length && merged[merged.length - 1].length < 25) merged[merged.length - 1] += ' ' + s;
      else merged.push(s);
    });
    return merged;
  }
  function trimQuote(s, stems) {
    if (s.length <= 240) return s;
    const n = norm(s);
    let pos = -1;
    for (const st of stems) { const i = n.indexOf(' ' + st); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
    // map approximate position (norm keeps length roughly equal for Spanish)
    let start = Math.max(0, pos - 80);
    let end = Math.min(s.length, start + 220);
    start = s.lastIndexOf(' ', start) + 1;
    const sp = s.indexOf(' ', end); end = sp > 0 ? sp : s.length;
    return (start > 0 ? '…' : '') + s.slice(start, end).trim().replace(/[,;:]$/, '') + (end < s.length ? '…' : '');
  }
  function candidateSources(ch, sub) {
    const c = chapter(ch);
    const subs = sub ? [c.subs[sub - 1]] : c.subs;
    const curated = [];
    subs.forEach(s => (s.quotes || []).forEach(q => {
      const [qc, qp] = q.p.split(':').map(Number);
      curated.push({ es: q.es, en: q.en, ch: qc, p: qp, src: 'curated' });
    }));
    const text = [];
    if (BOOK && BOOK.chapters[ch - 1] && BOOK.chapters[ch - 1].length) {
      const paras = BOOK.chapters[ch - 1];
      const ranges = BOOK.ranges[ch - 1];
      const [a, bEnd] = sub ? ranges[sub - 1] : [0, paras.length - 1];
      for (let i = a; i <= bEnd; i++) splitSentences(paras[i]).forEach(sen => text.push({ es: sen, ch, p: i + 1, src: 'text' }));
    }
    return { curated, text };
  }
  function suggestQuotes(noteText, ch, sub, onlyPara) {
    const stems = queryStems(noteText);
    let { curated, text } = candidateSources(ch, sub);
    if (onlyPara) text = text.filter(t => t.p === onlyPara);
    const pool = text.length ? text : curated;
    if (!pool.length) return [];
    const toks = pool.map(c => ' ' + norm(c.es + (c.src === 'curated' ? ' ' + (c.en || '') : '')) + ' ');
    const df = {};
    stems.forEach(st => { df[st] = toks.filter(t => t.includes(' ' + st)).length; });
    const N = pool.length;
    const scored = pool.map((c, i) => {
      let score = 0;
      stems.forEach(st => {
        if (df[st] && toks[i].includes(' ' + st)) score += Math.log(1 + N / df[st]) * (NAME_TOKENS.includes(st) ? 0.7 : 1);
      });
      const len = c.es.length;
      if (score > 0) score += len >= 40 && len <= 240 ? 0.3 : 0;
      return { c, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    let out = scored.slice(0, 8).map(x => Object.assign({}, x.c, { es: trimQuote(x.c.es, stems), score: x.score }));
    if (!out.length) {
      // No lexical match: fall back to the subsection's key passages.
      out = (curated.length ? curated : pool.slice(0, 3)).map(c => Object.assign({}, c, { es: trimQuote(c.es, stems), score: 0, fallback: true }));
    }
    // de-duplicate
    const seen = new Set();
    return out.filter(q => { const k = q.ch + ':' + q.p + ':' + q.es.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  // ------------------------------------------------------------------
  // Icons (original line drawings)
  // ------------------------------------------------------------------
  const ICONS = {
    ice: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
    cock: '<path d="M7 21h8M11 21v-3M6 12c0-4 3-6 5-6l1-3 2 2 3 1-2 2c3 1 4 4 3 7-1 2-3 3-6 3s-6-2-6-6z"/><path d="M6 12l-3-2 3-1"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    piano: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M7 6v7M11 6v7M15 6v7M19 6v7M3 13h18"/>',
    flag: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
    sword: '<path d="M14.5 3.5L20 3l-.5 5.5L10 18l-4-4z"/><path d="M5 15l4 4M3 21l3-3"/>',
    flower: '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="6.5" r="2.8"/><circle cx="17.5" cy="12" r="2.8"/><circle cx="12" cy="17.5" r="2.8"/><circle cx="6.5" cy="12" r="2.8"/>',
    cross: '<path d="M12 3v18M6 9h12"/>',
    circle: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 2.2"/><circle cx="12" cy="12" r="1.6"/>',
    mask: '<path d="M4 6c5-2 11-2 16 0v5c0 5-4 8-8 8s-8-3-8-8z"/><path d="M8 11h2.5M13.5 11H16M9 15c2 1 4 1 6 0"/>',
    train: '<rect x="5" y="3" width="14" height="13" rx="2"/><path d="M5 10h14M8 16l-2 5M16 16l2 5M7 19h10"/><circle cx="9" cy="13" r=".9"/><circle cx="15" cy="13" r=".9"/>',
    banana: '<path d="M4 6c0 9 7 14 16 12-1 2-4 3-7 3C7 21 3 14 4 6z"/><path d="M4 6L3 3.5"/>',
    fish: '<path d="M3 12c3-4 8-5 12-3l5-3v12l-5-3c-4 2-9 1-12-3z"/><circle cx="8" cy="11" r=".9"/>',
    butterfly: '<path d="M12 7v12"/><path d="M12 10C9.5 3.5 3 4 4 9.5c.6 3 5 3 8 1.5M12 10c2.5-6.5 9-6 8-.5-.6 3-5 3-8 1.5M12 13c-3 0-6.5 1.5-6 4.5.4 2 3.5 1.5 6-2.5M12 13c3 0 6.5 1.5 6 4.5-.4 2-3.5 1.5-6-2.5"/>',
    station: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
    rain: '<path d="M6.5 14a4 4 0 01-.3-8 6 6 0 0111.3 1.5A3.3 3.3 0 0118 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
    dust: '<path d="M3 17h18M5 13h10M9 9h11M4 21h8M15 5h4"/>',
    scroll: '<path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7"/><path d="M7 3a2 2 0 00-2 2v2h4V5a2 2 0 00-2-2zM10 10h6M10 14h6M10 18h4"/>',
    bird: '<path d="M3 13c4 0 6-3 8-6 1 3 3 5 7 5l3-2-1 4c-2 3-6 5-10 5-3 0-6-2-7-6z"/><circle cx="16" cy="11" r=".6"/>',
    wind: '<path d="M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h8"/>',
    tree: '<path d="M12 21v-7M9 21h6M12 14c-5 0-8-3-7-7 1-3 4-4 7-4s6 1 7 4c1 4-2 7-7 7z"/>',
    room: '<path d="M5 21V3h14v18M3 21h18"/><circle cx="15.5" cy="12" r=".9"/>',
    ant: '<circle cx="12" cy="6" r="1.8"/><ellipse cx="12" cy="11" rx="1.8" ry="2.2"/><ellipse cx="12" cy="17.3" rx="2.4" ry="3"/><path d="M10.3 10.5l-5-2M13.7 10.5l5-2M10.3 12l-5 1.5M13.7 12l5 1.5M10.5 14l-4 3.5M13.5 14l4 3.5M11 4.5L9 2M13 4.5L15 2"/>',
    mirror: '<ellipse cx="12" cy="9.5" rx="6" ry="7"/><path d="M12 16.5V21M9 21h6M9.5 6.5l2.5-2"/>',
    earth: '<path d="M3 18c3-3 6-3 9 0s6 3 9 0M5 14l3-6 3 3 3-7 5 10"/>',
    bones: '<path d="M8 8l8 8"/><circle cx="6.5" cy="5.5" r="1.6"/><circle cx="5.5" cy="8.5" r="1.6"/><circle cx="18.5" cy="15.5" r="1.6"/><circle cx="17.5" cy="18.5" r="1.6"/>',
    bandage: '<rect x="2.5" y="9" width="19" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="M11 11.5h.01M13 12.5h.01"/>',
    needle: '<path d="M4 20L18 6"/><ellipse cx="19" cy="5" rx="1.2" ry="2.2" transform="rotate(45 19 5)"/><path d="M6 14c-2 2-1 5 2 5"/>',
    name: '<path d="M4 7h16M4 12h10M4 17h13"/>',
    house: '<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 15h9"/>',
    pot: '<path d="M5 9h14l-1 9a3 3 0 01-3 3H9a3 3 0 01-3-3z"/><path d="M4 9h16M18.5 11c3 0 3 4 0 4"/>',
    crown: '<path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4z"/>',
    cards: '<rect x="4" y="5" width="11" height="15" rx="1.5" transform="rotate(-8 9.5 12.5)"/><rect x="9" y="4" width="11" height="15" rx="1.5" transform="rotate(8 14.5 11.5)"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 7h8"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>'
  };
  const MOTIF_ICON_FALLBACK = { poder: 'crown', memoria: 'eye', tiempo: 'circle' };
  function icon(name, cls) {
    const body = ICONS[name] || ICONS[MOTIF_ICON_FALLBACK[name]] || ICONS.book;
    return `<svg class="${cls || 'icon'}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }

  // ------------------------------------------------------------------
  // Small shared renderers
  // ------------------------------------------------------------------
  function charChip(id) {
    const c = charById[id];
    if (!c) return '';
    return `<a class="chip" href="#/character/${c.id}">${esc(c.name)}</a>`;
  }
  function motifChip(id) {
    const m = motifById[id];
    if (m) return `<a class="chip chip-motif" href="#/themes?m=${m.id}">${icon(m.icon, 'icon icon-sm')}${esc(m.es)}</a>`;
    const t = themeById[id];
    if (t) return `<a class="chip chip-motif" href="#/themes?t=${t.id}">${icon(MOTIF_ICON_FALLBACK[id] || 'circle', 'icon icon-sm')}${esc(t.es)}</a>`;
    return '';
  }
  function termsTable(terms) {
    if (!terms || !terms.length) return '';
    return `<div class="table-wrap"><table class="terms"><thead><tr><th scope="col">Español</th><th scope="col">English</th><th scope="col">Note</th></tr></thead><tbody>${terms.map(t => `<tr><th scope="row" lang="es">${esc(t.es)}</th><td>${esc(t.en)}</td><td>${rich(t.note || '')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function questionList(qs, ctx) {
    return `<ol class="questions">${qs.map((q, i) => `<li><span class="q-text">${rich(esc(q).replace(/\[@(\d+):(\d+)\]/g, '[@$1:$2]'))}</span>
      <button type="button" class="btn btn-quiet btn-sm" data-action="answer-q" data-ch="${ctx.ch}" data-sub="${ctx.sub || ''}" data-qi="${i}" data-qset="${ctx.set}">Write an answer</button></li>`).join('')}</ol>`;
  }
  function stageBadge(stage) { return `<span class="badge badge-${stage}">${esc(STAGE_LABEL[stage] || stage)}</span>`; }
  function subKey(ch, sub) { return ch + '.' + sub; }
  function chapterProgress(ch) {
    const c = chapter(ch); const done = c.subs.filter(s => READ[subKey(ch, s.n)]).length;
    return { done, total: c.subs.length };
  }
  function progressBar(done, total, label) {
    const pct = total ? Math.round(100 * done / total) : 0;
    return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="${esc(label || 'Progress')}"><span style="width:${pct}%"></span></div>`;
  }
  function questionsFor(set, ch, sub) {
    if (set === 'pre') return chapter(ch).preQuestions;
    if (set === 'end') return chapter(ch).endQuestions;
    if (set === 'sub') return chapter(ch).subs[sub - 1].questions;
    if (set === 'phil') { const p = B.philosophy[ch]; return p ? p.questions : []; }
    return [];
  }

  // ------------------------------------------------------------------
  // Views
  // ------------------------------------------------------------------
  function viewHome() {
    const doneAll = Object.keys(READ).filter(k => READ[k]).length;
    const resume = LAST && chapter(LAST.ch) ? `<a class="btn btn-primary" href="#/ch/${LAST.ch}/${LAST.sub}">Continue: ${LAST.ch}.${LAST.sub} ${esc(chapter(LAST.ch).subs[LAST.sub - 1].titleEs)}</a>` : `<a class="btn btn-primary" href="#/ch/1">Begin with Chapter 1</a>`;
    return `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Gabriel García Márquez · 1967</p>
        <h1 tabindex="-1">Cien años de soledad</h1>
        <p class="subtitle">A deep, bilingual reading companion: chapter by chapter, stop by stop.</p>
        <p class="dedication" lang="es">${esc(B.dedication)}</p>
        <div class="hero-actions">${resume}
          <a class="btn" href="#/library">${BOOK ? 'Your book is loaded ✓' : 'Load your EPUB to read the full text'}</a>
          <a class="btn btn-quiet" href="#/guide">How to use this site</a></div>
        <div class="hero-progress"><span>${doneAll} of ${TOTAL_SUBS} stops read</span>${progressBar(doneAll, TOTAL_SUBS, 'Overall reading progress')}</div>
      </div>
      <div class="hero-art" aria-hidden="true">${heroArt()}</div>
    </section>
    <section class="section prose">${rich(B.introduction)}</section>
    <section class="section">
      <h2>The shape of the story</h2>
      <p class="lede">Exposition, rising action, climax, falling action, denouement. Tap a chapter to open it.</p>
      ${arcSvg()}
      <p><a href="#/structure">Read the full plot structure →</a></p>
    </section>
    <section class="section">
      <h2>Twenty chapters</h2>
      ${chapterGrid()}
    </section>
    <section class="section grid-3">
      <a class="card link-card" href="#/tree">${icon('tree', 'icon icon-lg')}<h3>Family tree</h3><p>Seven generations of Buendías, interactive, with ages and relationships.</p></a>
      <a class="card link-card" href="#/themes">${icon('butterfly', 'icon icon-lg')}<h3>Themes & motifs</h3><p>Solitude, circular time, memory, and the images that return.</p></a>
      <a class="card link-card" href="#/philosophy">${icon('scroll', 'icon icon-lg')}<h3>Philosophy</h3><p>Big questions, key passages, and ideas for essays.</p></a>
    </section>`;
  }
  function heroArt() {
    // Original composition: the gypsies' ice block, the chestnut tree, yellow butterflies.
    return `<svg viewBox="0 0 320 320" class="art">
      <defs><linearGradient id="gIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ice-1)"/><stop offset="1" stop-color="var(--ice-2)"/></linearGradient></defs>
      <circle cx="160" cy="160" r="150" fill="var(--paper-2)"/>
      <path d="M40 250 Q160 220 280 250 L280 290 Q160 310 40 290Z" fill="var(--earth)"/>
      <g stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M225 250 L225 150"/><path d="M225 175 Q200 160 190 135"/><path d="M225 165 Q250 150 258 128"/>
      </g>
      <g fill="var(--leaf)"><circle cx="190" cy="125" r="28"/><circle cx="235" cy="110" r="34"/><circle cx="262" cy="130" r="24"/><circle cx="212" cy="140" r="22"/></g>
      <g transform="translate(70 150)">
        <rect x="0" y="40" width="100" height="62" rx="4" fill="var(--wood)"/>
        <polygon points="8,40 50,6 92,40" fill="url(#gIce)" stroke="var(--ink)" stroke-width="1.5"/>
        <path d="M50 6 L50 40 M28 23 L72 23 M30 40 L50 12 L70 40" stroke="var(--paper)" stroke-width="1" opacity=".8"/>
      </g>
      <g fill="var(--butterfly)">
        <path d="M120 70 q-12 -14 -18 2 q8 8 18 -2 q12 -14 18 2 q-8 8 -18 -2z"/>
        <path d="M160 95 q-8 -10 -12 2 q5 5 12 -2 q8 -10 12 2 q-5 5 -12 -2z"/>
        <path d="M95 110 q-6 -8 -9 1 q4 4 9 -1 q6 -8 9 1 q-4 4 -9 -1z"/>
      </g>
    </svg>`;
  }
  const TENSION = [10, 16, 22, 30, 38, 46, 54, 58, 66, 58, 62, 72, 76, 82, 96, 70, 56, 46, 42, 88];
  function arcSvg() {
    const W = 1000, H = 300, padX = 40, top = 30, bottom = 250;
    const pts = TENSION.map((t, i) => [padX + i * (W - 2 * padX) / 19, bottom - (bottom - top) * t / 100]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const bands = B.structure.map(s => {
      const a = Math.min(...s.chapters), z = Math.max(...s.chapters);
      const x1 = padX + (a - 1.5) * (W - 2 * padX) / 19, x2 = padX + (z - 0.5) * (W - 2 * padX) / 19;
      return `<g><rect x="${Math.max(0, x1)}" y="0" width="${Math.min(W, x2) - Math.max(0, x1)}" height="${H}" class="band band-${s.id}"/><text x="${(Math.max(0, x1) + Math.min(W, x2)) / 2}" y="${H - 12}" text-anchor="middle" class="band-label">${esc(s.label)}</text></g>`;
    }).join('');
    const dots = pts.map((p, i) => {
      const c = CH[i];
      return `<a href="#/ch/${c.n}" aria-label="Chapter ${c.n}: ${esc(c.titleEn)}"><g class="arc-dot"><title>Chapter ${c.n} · ${esc(c.titleEs)}</title><circle cx="${p[0]}" cy="${p[1]}" r="14" fill="${c.color}"/><text x="${p[0]}" y="${p[1] + 4.5}" text-anchor="middle">${c.n}</text></g></a>`;
    }).join('');
    return `<div class="arc-wrap"><svg class="arc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Plot tension across the twenty chapters">${bands}<path d="${d}" class="arc-line"/>${dots}</svg></div>`;
  }
  function chapterGrid() {
    return `<ol class="ch-grid">${CH.map(c => {
      const pr = chapterProgress(c.n);
      return `<li><a class="ch-tile" href="#/ch/${c.n}" style="--c:${c.color}">
        <span class="ch-num">${c.n}</span>${icon(c.icon, 'icon icon-md')}
        <span class="ch-title" lang="es">${esc(c.titleEs)}</span>
        <span class="ch-sub">${esc(c.titleEn)}</span>
        ${progressBar(pr.done, pr.total, `Chapter ${c.n} progress`)}
      </a></li>`;
    }).join('')}</ol>`;
  }

  function viewGuide() {
    return `<article class="section prose narrow"><h1 tabindex="-1">How to use this site</h1>${rich(B.howToRead)}
    <h2>Highlighting</h2><p>In any subsection with the text loaded, select words with your mouse or finger. A small toolbar appears: choose a colour, or <b>Note</b> to write about the passage. Tap a highlight to change its colour, add a note, or remove it. Tap a paragraph number to write a note about that paragraph.</p>
    <h2>Automatic quotations</h2><p>As you type a note, the site searches the text of that subsection for the sentence that best matches your words. It recognises character names and understands common English words through a small bilingual lexicon (for example, <i>ice → hielo</i>, <i>solitude → soledad</i>, <i>rain → lluvia</i>). Use <b>Another</b> to cycle through the candidates, or <b>Remove</b> to save the note without a quotation. If your book is not loaded, the quotation is chosen from the key passages cited in the commentary.</p>
    <h2>Citations</h2><p>Every citation follows Harvard style: ${esc(citeText(1, 1))}. E-books have no fixed pages, so paragraph numbers are the precise locator (Harvard allows "para." for unpaginated sources). The number is shown in the margin of the text. The full reference is on the <a href="#/about">About</a> page.</p>
    <h2>Your privacy</h2><p>Your book, notes and highlights stay in this browser on this device. Nothing is sent to a server. Use <a href="#/notebook">Notebook → Export</a> to back up or move your notes.</p>
    <h2>Keyboard</h2><ul><li><kbd>←</kbd>/<kbd>→</kbd>: previous or next subsection (when not typing).</li><li><kbd>/</kbd>: search.</li></ul>
    </article>`;
  }

  function viewStructure() {
    return `<article class="section"><h1 tabindex="-1">Plot structure</h1>
    <p class="lede">The novel follows a Freytag pyramid at the level of history (the massacre is the peak) and ends with a second peak of revelation in the final chapter.</p>
    ${arcSvg()}
    ${B.structure.map(s => `<section class="card stage-card" id="stage-${s.id}"><h2>${esc(s.label)} <span class="muted" lang="es">· ${esc(s.es)}</span></h2>
      <p class="chips">${s.chapters.map(n => `<a class="chip" href="#/ch/${n}" style="border-color:${chapter(n).color}">Ch. ${n}: <span lang="es">${esc(chapter(n).titleEs)}</span></a>`).join(' ')}</p>
      <p>${rich(s.text)}</p></section>`).join('')}
    <section class="card"><h2>Timeline of the story</h2><ol class="timeline">${B.timeline.map(t => `<li><b>${esc(t.when)}</b> ${rich(t.what)}</li>`).join('')}</ol></section>
    </article>`;
  }

  function viewChapters() {
    return `<article class="section"><h1 tabindex="-1">Chapters & stops</h1>
    <p class="lede">Every chapter is divided into stops (subsections) at natural turns in the story. Check them off as you read.</p>
    ${CH.map(c => {
      const pr = chapterProgress(c.n);
      return `<section class="card ch-map" style="--c:${c.color}">
        <header class="ch-map-head"><a href="#/ch/${c.n}" class="ch-map-title"><span class="ch-num">${c.n}</span> <span lang="es">${esc(c.titleEs)}</span> <span class="muted">· ${esc(c.titleEn)}</span></a> ${stageBadge(c.stage)} <span class="muted small">${pr.done}/${pr.total} read</span></header>
        <ol class="sub-list">${c.subs.map(s => `<li class="${READ[subKey(c.n, s.n)] ? 'is-read' : ''}"><a href="#/ch/${c.n}/${s.n}"><span class="sub-num">${c.n}.${s.n}</span> <span lang="es">${esc(s.titleEs)}</span> <span class="muted">· ${esc(s.titleEn)}</span> <span class="muted small">¶${s.start}–${s.end}</span></a></li>`).join('')}</ol>
      </section>`;
    }).join('')}</article>`;
  }

  function prevNextChapter(n) {
    const p = chapter(n - 1), q = chapter(n + 1);
    return `<nav class="pager" aria-label="Chapter navigation">
      ${p ? `<a class="btn" href="#/ch/${p.n}" rel="prev">← Ch. ${p.n} <span lang="es">${esc(p.titleEs)}</span></a>` : '<span></span>'}
      ${q ? `<a class="btn" href="#/ch/${q.n}" rel="next">Ch. ${q.n} <span lang="es">${esc(q.titleEs)}</span> →</a>` : `<a class="btn" href="#/ch/1/1?p=1">Return to the first sentence ↺</a>`}
    </nav>`;
  }

  function viewChapter(n) {
    const c = chapter(n);
    if (!c) return viewNotFound();
    const pr = chapterProgress(n);
    const img = imageUrls[n] ? `<figure class="illus"><img src="${imageUrls[n]}" alt="Illustration for chapter ${n} from your edition"><figcaption>Illustration from your own edition.</figcaption></figure>` : '';
    const chNotes = NOTES.filter(x => x.ch === n);
    return `<article class="chapter" style="--c:${c.color}">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/chapters">Chapters</a> › <span>Chapter ${n}</span></nav>
      <header class="ch-head">
        <div class="ch-emblem">${icon(c.icon, 'icon icon-xl')}</div>
        <div><p class="eyebrow">Chapter ${n} of 20 · ${stageBadge(c.stage)} · ${BOOK && BOOK.chapters[n - 1] ? BOOK.chapters[n - 1].length : B.expectedParas[n - 1]} paragraphs</p>
        <h1 tabindex="-1" lang="es">${esc(c.titleEs)}</h1><p class="subtitle">${esc(c.titleEn)}</p><p class="tagline">${esc(c.tagline)}</p>
        <div class="ch-progress"><span class="small">${pr.done}/${pr.total} stops read</span>${progressBar(pr.done, pr.total, 'Chapter progress')}</div></div>
      </header>
      ${img}
      <nav class="toc" aria-label="On this page"><a href="#q-pre" data-scroll>Before you read</a><a href="#summary" data-scroll>Deep reading</a><a href="#stops" data-scroll>Stops</a><a href="#imagery" data-scroll>Imágenes</a><a href="#people" data-scroll>Characters & motifs</a><a href="#terms" data-scroll>Key terms</a><a href="#context" data-scroll>Context</a><a href="#takeaways" data-scroll>Takeaways</a><a href="#q-end" data-scroll>Questions</a><a href="#ch-notes" data-scroll>Notes</a></nav>
      <section id="q-pre" class="card q-card"><h2>Before you read: ask yourself</h2>${questionList(c.preQuestions, { ch: n, set: 'pre' })}</section>
      <section id="summary" class="section prose"><h2>Deep reading summary</h2>
        <p class="transition-in"><b>Coming from the previous chapter:</b> ${rich(c.transitionIn)}</p>
        ${rich(c.summary)}</section>
      <section id="stops" class="section"><h2>Stops in this chapter</h2>
        <ol class="stop-cards">${c.subs.map(s => `<li><a class="card stop-card ${READ[subKey(n, s.n)] ? 'is-read' : ''}" href="#/ch/${n}/${s.n}">
          <span class="sub-num">${n}.${s.n}</span><span class="stop-title" lang="es">${esc(s.titleEs)}</span><span class="muted">${esc(s.titleEn)}</span>
          <span class="muted small">¶${s.start}–${s.end}${READ[subKey(n, s.n)] ? ' · read ✓' : ''}</span></a></li>`).join('')}</ol>
        <p><a class="btn btn-primary" href="#/ch/${n}/1">Start reading stop ${n}.1 →</a></p></section>
      <section id="imagery" class="section prose" lang="es"><h2>Imágenes y descripción</h2>${rich(c.imageryEs)}</section>
      <section id="people" class="section"><h2>Characters in this chapter</h2><p class="chips">${c.characters.map(charChip).join(' ')}</p>
        <h3>Motifs & themes</h3><p class="chips">${c.motifs.map(motifChip).join(' ')}</p></section>
      <section id="terms" class="section"><h2>Key terms & etymologies</h2>${termsTable(c.terms)}</section>
      <section id="context" class="section prose"><h2>Context</h2><p>${rich(c.context)}</p></section>
      <section id="takeaways" class="section prose"><h2>Main takeaways</h2><ul>${c.takeaways.map(t => `<li>${rich(t)}</li>`).join('')}</ul>
        <p class="transition-out"><b>Into the next chapter:</b> ${rich(c.transitionOut)}</p></section>
      <section id="q-end" class="card q-card"><h2>After the chapter: questions for the whole section</h2>${questionList(c.endQuestions, { ch: n, set: 'end' })}</section>
      <section id="ch-notes" class="section"><h2>Your notes on this chapter</h2>
        <div id="note-editor-slot"></div>
        <p><button type="button" class="btn" data-action="note-new" data-ch="${n}" data-sub="">Write a note on the whole chapter</button></p>
        ${notesList(chNotes, true)}</section>
      ${prevNextChapter(n)}
    </article>`;
  }

  function viewSub(n, sn, q) {
    const c = chapter(n); if (!c) return viewNotFound();
    const s = c.subs[sn - 1]; if (!s) return viewNotFound();
    LAST = { ch: n, sub: sn }; store.set('cien.last', LAST);
    const read = !!READ[subKey(n, sn)];
    const prev = sn > 1 ? { ch: n, sub: sn - 1 } : (n > 1 ? { ch: n - 1, sub: chapter(n - 1).subs.length } : null);
    const next = sn < c.subs.length ? { ch: n, sub: sn + 1 } : (n < 20 ? { ch: n + 1, sub: 1 } : null);
    const subNotes = NOTES.filter(x => x.ch === n && x.sub === sn);
    const range = BOOK && BOOK.ranges && BOOK.ranges[n - 1] ? BOOK.ranges[n - 1][sn - 1] : null;
    const rangeLabel = range ? `¶${range[0] + 1}–${range[1] + 1}` : `¶${s.start}–${s.end}`;
    return `<article class="sub" style="--c:${c.color}" data-ch="${n}" data-sub="${sn}">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/chapters">Chapters</a> › <a href="#/ch/${n}">Chapter ${n}: <span lang="es">${esc(c.titleEs)}</span></a> › <span>Stop ${n}.${sn}</span></nav>
      <header class="sub-head">
        <p class="eyebrow">Stop ${n}.${sn} of ${c.subs.length} · ${rangeLabel} · ${stageBadge(c.stage)}</p>
        <h1 tabindex="-1" lang="es">${esc(s.titleEs)}</h1><p class="subtitle">${esc(s.titleEn)}</p>
        <div class="sub-actions">
          <button type="button" class="btn ${read ? 'btn-done' : ''}" data-action="mark-read" data-ch="${n}" data-sub="${sn}" aria-pressed="${read}">${read ? 'Read ✓' : 'Mark as read'}</button>
          <a class="btn btn-quiet" href="#/ch/${n}">Chapter overview</a>
        </div>
      </header>
      <nav class="toc" aria-label="On this page"><a href="#q-sub" data-scroll>Ask first</a><a href="#summary" data-scroll>Deep reading</a><a href="#imagery" data-scroll>Imágenes</a><a href="#passages" data-scroll>Key passages</a><a href="#text" data-scroll>The text</a><a href="#reflect" data-scroll>Pause & reflect</a><a href="#notes" data-scroll>Notes</a></nav>
      <section id="q-sub" class="card q-card"><h2>Carry these questions into the passage</h2><ul class="questions plain">${s.questions.map(qq => `<li>${rich(esc(qq))}</li>`).join('')}</ul></section>
      <section id="summary" class="section prose"><h2>Deep reading</h2>${rich(s.summary)}
        <p class="chips">${(s.chars || []).map(charChip).join(' ')}</p></section>
      <section id="imagery" class="section prose" lang="es"><h2>Imágenes</h2><p>${rich(s.imageryEs)}</p></section>
      <section id="terms" class="section"><h2>Key terms</h2>${termsTable(s.terms)}</section>
      <section id="passages" class="section"><h2>Key passages</h2>${(s.quotes || []).map(qq => { const [qc, qp] = qq.p.split(':'); return `<blockquote class="passage"><p lang="es">«${esc(qq.es)}»</p><p class="gloss">${esc(qq.en)}</p><footer>${citeLink(qc, qp)}</footer></blockquote>`; }).join('')}</section>
      <section id="text" class="section reader-section"><h2>The text <span class="muted small">${rangeLabel}</span></h2>
        ${renderReader(n, sn)}</section>
      <section id="reflect" class="card q-card"><h2>Pause and reflect: what should you be asking yourself?</h2>${questionList(s.questions, { ch: n, sub: sn, set: 'sub' })}
        <p class="transition-out"><b>What comes next:</b> ${rich(s.transition)}</p></section>
      <section id="notes" class="section"><h2>Your notes on this stop</h2>
        <div id="note-editor-slot"></div>
        <p><button type="button" class="btn" data-action="note-new" data-ch="${n}" data-sub="${sn}">Write a note</button></p>
        ${notesList(subNotes, false)}</section>
      <nav class="pager" aria-label="Stop navigation">
        ${prev ? `<a class="btn" id="prev-stop" href="#/ch/${prev.ch}/${prev.sub}" rel="prev">← ${prev.ch}.${prev.sub} <span lang="es">${esc(chapter(prev.ch).subs[prev.sub - 1].titleEs)}</span></a>` : '<span></span>'}
        ${next ? `<a class="btn btn-primary" id="next-stop" href="#/ch/${next.ch}/${next.sub}" rel="next">${next.ch}.${next.sub} <span lang="es">${esc(chapter(next.ch).subs[next.sub - 1].titleEs)}</span> →</a>` : `<a class="btn btn-primary" href="#/ch/20">Chapter 20 overview</a>`}
      </nav>
    </article>`;
  }

  function renderReader(n, sn) {
    if (!BOOK || !BOOK.chapters[n - 1] || !BOOK.chapters[n - 1].length) {
      return `<div class="card empty-reader">${icon('book', 'icon icon-lg')}
        <p><b>The full text appears here once you load your copy of the novel.</b> Your EPUB is read only inside this browser and saved on your device, never uploaded.</p>
        <p><a class="btn btn-primary" href="#/library">Load your EPUB</a></p>
        <p class="muted small">Until then, the key passages above and the citations throughout link to the exact paragraphs.</p></div>`;
    }
    const paras = BOOK.chapters[n - 1];
    const [a, z] = BOOK.ranges[n - 1][sn - 1];
    let out = `<div class="reader" lang="es" data-ch="${n}">`;
    for (let i = a; i <= z; i++) {
      const p = i + 1;
      out += `<div class="para" id="p${p}"><button type="button" class="pnum" data-action="para-note" data-ch="${n}" data-sub="${sn}" data-p="${p}" title="Write a note on paragraph ${p}" aria-label="Paragraph ${p}: write a note">${p}</button><p class="ptext" data-ch="${n}" data-p="${p}">${highlightHtml(paras[i], HLS.filter(h => h.ch === n && h.p === p))}</p></div>`;
    }
    out += `</div><p class="muted small reader-tip">Select text to highlight it or write a note. Tap a paragraph number to write about that paragraph.</p>`;
    return out;
  }
  function highlightHtml(text, hls) {
    if (!hls.length) return esc(text);
    const owner = new Array(text.length).fill(null);
    hls.slice().sort((x, y) => (x.created || '').localeCompare(y.created || '')).forEach(h => {
      for (let i = Math.max(0, h.start); i < Math.min(text.length, h.end); i++) owner[i] = h;
    });
    let out = '', i = 0;
    while (i < text.length) {
      const h = owner[i]; let j = i;
      while (j < text.length && owner[j] === h) j++;
      const seg = esc(text.slice(i, j));
      out += h ? `<mark class="hl hl-${h.color}" data-hid="${h.id}" tabindex="0" role="button" aria-label="Highlighted passage: tap for options">${seg}</mark>` : seg;
      i = j;
    }
    return out;
  }

  function notesList(list, showSub) {
    if (!list.length) return `<p class="muted">No notes yet.</p>`;
    return `<ul class="notes-list">${list.slice().sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).map(x => noteCard(x, showSub)).join('')}</ul>`;
  }
  function noteCard(x, showSub) {
    const c = chapter(x.ch);
    const where = x.sub ? `${x.ch}.${x.sub} <span lang="es">${esc(c.subs[x.sub - 1].titleEs)}</span>` : `Chapter ${x.ch}: <span lang="es">${esc(c.titleEs)}</span>`;
    const href = x.sub ? `#/ch/${x.ch}/${x.sub}${x.quote ? '?p=' + x.quote.p : ''}` : `#/ch/${x.ch}`;
    return `<li class="card note-card" id="note-${x.id}">
      ${showSub ? `<p class="note-where"><a href="${href}">${where}</a></p>` : ''}
      ${x.question ? `<p class="note-q"><b>Question:</b> ${esc(x.question)}</p>` : ''}
      ${x.quote ? `<blockquote class="note-quote"><p lang="es">«${esc(x.quote.es)}»</p><footer>${citeLink(x.quote.ch || x.ch, x.quote.p)}${x.quote.auto ? ' <span class="tag">auto-quote</span>' : ''}</footer></blockquote>` : ''}
      <div class="note-body">${esc(x.body).replace(/\n/g, '<br>')}</div>
      <p class="note-meta muted small">${new Date(x.updated || x.created).toLocaleString()}
        <button type="button" class="btn btn-quiet btn-sm" data-action="note-edit" data-id="${x.id}">Edit</button>
        <button type="button" class="btn btn-quiet btn-sm" data-action="note-delete" data-id="${x.id}">Delete</button></p>
    </li>`;
  }

  // ---- Note editor ----------------------------------------------------
  let EDITOR = null; // {ch, sub, p, question, id, locked, lockedQuote, candidates, idx, removed}
  function openEditor(ctx) {
    const slot = $('#note-editor-slot');
    if (!slot) { toast('Open a chapter or stop to write notes.'); return; }
    const existing = ctx.id ? NOTES.find(x => x.id === ctx.id) : null;
    EDITOR = Object.assign({ candidates: [], idx: 0, removed: false, locked: false }, ctx);
    if (existing) {
      EDITOR.ch = existing.ch; EDITOR.sub = existing.sub; EDITOR.question = existing.question || '';
      if (existing.quote) { EDITOR.locked = true; EDITOR.lockedQuote = existing.quote; } else EDITOR.removed = true;
    }
    const heading = existing ? 'Edit note' : (ctx.question ? 'Answer the question' : (ctx.p ? `Note on paragraph ${ctx.p}` : 'New note'));
    slot.innerHTML = `<form class="card note-form" id="note-form" autocomplete="off">
      <h3>${heading}</h3>
      ${EDITOR.question ? `<p class="note-q"><b>Question:</b> ${esc(EDITOR.question)}</p>` : ''}
      <label for="note-body" class="label">Your note</label>
      <textarea id="note-body" rows="6" placeholder="What do you notice? What does it mean? Write in English or Spanish.">${existing ? esc(existing.body) : ''}</textarea>
      <div class="quote-suggest" id="quote-suggest" aria-live="polite"></div>
      <div class="row"><button type="submit" class="btn btn-primary">Save note</button>
      <button type="button" class="btn btn-quiet" data-action="note-cancel">Cancel</button></div>
    </form>`;
    const ta = $('#note-body');
    ta.addEventListener('input', debounce(() => { if (EDITOR && !EDITOR.locked && !EDITOR.removed) refreshSuggestions(); }, 250));
    $('#note-form').addEventListener('submit', e => { e.preventDefault(); saveEditor(); });
    if (!EDITOR.locked && !EDITOR.removed) refreshSuggestions(); else renderSuggestion();
    slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => ta.focus({ preventScroll: true }), 150);
  }
  function refreshSuggestions() {
    if (!EDITOR) return;
    const body = ($('#note-body') || {}).value || '';
    const seed = [body, EDITOR.question || ''].join(' ');
    EDITOR.candidates = suggestQuotes(seed, EDITOR.ch, EDITOR.sub || null, EDITOR.p || null);
    if (!EDITOR.candidates.length && EDITOR.p) EDITOR.candidates = suggestQuotes(seed, EDITOR.ch, EDITOR.sub || null);
    EDITOR.idx = 0;
    renderSuggestion();
  }
  function currentQuote() {
    if (!EDITOR) return null;
    if (EDITOR.locked) return EDITOR.lockedQuote;
    if (EDITOR.removed) return null;
    const q = EDITOR.candidates[EDITOR.idx];
    return q ? { es: q.es, ch: q.ch, p: q.p, auto: true } : null;
  }
  function renderSuggestion() {
    const box = $('#quote-suggest'); if (!box || !EDITOR) return;
    const q = currentQuote();
    if (!q) {
      box.innerHTML = `<p class="muted small">No quotation attached. <button type="button" class="btn btn-quiet btn-sm" data-action="quote-restore">Suggest a quotation</button></p>`;
      return;
    }
    const label = EDITOR.locked ? (q.auto ? 'Quotation (automatic)' : 'Quotation (your selection)') : (EDITOR.candidates[EDITOR.idx] && EDITOR.candidates[EDITOR.idx].fallback ? 'Suggested key passage (keep typing to refine)' : 'Suggested quotation, matched to your note');
    box.innerHTML = `<p class="label">${label}</p><blockquote class="note-quote"><p lang="es">«${esc(q.es)}»</p><footer>${citeLink(q.ch || EDITOR.ch, q.p)}</footer></blockquote>
      <p class="row">${!EDITOR.locked && EDITOR.candidates.length > 1 ? `<button type="button" class="btn btn-quiet btn-sm" data-action="quote-next">Another (${EDITOR.idx + 1}/${EDITOR.candidates.length})</button>` : ''}
      ${EDITOR.locked ? `<button type="button" class="btn btn-quiet btn-sm" data-action="quote-unlock">Let the site suggest instead</button>` : ''}
      <button type="button" class="btn btn-quiet btn-sm" data-action="quote-remove">Remove quotation</button></p>`;
  }
  function saveEditor() {
    const body = ($('#note-body') || {}).value.trim();
    let quote = currentQuote();
    if (!body && !quote) { toast('Write something first.'); return; }
    if (!body && !EDITOR.question) { toast('Write a few words about the passage.'); return; }
    if (!quote && !EDITOR.removed) { // try once more at save time
      const c = suggestQuotes(body, EDITOR.ch, EDITOR.sub || null);
      if (c[0]) quote = { es: c[0].es, ch: c[0].ch, p: c[0].p, auto: true };
    }
    const now = new Date().toISOString();
    if (EDITOR.id) {
      const x = NOTES.find(y => y.id === EDITOR.id);
      if (x) { x.body = body; x.quote = quote; x.updated = now; }
    } else {
      NOTES.push({ id: uid(), ch: EDITOR.ch, sub: EDITOR.sub || null, p: EDITOR.p || (quote ? quote.p : null), question: EDITOR.question || '', quote, body, created: now, updated: now, hid: EDITOR.hid || null });
    }
    saveNotes();
    EDITOR = null;
    toast('Note saved.');
    rerender(true);
  }

  // ---- Characters -----------------------------------------------------
  function viewCharacters(q) {
    const f = q.get('g') || 'all';
    const filters = [['all', 'All'], ['1', 'Gen. 1'], ['2', 'Gen. 2'], ['3', 'Gen. 3'], ['4', 'Gen. 4'], ['5', 'Gen. 5'], ['6', 'Gen. 6–7'], ['other', 'Beyond the family']];
    const list = CHARS.filter(c => f === 'all' ? true : f === 'other' ? c.group === 'other' : f === '6' ? (c.gen >= 6 && c.group !== 'other') : String(c.gen) === f && c.group !== 'other');
    return `<article class="section"><h1 tabindex="-1">Characters</h1>
      <p class="lede">Descriptions in Spanish (with English readings) of everyone who matters, with ages, relationships and the chapters where they appear.</p>
      <div class="filters" role="group" aria-label="Filter by generation">${filters.map(([v, l]) => `<a class="btn btn-sm ${f === v ? 'btn-primary' : 'btn-quiet'}" href="#/characters?g=${v}" aria-current="${f === v}">${l}</a>`).join('')}</div>
      <label class="label" for="char-search">Search characters</label><input id="char-search" type="search" class="input" placeholder="Name or role…">
      <ul class="char-grid" id="char-grid">${list.map(c => `<li data-text="${esc(norm(c.name + ' ' + c.role))}"><a class="card char-card" href="#/character/${c.id}">
        <span class="char-gen">${c.group === 'other' ? 'Macondo' : 'Generation ' + c.gen}${c.group === 'spouse' || c.group === 'partner' ? ' · by union' : ''}</span>
        <span class="char-name" lang="es">${esc(c.name)}</span><span class="muted small">${esc(c.role)}</span></a></li>`).join('')}</ul>
      <section class="section prose"><h2>The family arc</h2>${rich(B.familyArc)}</section>
    </article>`;
  }
  function viewCharacter(id) {
    const c = charById[id]; if (!c) return viewNotFound();
    return `<article class="section prose narrow character">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/characters">Characters</a> › <span>${esc(c.name)}</span></nav>
      <p class="eyebrow">${c.group === 'other' ? 'Macondo' : 'Generation ' + c.gen}</p>
      <h1 tabindex="-1" lang="es">${esc(c.name)}</h1><p class="subtitle">${esc(c.role)}</p>
      ${c.quote && c.quote.es !== '—' ? `<blockquote class="passage"><p lang="es">«${esc(c.quote.es)}»</p><footer>${citeLink(...c.quote.p.split(':'))}</footer></blockquote>` : ''}
      <h2>Retrato (en español)</h2><p lang="es">${rich(c.descEs)}</p>
      <h2>Reading the character</h2><p>${rich(c.descEn)}</p>
      <h2>Age & lifespan</h2><p>${rich(c.ages)}</p>
      <h2>Relationships</h2><ul>${(c.relations || []).map(([rid, rel]) => charById[rid] ? `<li>${charChip(rid)}: ${esc(rel)}</li>` : '').join('')}</ul>
      <h2>Appears in</h2><p class="chips">${(c.chapters || []).map(n => `<a class="chip" href="#/ch/${n}" style="border-color:${chapter(n).color}">Ch. ${n}</a>`).join(' ')}</p>
      ${c.motif ? `<h2>Linked motif</h2><p class="chips">${motifChip(c.motif)}</p>` : ''}
      ${c.tree ? `<p><a class="btn" href="#/tree?id=${c.id}">Show on the family tree</a></p>` : ''}
    </article>`;
  }

  // ---- Family tree ----------------------------------------------------
  let TREE_SCALE = 1;
  function viewTree(q) {
    const sel = q.get('id') || '';
    return `<article class="section tree-page"><h1 tabindex="-1">The Buendía family tree</h1>
      <p class="lede">Seven generations. Select a person to see their relations and portrait; lines show births, marriages and unions.</p>
      <div class="tree-tools" role="group" aria-label="Tree zoom">
        <button type="button" class="btn btn-sm" data-action="tree-zoom" data-z="out" aria-label="Zoom out">−</button>
        <button type="button" class="btn btn-sm" data-action="tree-zoom" data-z="fit">Show all</button>
        <button type="button" class="btn btn-sm" data-action="tree-zoom" data-z="in" aria-label="Zoom in">+</button>
        <span class="legend"><span class="lg lg-birth"></span>child of <span class="lg lg-marriage"></span>marriage <span class="lg lg-union"></span>union <span class="lg lg-adopted"></span>adopted <span class="lg lg-incest"></span>aunt & nephew</span>
      </div>
      <div class="tree-layout">
        <div class="tree-scroll" id="tree-scroll" tabindex="0" aria-label="Family tree diagram, scrollable">${treeSvg(sel)}</div>
        <aside class="tree-panel card" id="tree-panel" aria-live="polite">${treePanel(sel)}</aside>
      </div>
      <section class="section"><h2>The family as a list</h2>
        ${B.generations.map(g => `<h3>${esc(g.label)}</h3><p class="chips">${g.ids.map(charChip).join(' ')}</p>`).join('')}
        <h3>Partners and parents from outside the bloodline</h3><p class="chips">${['pilar-ternera', 'santa-sofia', 'remedios-moscote', 'fernanda', 'petra-cotes', 'mauricio-babilonia', 'gaston'].map(charChip).join(' ')}</p>
      </section>
      <section class="section prose"><h2>The family arc</h2>${rich(B.familyArc)}</section>
    </article>`;
  }
  const NODE_W = 160, NODE_H = 50;
  function treeSvg(sel) {
    const nodes = CHARS.filter(c => c.tree);
    const pos = Object.fromEntries(nodes.map(c => [c.id, c.tree]));
    const related = sel ? relatedSet(sel) : null;
    let edges = '';
    // union lines
    C.treeUnions.forEach(([a, b, type]) => {
      if (type === 'none' || !pos[a] || !pos[b]) return;
      const A = pos[a], Bp = pos[b];
      const cls = `edge edge-${type}${related && !(related.has(a) && related.has(b)) ? ' dim' : ''}`;
      if (type === 'incest') {
        const left = A.x < Bp.x ? A : Bp, right = A.x < Bp.x ? Bp : A;
        edges += `<path class="${cls}" d="M${left.x + NODE_W / 2} ${left.y} H${right.x} V${right.y + NODE_H / 2}"/>`;
        return;
      }
      if (A.y === Bp.y) {
        const lo = Math.min(A.x, Bp.x), hi = Math.max(A.x, Bp.x);
        const between = nodes.some(n => n.tree.y === A.y && n.tree.x > lo && n.tree.x < hi);
        if (between) {
          const y = A.y - NODE_H / 2;
          edges += `<path class="${cls}" d="M${lo} ${y} C${lo} ${y - 40}, ${hi} ${y - 40}, ${hi} ${y}"/>`;
        } else {
          edges += `<path class="${cls}" d="M${lo + NODE_W / 2} ${A.y} H${hi - NODE_W / 2}"/>`;
        }
      }
    });
    // parent -> child lines
    C.treeEdges.forEach(([pa, pb, ch, type]) => {
      if (!pos[pa] || !pos[ch]) return;
      const A = pos[pa], Bp = pb ? pos[pb] : null, K = pos[ch];
      let mx, my;
      const incestPair = C.treeUnions.find(u => u[2] === 'incest' && ((u[0] === pa && u[1] === pb) || (u[0] === pb && u[1] === pa)));
      if (incestPair) { const left = A.x < Bp.x ? A : Bp, right = A.x < Bp.x ? Bp : A; mx = (left.x + NODE_W / 2 + right.x) / 2; my = left.y; }
      else if (Bp) { mx = (A.x + Bp.x) / 2; my = A.y; }
      else { mx = A.x; my = A.y + NODE_H / 2; }
      const top = K.y - NODE_H / 2;
      const midY = (my + top) / 2 + (incestPair ? 20 : 0);
      const cls = `edge edge-${type === 'adopted' ? 'adopted' : 'birth'}${related && !(related.has(ch) && (related.has(pa) || related.has(pb))) ? ' dim' : ''}`;
      edges += `<path class="${cls}" d="M${mx} ${my} V${midY} H${K.x} V${top}"/>`;
    });
    const boxes = nodes.map(c => {
      const { x, y } = c.tree;
      const lines = wrapName(c.name);
      const cls = `node node-${c.group}${sel === c.id ? ' selected' : ''}${related && !related.has(c.id) ? ' dim' : ''}`;
      return `<g class="${cls}" data-action="tree-select" data-id="${c.id}" tabindex="0" role="button" aria-label="${esc(c.name)}, ${esc(c.role)}" aria-pressed="${sel === c.id}">
        <rect x="${x - NODE_W / 2}" y="${y - NODE_H / 2}" width="${NODE_W}" height="${NODE_H}" rx="10"/>
        ${lines.map((l, i) => `<text x="${x}" y="${y + (lines.length === 1 ? 5 : (i === 0 ? -3 : 13))}" text-anchor="middle">${esc(l)}</text>`).join('')}
      </g>`;
    }).join('');
    const gens = [[70, 'I'], [230, 'II'], [400, 'III'], [570, 'IV'], [740, 'V'], [900, 'VI'], [1050, 'VII']]
      .map(([y, l]) => `<text x="14" y="${y + 5}" class="gen-label">${l}</text>`).join('');
    const W = 1300 * TREE_SCALE, H = 1110 * TREE_SCALE;
    return `<svg id="tree-svg" class="tree" viewBox="0 0 1300 1110" width="${W}" height="${H}" role="group" aria-label="Family tree">${gens}<g>${edges}</g><g>${boxes}</g></svg>`;
  }
  function wrapName(name) {
    if (name.length <= 18) return [name];
    const words = name.split(' ');
    let a = '';
    while (words.length && (a + ' ' + words[0]).trim().length <= 18) a = (a + ' ' + words.shift()).trim();
    const b = words.join(' ');
    return [a, b.length > 20 ? b.slice(0, 19) + '…' : b];
  }
  function relatedSet(id) {
    const s = new Set([id]);
    C.treeEdges.forEach(([a, b, c]) => {
      if (c === id) { s.add(a); if (b) s.add(b); }
      if (a === id || b === id) s.add(c);
    });
    C.treeUnions.forEach(([a, b, t]) => { if (t === 'none') return; if (a === id) s.add(b); if (b === id) s.add(a); });
    return s;
  }
  function treePanel(id) {
    const c = charById[id];
    if (!c) return `<h2>Select a person</h2><p>Choose any box in the tree (or press Tab to move through them and Enter to select). The related people stay bright and the rest fade.</p><p class="muted small">Tip: the tree scrolls sideways on small screens.</p>`;
    return `<p class="eyebrow">${c.group === 'other' ? 'Macondo' : 'Generation ' + c.gen}</p><h2 lang="es">${esc(c.name)}</h2><p class="muted">${esc(c.role)}</p>
      <p lang="es">${rich(c.descEs)}</p>
      <p><b>Age:</b> ${rich(c.ages)}</p>
      <ul class="rel-list">${(c.relations || []).filter(r => charById[r[0]]).map(([rid, rel]) => `<li>${charChip(rid)} <span class="muted">${esc(rel)}</span></li>`).join('')}</ul>
      <p><a class="btn btn-primary btn-sm" href="#/character/${c.id}">Full profile</a> <button type="button" class="btn btn-quiet btn-sm" data-action="tree-select" data-id="">Clear selection</button></p>`;
  }
  function selectTree(id) {
    const scroll = $('#tree-scroll'); if (!scroll) return;
    const sx = scroll.scrollLeft, sy = scroll.scrollTop;
    scroll.innerHTML = treeSvg(id);
    scroll.scrollLeft = sx; scroll.scrollTop = sy;
    $('#tree-panel').innerHTML = treePanel(id);
    const h = id ? '#/tree?id=' + id : '#/tree';
    if (location.hash !== h) history.replaceState(null, '', h);
    const node = id ? $(`#tree-svg [data-id="${id}"]`) : null;
    if (node) node.focus({ preventScroll: true });
  }
  function fitTree(all) {
    const scroll = $('#tree-scroll'); if (!scroll) return;
    const fit = (scroll.clientWidth - 8) / 1300;
    // Keep names readable by default (scroll sideways); 'Fit' shows everything.
    TREE_SCALE = all ? Math.max(0.3, Math.min(1.4, fit)) : Math.max(0.85, Math.min(1.2, fit));
  }

  // ---- Themes / philosophy / glossary / context / about ---------------------
  function viewThemes(q) {
    return `<article class="section"><h1 tabindex="-1">Themes, motifs & imagery</h1>
      <p class="lede">The ideas the novel returns to, and the images (in Spanish) that carry them.</p>
      <h2>Themes</h2>
      <div class="grid-2">${B.themes.map(t => `<section class="card theme" id="theme-${t.id}"><h3><span lang="es">${esc(t.es)}</span> <span class="muted">· ${esc(t.en)}</span></h3><p>${rich(t.text)}</p></section>`).join('')}</div>
      <h2>Motifs & symbols</h2>
      <div class="grid-3">${B.motifs.map(m => `<section class="card motif" id="motif-${m.id}">${icon(m.icon, 'icon icon-lg')}<h3><span lang="es">${esc(m.es)}</span> <span class="muted">· ${esc(m.en)}</span></h3><p lang="es">${rich(m.text)}</p>
        <p class="small">Follow it: ${m.cites.map(cc => { const [a, b] = cc.split(':'); return citeLink(a, b); }).join(' · ')}</p></section>`).join('')}</div>
    </article>`;
  }
  function viewPhilosophy() {
    return `<article class="section"><h1 tabindex="-1">The philosophy of the book</h1>
      <p class="lede">Questions to think with, key passages to reread, and paper ideas for going deeper.</p>
      ${B.philosophy.map((p, i) => `<section class="card phil" id="phil-${p.id}"><h2>${esc(p.title)}</h2><p>${rich(p.body)}</p>
        <h3>Questions</h3>${questionList(p.questions, { ch: i, set: 'phil' })}
        <p class="paper">${icon('note', 'icon icon-sm')} ${rich(p.paper)}</p></section>`).join('')}
      <div id="note-editor-slot"></div>
    </article>`;
  }
  function viewGlossary() {
    return `<article class="section"><h1 tabindex="-1">Key terms & etymologies</h1>
      <label class="label" for="gloss-search">Filter terms</label><input id="gloss-search" type="search" class="input" placeholder="Search Spanish or English…">
      <div class="table-wrap"><table class="terms" id="gloss-table"><thead><tr><th scope="col">Español</th><th scope="col">English</th><th scope="col">Etymology & note</th></tr></thead><tbody>
      ${B.glossary.slice().sort((a, b) => a.es.localeCompare(b.es, 'es')).map(g => `<tr data-text="${esc(norm(g.es + ' ' + g.en))}"><th scope="row" lang="es">${esc(g.es)}</th><td>${esc(g.en)}</td><td>${rich(g.ety)}</td></tr>`).join('')}
      </tbody></table></div>
      <h2>Terms by chapter</h2><p>Each chapter and stop also has its own list of key terms.</p>
      <p class="chips">${CH.map(c => `<a class="chip" href="#/ch/${c.n}#terms" style="border-color:${c.color}">Ch. ${c.n}</a>`).join(' ')}</p>
    </article>`;
  }
  function viewContext() {
    return `<article class="section prose narrow"><h1 tabindex="-1">Historical & literary context</h1>${rich(B.context)}
      <h2>Timeline of the story</h2><ol class="timeline">${B.timeline.map(t => `<li><b>${esc(t.when)}</b> ${rich(t.what)}</li>`).join('')}</ol></article>`;
  }
  function viewAbout() {
    return `<article class="section prose narrow"><h1 tabindex="-1">About this reading</h1>
      <p><b>Cien años · Lectura profunda</b> was made by readers and lovers of books for readers who want to go slowly: an interactive close reading of Gabriel García Márquez's novel, written mainly for English speakers who also read Spanish.</p>
      <p>The commentary, summaries, questions and Spanish descriptions of imagery and characters are original. Quotations from the novel are kept brief and are used for commentary and study. The novel itself is <b>not</b> reproduced on this site: to read the full text alongside the commentary, you load your own copy, which is processed only in your browser.</p>
      <h2>How citations work</h2>
      <p>Citations follow the Harvard author–date system with a precise locator. E-books have no stable page numbers, so the locator is the paragraph within the chapter, for example ${esc(citeText(15, 25))}. Paragraph numbers appear in the margin of the text when your book is loaded. If your edition splits paragraphs differently, the stop boundaries adjust automatically, but paragraph numbers may differ slightly from the commentary.</p>
      <h2>Reference list</h2>
      <p class="ref">${B.reference}</p>
      <h2>Further reading</h2>
      <ul class="refs">
        <li>Bell-Villada, G. H. (ed.) (2002) <i>Gabriel García Márquez's One Hundred Years of Solitude: A Casebook</i>. Oxford: Oxford University Press.</li>
        <li>Martin, G. (2008) <i>Gabriel García Márquez: A Life</i>. London: Bloomsbury.</li>
        <li>Paz, O. (1950) <i>El laberinto de la soledad</i>. México: Cuadernos Americanos.</li>
        <li>Vargas Llosa, M. (1971) <i>García Márquez: historia de un deicidio</i>. Barcelona: Barral.</li>
        <li>García Márquez, G. (2002) <i>Vivir para contarla</i>. Barcelona: Mondadori.</li>
        <li>LeGrand, C. (1986) <i>Frontier Expansion and Peasant Protest in Colombia, 1850–1936</i>. Albuquerque: University of New Mexico Press.</li>
      </ul>
      <h2>Privacy</h2><p>No accounts, no tracking. Your book, notes, highlights and reading progress are stored only in this browser. Export your notebook to keep a copy.</p>
    </article>`;
  }

  // ---- Library ---------------------------------------------------------
  function viewLibrary() {
    let status = '';
    if (BOOK) {
      const counts = BOOK.chapters.map((c, i) => ({ n: i + 1, got: c.length, exp: B.expectedParas[i] }));
      const total = counts.reduce((a, c) => a + c.got, 0);
      const mismatch = counts.filter(c => c.got !== c.exp);
      status = `<section class="card ok-card"><h2>${icon('book', 'icon icon-sm')} Your book is loaded</h2>
        <p><b>${esc(BOOK.meta.title)}</b><br><span class="muted small">${esc(BOOK.meta.file)} · loaded ${new Date(BOOK.meta.loadedAt).toLocaleString()}</span></p>
        <p>${BOOK.meta.found} of 20 chapters recognised · ${total} paragraphs.</p>
        ${mismatch.length ? `<p class="warn">Your edition's paragraph count differs from the commentary's reference edition in ${mismatch.length} chapter(s). Stops are aligned automatically by their opening words; paragraph numbers in citations may be off by a few.</p>` : `<p class="good">Paragraph numbering matches the commentary exactly.</p>`}
        <details><summary>Paragraphs per chapter</summary><ol class="counts">${counts.map(c => `<li><a href="#/ch/${c.n}/1">Ch. ${c.n}</a>: ${c.got}${c.got !== c.exp ? ` <span class="muted">(reference ${c.exp})</span>` : ' ✓'}</li>`).join('')}</ol></details>
        <p><a class="btn btn-primary" href="#/ch/1/1">Start reading</a> <button type="button" class="btn btn-quiet" data-action="book-remove">Remove the book from this device</button></p></section>`;
    }
    return `<article class="section narrow"><h1 tabindex="-1">Your book</h1>
      <p class="lede">Load your EPUB of <i>Cien años de soledad</i> to read the full Spanish text inside every stop, and to highlight and quote it.</p>
      ${status}
      <section class="card">
        <h2>${BOOK ? 'Replace with another file' : 'Load your EPUB'}</h2>
        <div class="dropzone" id="dropzone">
          <p>Drop the .epub file here, or</p>
          <label class="btn btn-primary" for="epub-input">Choose file…</label>
          <input id="epub-input" class="visually-hidden" type="file" accept=".epub,application/epub+zip">
          <p class="muted small" id="epub-status" role="status" aria-live="polite"></p>
        </div>
        <p class="small"><b>Private by design:</b> the file is opened with JavaScript in this browser tab and stored in this browser's storage on your device. It is never uploaded. Any Spanish edition should work; the site finds the twenty chapters by their opening words.</p>
      </section>
    </article>`;
  }
  async function handleEpubFile(file) {
    const st = $('#epub-status');
    const say = m => { if (st) st.textContent = m; };
    if (!file) return;
    if (!/\.epub$/i.test(file.name) && file.type !== 'application/epub+zip') { say('Please choose an .epub file.'); return; }
    try {
      const b = await parseEpub(file, say);
      say('Saving on this device…');
      try { await idb.put('book', b); } catch (e) { toast('Loaded for this session only: browser storage is unavailable.'); }
      setBook(b);
      toast(`Book loaded: ${b.meta.found} chapters recognised.`);
      rerender();
    } catch (e) {
      console.error(e);
      say('Could not load: ' + (e && e.message ? e.message : e));
    }
  }

  // ---- Notebook ----------------------------------------------------------
  function viewNotebook(q) {
    const fch = q.get('ch') || '';
    const term = norm(q.get('q') || '');
    let notes = NOTES.slice();
    if (fch) notes = notes.filter(x => String(x.ch) === fch);
    if (term) notes = notes.filter(x => norm(x.body + ' ' + (x.quote ? x.quote.es : '') + ' ' + (x.question || '')).includes(term));
    notes.sort((a, b) => a.ch - b.ch || (a.sub || 0) - (b.sub || 0) || (a.created || '').localeCompare(b.created || ''));
    let hls = HLS.slice().sort((a, b) => a.ch - b.ch || a.p - b.p || a.start - b.start);
    if (fch) hls = hls.filter(h => String(h.ch) === fch);
    return `<article class="section"><h1 tabindex="-1">Notebook</h1>
      <p class="lede">${NOTES.length} notes · ${HLS.length} highlights. Everything is saved in this browser.</p>
      <div class="row wrap notebook-tools">
        <button type="button" class="btn" data-action="export-md">Export Markdown</button>
        <button type="button" class="btn" data-action="export-json">Export backup (JSON)</button>
        <label class="btn" for="import-input">Import backup file…</label><input id="import-input" class="visually-hidden" type="file" accept=".json,application/json">
        <button type="button" class="btn btn-quiet danger" data-action="clear-notes">Delete everything…</button>
      </div>
      <div id="export-panel"></div>
      <details class="card"><summary>Import by pasting a backup</summary>
        <label class="label" for="import-text">Paste the text of a JSON backup</label>
        <textarea id="import-text" rows="4" placeholder='{"app":"cien-anos-lectura", …}'></textarea>
        <p><button type="button" class="btn btn-sm" data-action="import-paste">Import pasted backup</button></p>
      </details>
      <form class="row wrap filters" id="nb-filter" role="search">
        <label class="label" for="nb-ch">Chapter</label>
        <select id="nb-ch" class="input"><option value="">All chapters</option>${CH.map(c => `<option value="${c.n}" ${fch === String(c.n) ? 'selected' : ''}>${c.n}. ${esc(c.titleEs)}</option>`).join('')}</select>
        <label class="label" for="nb-q">Search</label><input id="nb-q" class="input" type="search" value="${esc(q.get('q') || '')}" placeholder="Search your notes…">
        <button type="submit" class="btn btn-sm">Filter</button>
      </form>
      <h2>Notes</h2>
      ${notes.length ? `<ul class="notes-list">${notes.map(x => noteCard(x, true)).join('')}</ul>` : `<p class="muted">No notes yet. Open any <a href="#/ch/1/1">stop</a> and write one.</p>`}
      <h2>Highlights</h2>
      ${hls.length ? `<ul class="hl-list">${hls.map(h => `<li class="card"><mark class="hl hl-${h.color}" lang="es">${esc(h.text)}</mark><p class="small">${citeLink(h.ch, h.p)}
        <button type="button" class="btn btn-quiet btn-sm" data-action="hl-remove" data-hid="${h.id}">Remove</button></p></li>`).join('')}</ul>` : '<p class="muted">No highlights yet. Select text in any stop to highlight it.</p>'}
      <div id="note-editor-slot"></div>
    </article>`;
  }
  function notebookMarkdown() {
    const lines = [`# ${B.titleEs}: notebook`, '', `Exported ${new Date().toLocaleString()}`, ''];
    CH.forEach(c => {
      const ns = NOTES.filter(x => x.ch === c.n);
      const hs = HLS.filter(h => h.ch === c.n);
      if (!ns.length && !hs.length) return;
      lines.push(`## Chapter ${c.n}: ${c.titleEs} (${c.titleEn})`, '');
      ns.sort((a, b) => (a.sub || 0) - (b.sub || 0)).forEach(x => {
        if (x.sub) lines.push(`### ${c.n}.${x.sub} ${c.subs[x.sub - 1].titleEs}`); else lines.push('### Whole chapter');
        if (x.question) lines.push(`**Question:** ${x.question}`, '');
        if (x.quote) lines.push(`> «${x.quote.es}» ${citeText(x.quote.ch || x.ch, x.quote.p)}`, '');
        lines.push(x.body, '');
      });
      if (hs.length) { lines.push('### Highlights', ''); hs.forEach(h => lines.push(`- «${h.text}» ${citeText(h.ch, h.p)}`)); lines.push(''); }
    });
    lines.push('## Reference', '', stripTags(B.reference));
    return lines.join('\n');
  }

  // ---- Search --------------------------------------------------------------
  function viewSearch(q) {
    const raw = q.get('q') || '';
    const term = norm(raw);
    let results = '';
    if (term.length >= 2) {
      const hits = [];
      CH.forEach(c => {
        if (norm(stripTags(c.summary) + ' ' + c.titleEs + ' ' + c.titleEn).includes(term)) hits.push({ href: `#/ch/${c.n}`, title: `Chapter ${c.n}: ${c.titleEs}`, kind: 'Commentary' });
        c.subs.forEach(s => {
          if (norm(stripTags(s.summary) + ' ' + s.titleEs + ' ' + s.titleEn + ' ' + s.imageryEs).includes(term)) hits.push({ href: `#/ch/${c.n}/${s.n}`, title: `${c.n}.${s.n} ${s.titleEs}`, kind: 'Commentary' });
        });
      });
      CHARS.forEach(ch => { if (norm(ch.name + ' ' + ch.role + ' ' + stripTags(ch.descEs) + ' ' + stripTags(ch.descEn)).includes(term)) hits.push({ href: `#/character/${ch.id}`, title: ch.name, kind: 'Character' }); });
      B.glossary.forEach(g => { if (norm(g.es + ' ' + g.en).includes(term)) hits.push({ href: '#/glossary', title: `${g.es}: ${g.en}`, kind: 'Glossary' }); });
      const textHits = [];
      if (BOOK) {
        BOOK.chapters.forEach((paras, i) => paras.forEach((p, j) => {
          if (textHits.length >= 150) return;
          const n = norm(p); const k = n.indexOf(term);
          if (k >= 0) {
            const sub = BOOK.ranges[i].findIndex(r => j >= r[0] && j <= r[1]) + 1 || 1;
            const start = Math.max(0, k - 70);
            textHits.push({ ch: i + 1, p: j + 1, sub, snippet: (start > 0 ? '…' : '') + p.slice(start, start + 200) + '…' });
          }
        }));
      }
      results = `<p class="muted">${hits.length} commentary results${BOOK ? ` · ${textHits.length}${textHits.length >= 150 ? '+' : ''} passages in your book` : ' · load your book to search the novel itself'}</p>
        <ul class="search-results">${hits.slice(0, 120).map(h => `<li><span class="tag">${h.kind}</span> <a href="${h.href}" lang="es">${esc(h.title)}</a></li>`).join('')}</ul>
        ${textHits.length ? `<h2>In the novel</h2><ul class="search-results">${textHits.map(t => `<li><a href="#/ch/${t.ch}/${t.sub}?p=${t.p}">${esc(citeText(t.ch, t.p))}</a><p lang="es" class="small">${esc(t.snippet)}</p></li>`).join('')}</ul>` : ''}`;
    }
    return `<article class="section narrow"><h1 tabindex="-1">Search</h1>
      <form id="search-form" role="search" class="row"><label class="visually-hidden" for="search-q">Search</label><input id="search-q" class="input" type="search" value="${esc(raw)}" placeholder="e.g. hielo, mariposas, Úrsula, massacre…"><button class="btn btn-primary" type="submit">Search</button></form>
      ${results}</article>`;
  }

  function viewNotFound() {
    return `<article class="section narrow"><h1 tabindex="-1">Page not found</h1><p>That page does not exist. <a href="#/">Go home</a>.</p></article>`;
  }

  // ------------------------------------------------------------------
  // Router
  // ------------------------------------------------------------------
  function parseHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
  }
  let CURRENT = '';
  function route() {
    hideToolbar();
    EDITOR = null;
    const { parts, q } = parseHash();
    const [a, b, c] = parts;
    let html, after = null;
    if (!a) html = viewHome();
    else if (a === 'guide') html = viewGuide();
    else if (a === 'structure') html = viewStructure();
    else if (a === 'chapters') html = viewChapters();
    else if (a === 'ch' && b && c) { html = viewSub(+b, +c, q); after = () => afterSub(q); }
    else if (a === 'ch' && b) html = viewChapter(+b);
    else if (a === 'characters') { html = viewCharacters(q); after = afterCharacters; }
    else if (a === 'character' && b) html = viewCharacter(b);
    else if (a === 'tree') { html = null; after = () => afterTree(q); }
    else if (a === 'themes') { html = viewThemes(q); after = () => { const id = q.get('m') ? 'motif-' + q.get('m') : q.get('t') ? 'theme-' + q.get('t') : ''; if (id) scrollToId(id); }; }
    else if (a === 'philosophy') html = viewPhilosophy();
    else if (a === 'glossary') { html = viewGlossary(); after = afterGlossary; }
    else if (a === 'context') html = viewContext();
    else if (a === 'about') html = viewAbout();
    else if (a === 'library') { html = viewLibrary(); after = afterLibrary; }
    else if (a === 'notebook') { html = viewNotebook(q); after = afterNotebook; }
    else if (a === 'search') { html = viewSearch(q); after = afterSearch; }
    else html = viewNotFound();
    const main = $('#main');
    if (html !== null) main.innerHTML = html;
    else main.innerHTML = '';
    if (after) after();
    const key = parts.join('/');
    const sameView = key === CURRENT;
    CURRENT = key;
    setActiveNav(a || '');
    closeMenu();
    const h1 = $('#main h1');
    document.title = (h1 ? h1.textContent.trim() + ' · ' : '') + 'Cien años · Lectura profunda';
    if (!q.get('p') && !(a === 'themes' && (q.get('m') || q.get('t'))) && !sameView) {
      window.scrollTo(0, 0);
      if (h1) h1.focus({ preventScroll: true });
    }
  }
  function rerender(keepScroll) {
    const y = window.scrollY;
    const { parts } = parseHash();
    CURRENT = parts.join('/');
    route();
    if (keepScroll) window.scrollTo(0, y);
  }
  function setActiveNav(a) {
    const map = { '': 'home', ch: 'chapters', chapters: 'chapters', structure: 'chapters', character: 'characters', characters: 'characters', tree: 'tree', themes: 'themes', philosophy: 'philosophy', notebook: 'notebook', library: 'library' };
    const active = map[a] || '';
    $$('.nav a').forEach(el => { if (el.dataset.nav === active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  }
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1800); }
  }
  function afterSub(q) {
    const p = q.get('p');
    if (p) setTimeout(() => {
      const el = document.getElementById('p' + p);
      if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2200); }
      else scrollToId('passages');
    }, 30);
  }
  function afterCharacters() {
    const inp = $('#char-search'); if (!inp) return;
    inp.addEventListener('input', () => {
      const t = norm(inp.value);
      $$('#char-grid li').forEach(li => { li.hidden = t && !li.dataset.text.includes(t); });
    });
  }
  function afterGlossary() {
    const inp = $('#gloss-search'); if (!inp) return;
    inp.addEventListener('input', () => {
      const t = norm(inp.value);
      $$('#gloss-table tbody tr').forEach(tr => { tr.hidden = t && !tr.dataset.text.includes(t); });
    });
  }
  function afterTree(q) {
    const main = $('#main');
    TREE_SCALE = 1;
    main.innerHTML = viewTree(q);
    fitTree();
    const sel = q.get('id') || '';
    $('#tree-scroll').innerHTML = treeSvg(sel);
    if (sel) {
      const node = $(`#tree-svg [data-id="${sel}"]`);
      const scroll = $('#tree-scroll');
      if (node && scroll) {
        const c = charById[sel].tree;
        scroll.scrollLeft = Math.max(0, c.x * TREE_SCALE - scroll.clientWidth / 2);
        scroll.scrollTop = Math.max(0, c.y * TREE_SCALE - scroll.clientHeight / 2);
      }
    }
  }
  function afterLibrary() {
    const inp = $('#epub-input');
    if (inp) inp.addEventListener('change', () => handleEpubFile(inp.files[0]));
    const dz = $('#dropzone');
    if (dz) {
      ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
      dz.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleEpubFile(f); });
    }
  }
  function afterNotebook() {
    const form = $('#nb-filter');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const ch = $('#nb-ch').value, qq = $('#nb-q').value.trim();
      const p = new URLSearchParams(); if (ch) p.set('ch', ch); if (qq) p.set('q', qq);
      location.hash = '#/notebook' + (p.toString() ? '?' + p.toString() : '');
    });
    const sel = $('#nb-ch'); if (sel) sel.addEventListener('change', () => form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')));
    const imp = $('#import-input');
    if (imp) imp.addEventListener('change', async () => {
      const f = imp.files[0]; if (!f) return;
      importBackup(await f.text());
    });
  }
  function importBackup(text) {
    try {
      const data = JSON.parse(text);
      const ns = Array.isArray(data.notes) ? data.notes : [];
      const hs = Array.isArray(data.highlights) ? data.highlights : [];
      const nIds = new Set(NOTES.map(x => x.id)); const hIds = new Set(HLS.map(x => x.id));
      let added = 0;
      ns.forEach(x => { if (x && x.id && typeof x.ch === 'number' && !nIds.has(x.id)) { NOTES.push(x); added++; } });
      hs.forEach(x => { if (x && x.id && typeof x.ch === 'number' && !hIds.has(x.id)) { HLS.push(x); added++; } });
      if (data.read && typeof data.read === 'object') Object.assign(READ, data.read);
      saveNotes(); saveHls(); saveRead();
      toast(`Imported ${added} items.`); rerender();
    } catch (e) { toast('That is not a valid notebook backup. Check that you copied the whole text.'); }
  }
  // In-page confirmation (browser confirm() dialogs are blocked in some embedded viewers).
  function askConfirm(message, okLabel) {
    return new Promise(resolve => {
      const prev = document.activeElement;
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `<div class="modal card" role="alertdialog" aria-modal="true" aria-labelledby="modal-msg">
        <p id="modal-msg">${esc(message)}</p>
        <div class="row wrap"><button type="button" class="btn btn-primary danger-bg" data-m="ok">${esc(okLabel || 'Confirm')}</button>
        <button type="button" class="btn" data-m="cancel">Cancel</button></div></div>`;
      const done = v => { wrap.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); resolve(v); };
      const onKey = e => {
        if (e.key === 'Escape') { e.stopPropagation(); done(false); }
        if (e.key === 'Tab') { const b = $$('button', wrap); const i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length].focus(); }
      };
      wrap.addEventListener('click', e => {
        e.stopPropagation();
        const m = e.target.closest('[data-m]');
        if (m) done(m.dataset.m === 'ok'); else if (e.target === wrap) done(false);
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(wrap);
      $('[data-m="cancel"]', wrap).focus();
    });
  }
  // Export: show the text with Copy and Download (downloads are blocked in some embedded viewers).
  let EXPORT = null;
  function showExport(name, text, type, label) {
    EXPORT = { name, text, type };
    const p = $('#export-panel'); if (!p) return;
    p.innerHTML = `<section class="card"><h2>${esc(label)}</h2>
      <p class="small muted">Copy this text and keep it somewhere safe, or download it as a file. To restore a backup, use Import.</p>
      <label class="visually-hidden" for="export-text">${esc(label)} text</label>
      <textarea id="export-text" rows="10" readonly>${esc(text)}</textarea>
      <p class="row wrap"><button type="button" class="btn btn-primary" data-action="export-copy">Copy to clipboard</button>
      <button type="button" class="btn" data-action="export-download">Download ${esc(name)}</button>
      <button type="button" class="btn btn-quiet" data-action="export-close">Close</button></p></section>`;
    p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function afterSearch() {
    const f = $('#search-form'); if (!f) return;
    f.addEventListener('submit', e => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent($('#search-q').value.trim()); });
    const inp = $('#search-q'); if (inp && !inp.value) inp.focus();
  }

  // ------------------------------------------------------------------
  // Selection toolbar & highlights
  // ------------------------------------------------------------------
  const toolbar = () => $('#sel-toolbar');
  let SEL_CTX = null; // {mode:'new', parts:[{ch,p,start,end,text}]} | {mode:'hl', hid}
  function textOffset(root, node, offset) {
    let total = 0;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n === node) return total + offset;
      total += n.nodeValue.length;
    }
    // node is an element: offset counts child nodes
    if (node.nodeType === 1) {
      let t = 0; const kids = node.childNodes;
      for (let i = 0; i < offset && i < kids.length; i++) t += (kids[i].textContent || '').length;
      const pre = document.createRange(); pre.setStart(root, 0); pre.setEnd(node, 0);
      return pre.toString().length + t;
    }
    return total;
  }
  function selectionParts() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    const reader = $('.reader');
    if (!reader || !reader.contains(range.commonAncestorContainer)) return null;
    const parts = [];
    $$('.ptext', reader).forEach(el => {
      if (!range.intersectsNode(el)) return;
      const len = el.textContent.length;
      const start = el.contains(range.startContainer) ? textOffset(el, range.startContainer, range.startOffset) : 0;
      const end = el.contains(range.endContainer) ? textOffset(el, range.endContainer, range.endOffset) : len;
      if (end > start) parts.push({ ch: +el.dataset.ch, p: +el.dataset.p, start, end, text: el.textContent.slice(start, end) });
    });
    return parts.length ? parts : null;
  }
  function showToolbarAt(rect, mode) {
    const tb = toolbar();
    tb.innerHTML = (mode === 'hl'
      ? `<span class="tb-label">Highlight</span>${HL_COLORS.map(c => `<button type="button" class="swatch sw-${c.id}" data-action="hl-color" data-color="${c.id}" aria-label="Change colour to ${c.label}" title="${c.label}"></button>`).join('')}
         <button type="button" class="tb-btn" data-action="hl-note">Note</button><button type="button" class="tb-btn" data-action="hl-copy">Copy</button><button type="button" class="tb-btn" data-action="hl-delete">Remove</button>`
      : `<span class="tb-label">Highlight</span>${HL_COLORS.map(c => `<button type="button" class="swatch sw-${c.id}" data-action="hl-color" data-color="${c.id}" aria-label="Highlight in ${c.label}" title="${c.label}"></button>`).join('')}
         <button type="button" class="tb-btn" data-action="hl-note">Note</button><button type="button" class="tb-btn" data-action="hl-copy">Copy with citation</button>`)
      + `<button type="button" class="tb-btn tb-close" data-action="tb-close" aria-label="Close toolbar">×</button>`;
    tb.hidden = false;
    const w = tb.offsetWidth, h = tb.offsetHeight;
    let x = rect.left + rect.width / 2 - w / 2 + window.scrollX;
    x = Math.max(window.scrollX + 8, Math.min(x, window.scrollX + document.documentElement.clientWidth - w - 8));
    let y = rect.top + window.scrollY - h - 10;
    if (rect.top < h + 70) y = rect.bottom + window.scrollY + 10;
    tb.style.left = x + 'px'; tb.style.top = y + 'px';
  }
  function hideToolbar() { const tb = toolbar(); if (tb) tb.hidden = true; SEL_CTX = null; }
  const onSelectionChange = debounce(() => {
    const parts = selectionParts();
    if (!parts) { if (SEL_CTX && SEL_CTX.mode === 'new') hideToolbar(); return; }
    SEL_CTX = { mode: 'new', parts };
    const r = window.getSelection().getRangeAt(0).getBoundingClientRect();
    showToolbarAt(r, 'new');
  }, 200);
  function applyHighlight(color) {
    if (!SEL_CTX) return;
    if (SEL_CTX.mode === 'hl') {
      const h = HLS.find(x => x.id === SEL_CTX.hid); if (h) { h.color = color; saveHls(); }
    } else {
      const now = new Date().toISOString();
      SEL_CTX.parts.forEach(p => HLS.push({ id: uid(), ch: p.ch, p: p.p, start: p.start, end: p.end, text: p.text, color, created: now }));
      saveHls();
      toast('Highlighted.');
    }
    const sel = window.getSelection(); if (sel) sel.removeAllRanges();
    hideToolbar(); refreshReader();
  }
  function refreshReader() {
    const art = $('article.sub'); if (!art) return;
    const reader = $('.reader'); if (!reader) return;
    const n = +art.dataset.ch, sn = +art.dataset.sub;
    const tmp = document.createElement('div'); tmp.innerHTML = renderReader(n, sn);
    reader.replaceWith(tmp.querySelector('.reader'));
  }
  function selectionAsQuote() {
    if (!SEL_CTX) return null;
    if (SEL_CTX.mode === 'hl') {
      const h = HLS.find(x => x.id === SEL_CTX.hid); if (!h) return null;
      return { es: h.text.trim(), ch: h.ch, p: h.p, auto: false, hid: h.id };
    }
    const parts = SEL_CTX.parts;
    return { es: parts.map(p => p.text).join(' ').replace(/\s+/g, ' ').trim(), ch: parts[0].ch, p: parts[0].p, auto: false };
  }

  // ------------------------------------------------------------------
  // Global event delegation
  // ------------------------------------------------------------------
  document.addEventListener('click', async e => {
    const mark = e.target.closest('mark.hl[data-hid]');
    if (mark && mark.closest('.reader') && !e.target.closest('[data-action]')) {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      SEL_CTX = { mode: 'hl', hid: mark.dataset.hid };
      showToolbarAt(mark.getBoundingClientRect(), 'hl');
      return;
    }
    const scrollLink = e.target.closest('a[data-scroll]');
    if (scrollLink) { e.preventDefault(); scrollToId(scrollLink.getAttribute('href').slice(1)); return; }
    const t = e.target.closest('[data-action]');
    if (!t) {
      const tb = toolbar();
      if (tb && !tb.hidden && !tb.contains(e.target)) { const s = window.getSelection(); if (!s || s.isCollapsed) hideToolbar(); }
      return;
    }
    const act = t.dataset.action;
    switch (act) {
      case 'theme': PREFS.theme = t.dataset.value; savePrefs(); applyPrefs(); break;
      case 'size': PREFS.size = t.dataset.value; savePrefs(); applyPrefs(); break;
      case 'toggle-menu': toggleMenu(); break;
      case 'toggle-settings': { const p = $('#settings'); const open = p.hidden; p.hidden = !open; t.setAttribute('aria-expanded', String(open)); break; }
      case 'mark-read': {
        const k = subKey(t.dataset.ch, t.dataset.sub);
        READ[k] = !READ[k]; if (!READ[k]) delete READ[k]; saveRead();
        t.setAttribute('aria-pressed', String(!!READ[k])); t.textContent = READ[k] ? 'Read ✓' : 'Mark as read'; t.classList.toggle('btn-done', !!READ[k]);
        toast(READ[k] ? 'Marked as read.' : 'Marked as unread.');
        break;
      }
      case 'note-new': openEditor({ ch: +t.dataset.ch, sub: t.dataset.sub ? +t.dataset.sub : null }); break;
      case 'answer-q': {
        const set = t.dataset.qset, ch = +t.dataset.ch, sub = t.dataset.sub ? +t.dataset.sub : null;
        const qtext = questionsFor(set, ch, sub)[+t.dataset.qi] || '';
        if (set === 'phil') { openEditor({ ch: 1, sub: null, question: stripTags(rich(qtext)), phil: true }); break; }
        openEditor({ ch, sub, question: stripTags(rich(qtext)) });
        break;
      }
      case 'para-note': openEditor({ ch: +t.dataset.ch, sub: +t.dataset.sub, p: +t.dataset.p }); break;
      case 'note-cancel': { EDITOR = null; const s = $('#note-editor-slot'); if (s) s.innerHTML = ''; break; }
      case 'note-edit': {
        const x = NOTES.find(y => y.id === t.dataset.id); if (!x) break;
        if (!$('#note-editor-slot')) { location.hash = x.sub ? `#/ch/${x.ch}/${x.sub}` : `#/ch/${x.ch}`; setTimeout(() => openEditor({ id: x.id }), 60); }
        else openEditor({ id: x.id });
        break;
      }
      case 'note-delete': {
        if (!(await askConfirm('Delete this note? This cannot be undone.', 'Delete note'))) break;
        NOTES = NOTES.filter(y => y.id !== t.dataset.id); saveNotes(); toast('Note deleted.'); rerender(true); break;
      }
      case 'quote-next': if (EDITOR && EDITOR.candidates.length) { EDITOR.idx = (EDITOR.idx + 1) % EDITOR.candidates.length; renderSuggestion(); } break;
      case 'quote-remove': if (EDITOR) { EDITOR.removed = true; EDITOR.locked = false; renderSuggestion(); } break;
      case 'quote-restore': if (EDITOR) { EDITOR.removed = false; refreshSuggestions(); } break;
      case 'quote-unlock': if (EDITOR) { EDITOR.locked = false; EDITOR.removed = false; refreshSuggestions(); } break;
      case 'hl-color': applyHighlight(t.dataset.color); break;
      case 'hl-note': {
        const qte = selectionAsQuote(); if (!qte) break;
        const art = $('article.sub');
        if (SEL_CTX && SEL_CTX.mode === 'new') { // highlight too, so the passage stays marked
          const now = new Date().toISOString();
          SEL_CTX.parts.forEach(p => HLS.push({ id: uid(), ch: p.ch, p: p.p, start: p.start, end: p.end, text: p.text, color: 'yellow', created: now }));
          saveHls();
        }
        const s0 = window.getSelection(); if (s0) s0.removeAllRanges();
        hideToolbar(); refreshReader();
        openEditor({ ch: qte.ch, sub: art ? +art.dataset.sub : null, p: qte.p, locked: true, lockedQuote: { es: qte.es, ch: qte.ch, p: qte.p, auto: false }, hid: qte.hid || null });
        break;
      }
      case 'hl-copy': { const qte = selectionAsQuote(); if (qte) await copyText(`«${qte.es}» ${citeText(qte.ch, qte.p)}`); hideToolbar(); break; }
      case 'hl-delete': {
        if (SEL_CTX && SEL_CTX.mode === 'hl') { HLS = HLS.filter(h => h.id !== SEL_CTX.hid); saveHls(); toast('Highlight removed.'); }
        hideToolbar(); refreshReader(); break;
      }
      case 'hl-remove': HLS = HLS.filter(h => h.id !== t.dataset.hid); saveHls(); toast('Highlight removed.'); rerender(true); break;
      case 'tb-close': { const s = window.getSelection(); if (s) s.removeAllRanges(); hideToolbar(); break; }
      case 'export-md': showExport('cien-anos-notebook.md', notebookMarkdown(), 'text/markdown', 'Markdown'); break;
      case 'export-json': showExport('cien-anos-notebook.json', JSON.stringify({ app: 'cien-anos-lectura', version: 1, exported: new Date().toISOString(), notes: NOTES, highlights: HLS, read: READ }, null, 2), 'application/json', 'Backup (JSON)'); break;
      case 'export-copy': { const ta = $('#export-text'); if (ta) { try { await navigator.clipboard.writeText(ta.value); toast('Copied to clipboard.'); } catch (e3) { ta.focus(); ta.select(); toast('Press Ctrl+C (or ⌘C) to copy the selected text.'); } } break; }
      case 'export-download': if (EXPORT) download(EXPORT.name, EXPORT.text, EXPORT.type); break;
      case 'export-close': { const p = $('#export-panel'); if (p) p.innerHTML = ''; EXPORT = null; break; }
      case 'import-paste': {
        const ta = $('#import-text'); if (!ta || !ta.value.trim()) { toast('Paste a backup first.'); break; }
        importBackup(ta.value); break;
      }
      case 'clear-notes':
        if (await askConfirm('Delete ALL notes, highlights and reading progress on this device? Export a backup first if you want to keep them.', 'Delete everything')) {
          NOTES = []; HLS = []; READ = {}; saveNotes(); saveHls(); saveRead(); toast('Notebook cleared.'); rerender();
        }
        break;
      case 'book-remove':
        if (await askConfirm('Remove your book from this device? Your notes and highlights stay.', 'Remove book')) {
          try { await idb.del('book'); } catch (e2) { /* ignore */ }
          setBook(null); toast('Book removed from this device.'); rerender();
        }
        break;
      case 'tree-zoom': {
        const z = t.dataset.z;
        if (z === 'in') TREE_SCALE = Math.min(2, TREE_SCALE * 1.2);
        else if (z === 'out') TREE_SCALE = Math.max(0.3, TREE_SCALE / 1.2);
        else fitTree(true);
        const svg = $('#tree-svg'); if (svg) { svg.setAttribute('width', 1300 * TREE_SCALE); svg.setAttribute('height', 1110 * TREE_SCALE); }
        break;
      }
      case 'tree-select': selectTree(t.dataset.id || ''); break;
      default: break;
    }
  });
  // Keep the text selection when pressing toolbar buttons.
  document.addEventListener('pointerdown', e => { if (e.target.closest('#sel-toolbar')) e.preventDefault(); });
  document.addEventListener('mousedown', e => { if (e.target.closest('#sel-toolbar')) e.preventDefault(); });
  document.addEventListener('selectionchange', onSelectionChange);
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && (e.target.matches('g[data-action]') || e.target.matches('mark.hl[data-hid]'))) {
      e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (e.key === 'Escape') { hideToolbar(); closeMenu(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); location.hash = '#/search'; return; }
    if (e.key === 'ArrowRight' && $('#next-stop')) { location.hash = $('#next-stop').getAttribute('href'); }
    if (e.key === 'ArrowLeft' && $('#prev-stop')) { location.hash = $('#prev-stop').getAttribute('href'); }
  });
  window.addEventListener('resize', debounce(() => { if (toolbar() && !toolbar().hidden && SEL_CTX && SEL_CTX.mode === 'new') onSelectionChange(); }, 150));

  function toggleMenu() {
    const nav = $('#site-nav'), btn = $('#menu-btn');
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
  }
  function closeMenu() {
    const nav = $('#site-nav'), btn = $('#menu-btn');
    if (nav) nav.classList.remove('open'); if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  applyPrefs();
  window.addEventListener('hashchange', route);
  route();
  idb.get('book').then(b => {
    if (b && b.chapters) { setBook(b); rerender(true); }
  }).catch(() => { /* storage unavailable: reader can still load for this session */ });

  // Expose a tiny API for automated tests.
  window.__cien = { suggestQuotes, parseEpub, setBook, get book() { return BOOK; }, get notes() { return NOTES; }, get highlights() { return HLS; }, anchorKey, norm };
})();
