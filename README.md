# Cien años · Lectura profunda

A deep, bilingual close-reading companion to Gabriel García Márquez's *Cien años de soledad* (1967), written for English speakers who also read Spanish.

The site is static: open it, pick a chapter, and read slowly.

## What's inside

- **20 chapters, 117 stops.** Each chapter is divided into subsections ("stops") at natural turns in the narrative. Every chapter and stop has:
  - questions to ask yourself *before* reading;
  - a deep-reading summary with Harvard-style citations to the exact paragraph, e.g. *(García Márquez, 2017, ch. 15, para. 25)*;
  - imagery and descriptions written in Spanish (*Imágenes*);
  - key terms with glosses and etymologies;
  - key passages (brief quotations with English glosses);
  - "pause and reflect" questions, and end-of-chapter questions for the whole section;
  - how the stop connects to the one before and the one after.
- **Plot structure**: exposition, rising action, climax, falling action and denouement, with an interactive tension arc.
- **Characters**: 33 portraits in Spanish with English readings, ages and lifespans, relationships, and the chapters they appear in.
- **Interactive family tree**: seven generations. Select anyone to highlight their parents, children and partners.
- **Themes, motifs & imagery**, **philosophy** (questions, key passages and essay ideas), **glossary**, and **historical & literary context**.
- **Your notebook**: highlight text in four colours and write notes on any stop, paragraph or question. When you save a note, the site automatically attaches the quotation from that stop that best matches what you wrote. Notes can be exported as Markdown or JSON and imported again.

## Reading the full text: bring your own copy

The novel is under copyright, so **its text is not included in this repository.** On the *Your book* page, load your own EPUB of the novel. It is unzipped and parsed entirely in the browser, with no upload and no server, and stored in the browser's IndexedDB on your device. The site finds the twenty chapters in any Spanish edition by their opening words, and aligns each stop to its first sentence, so other editions work too. Paragraph numbers match the commentary exactly for the Literatura Random House illustrated edition (2017).

## Running it

Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Or publish the repository with GitHub Pages (Settings → Pages → deploy from branch, root folder). No build step is needed.

## Project layout

```
index.html                 page shell
assets/css/style.css       design (light and dark themes, print styles)
assets/js/app.js           router, EPUB reader, highlights, notes, auto-quotes, family tree, search
assets/js/data/book.js     structure, themes, motifs, philosophy, glossary, context, bilingual lexicon
assets/js/data/characters.js  characters and family-tree layout
assets/js/data/chNN.js     one file per chapter: commentary, stops, questions, terms, quotations
tests/validate-data.js     checks every citation, range, and cross-reference in the data
tests/e2e.js               Playwright end-to-end test (every page and button)
```

## Tests

```sh
node tests/validate-data.js
# end-to-end (needs Playwright and your own EPUB):
python3 -m http.server 8765 &
EPUB=/path/to/cien-anos.epub node tests/e2e.js
```

The end-to-end test visits every page, chapter, stop and character. It loads the EPUB, checks paragraph counts and stop alignment, then tests highlighting (including across paragraphs), notes, automatic quotations, editing and deleting, question answers, export and import, the family tree (mouse and keyboard), the theme and text-size settings, search and the mobile menu. It also checks that no page scrolls horizontally on a phone.

## Citation

Quotations and paragraph locators refer to:

García Márquez, G. (2017) *Cien años de soledad*. Illustrated edn. Illustrated by L. Rivera. Barcelona: Literatura Random House. [Originally published 1967].
