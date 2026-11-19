# CIPS Exam Hub

Interactive study hub for the Certified Interventional Pain Sonologist (CIPS) examination,
built from the CIPS MCQ Bank 1000, the CIPS Study Guide (with Practice MCQ volumes 1-2 and the
12-week reading plan) and the Mock Oral Exam Cases.

| Section | What it does |
|---|---|
| Overview | Readiness weighted like the exam (written 20%, practical 60%, oral 20%), where to focus next, this week's reading |
| Part 1 | 1,120 MCQs: custom practice sets, 100-question 2-hour mock exam, spaced-repetition review, mastery by domain, weakest keywords, a reading list built from your mistakes, search, flags |
| Part 2A | 34 procedure guides (target, position, sonoanatomy, technique, injectate, pearls, sources), 1-4 confidence ratings, recall mode, and a 4-station timed simulator with the 8-item examiner checklist |
| Part 2B | 12 mock oral cases: 5-minute vignette timer, the nine examiner questions, model answers, 1-4 self-scoring, weakest question area |
| 12-week plan | Week-by-week reading, scanning drills and tests, with check-off |

Progress is stored in the browser (localStorage). Use **Backup & reset** to export or import it.

## Run locally

No build step. Serve the folder over http:

```bash
python3 -m http.server 8000
```

## Regenerating the data

`data/mcq.json` and `data/guide.json` were extracted from the PDFs with the scripts in `tools/`
(`pdftotext -layout`, then `parse_mcq.py`, `parse_guide.py`, `finalize.py`).

Deployment: every push to `main` publishes the site with GitHub Pages (`.github/workflows/deploy.yml`).
