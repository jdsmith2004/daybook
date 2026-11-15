/* The rating ask can never be dropped silently again (the owner, November 15, 2026: "it keeps asking them until they say they're
   enjoying the app that cannot be dropped"). It was lost once, in the setup rebuild of November 12, 2026, because nothing failed
   when its only caller went. This fails when nothing in the app asks the question, or nothing opens the rating sheet after it. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const src = join(dirname(fileURLToPath(import.meta.url)), '../../../apps/mobile/src');
const files: { name: string; text: string }[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f)) files.push({ name: relative(src, p), text: readFileSync(p, 'utf8') });
  }
};
walk(src);
/** the files that call fn(...), leaving out its own definition */
const callers = (fn: string) => files.filter((f) => new RegExp('(?<!function )\\b' + fn + '\\(').test(f.text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));

it('the app asks "Do you like Daybook so far?" somewhere (core likeAskDue)', () => {
  expect(callers('likeAskDue').length).toBeGreaterThan(0);
});

it('a Yes opens the rating sheet (askStoreReview) and the answer is kept (likeAnswer)', () => {
  expect(callers('askStoreReview').filter((f) => f.name !== 'lib/review.ts').length).toBeGreaterThan(0);
  expect(callers('likeAnswer').length).toBeGreaterThan(0);
});

it('the ask rides on the full-screen moments of earned value, where levels, forms and badges land', () => {
  const earned = files.find((f) => f.name === 'components/earned.tsx');
  expect(earned?.text).toMatch(/<LikeAsk(Night)?\b/);
});
