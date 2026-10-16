# The legacy app

`index.html` is the original Daybook: one file with the whole app, made to run as a Claude artifact. The artifact is retired and gets no more updates; this copy stays as the reference for the port. It is the source of truth for every rule (counting, run saves and Rekindle, step down, points, levels, badges, quests, lessons, setup) until the new app does everything it does.

The new app does not retype those rules. `tools/extract-legacy.mjs` copies the pure parts of this file into `packages/core/src/legacy/core.js`, and `packages/core/scripts/make-fixtures.mjs` runs this file in Chromium to record what it computes for many logs and moments, so the tests can check that the core gives exactly the same answers.

The sections the extractor copies are marked in the file:

- `/* ===== LOGIC: pure functions` up to `/* ===== STORE:`
- `/* ===== EMBLEM:` through `function sunSvg(`
- `/* ===== LESSONS:` up to `/* ---------- helpers ---------- */`
- `const OB_SECS=` up to `const obSrc=`, and `/* ---- what is kept:` up to `function obTool(`
- `const ICO={` through its closing `};`

Keep those markers when editing. If one moves, the extractor stops with "marker not found".
