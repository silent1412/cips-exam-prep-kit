# CIPS Examination Preparation KIT

Interactive study companion for the Certified Interventional Pain Sonologist (CIPS)
examination (World Institute of Pain, Board of Examination), aligned with the official
CIPS Examination Information Bulletin.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Structure

| Route | Page | Content source |
|---|---|---|
| `/` | Home — overview, three parts, syllabus snapshot | — |
| `/introduction` | Exam format, scoring weights, eligibility, application | `src/data/exam.ts` |
| `/part-1` | MCQ practice player with topic filter | `src/content/part-1/*.json` |
| `/part-2a` | Practical procedure guides by region | `src/content/part-2a/*.json` |
| `/part-2b` | Oral viva cases by topic | `src/content/part-2b/*.json` |

## Adding content

Drop a batch JSON file (array of entries per `../content/CONTENT-CONTRACT.md`) into the
matching `src/content/part-*/` folder and rebuild/restart — files are bundled at build
time via `import.meta.glob` and deduplicated by entry `id`, so corrected batches can be
re-imported safely. Entry schema: `src/types/content.ts`. Syllabus topic IDs:
`src/data/syllabus.ts` (mirrors `../work/site-integration/topic-map.json`).

Seed file `src/content/part-1/sample-bulletin.json` contains the official bulletin
sample MCQs so the player is testable before authored batches arrive.

## Design tokens

Colors (HSL CSS variables) and fonts live in `src/index.css` + `tailwind.config.js`
(IBM Plex Sans body / IBM Plex Serif display; part-coded accents: Part 1 teal,
Part 2A copper, Part 2B plum). Centralized so the theme can be restyled later.
