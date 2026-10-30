/* The parts of "The look" (docs/design-standards.md) a machine can check: a screen that drifts back to half font sizes or capitals on
   small labels fails here. It reads the app's source. An exception is listed with its reason. The rest of the look is judged on a
   picture of the screen (docs/craft-checklist.md). */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = join(dirname(fileURLToPath(import.meta.url)), '../../../apps/mobile/src');
const files: string[] = [];
(function walk(d: string) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    /* the screenshot studio draws store pictures, not the app */
    if (statSync(p).isDirectory()) f !== 'shots' && walk(p);
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
})(src);
const read = (p: string) => ({ name: relative(src, p), text: readFileSync(p, 'utf8') });
const code = files.map(read);

const SIZES = new Set([11, 12, 13, 15, 17, 20, 22, 28, 34]);
/* a text box at 16 keeps iOS Safari from zooming in on it */
const SIZE_OK: Record<string, number[]> = { 'components/choices.tsx': [16] };
/* a code to type, the stamp in a picture, and a word that spreads out as it is said fast */
const SPACING_OK = ['app/account.tsx', 'components/talk-art.tsx', 'components/tools/ride.tsx'];

describe('the look', () => {
  it('every font size is on the scale, or a big display number', () => {
    const off: string[] = [];
    for (const { name, text } of code)
      for (const m of text.matchAll(/fontSize: (\d+(?:\.\d+)?)/g)) {
        const n = +m[1];
        if (!SIZES.has(n) && n < 38 && !SIZE_OK[name]?.includes(n)) off.push(name + ': ' + n);
      }
    expect(off).toEqual([]);
  });
  it('no capitals on labels', () => {
    const off: string[] = [];
    for (const { name, text } of code) {
      if (/textTransform/.test(text)) off.push(name + ': textTransform');
      /* capitalizing the first letter is fine; showing a whole string in capitals is not */
      if (/\{[\w.]+\.toUpperCase\(\)\}/.test(text)) off.push(name + ': toUpperCase');
      if (/letterSpacing/.test(text) && !SPACING_OK.includes(name)) off.push(name + ': letterSpacing');
    }
    expect(off).toEqual([]);
  });
  it('no text left at the default size', () => {
    const off = code.filter((c) => /<Text style=\{\{ fontFamily: font\.\w+, color:/.test(c.text)).map((c) => c.name);
    expect(off).toEqual([]);
  });
  it('a card has one edge: its fill', () => {
    const ui = code.find((c) => c.name === 'components/ui.tsx')!.text;
    const card = ui.slice(ui.indexOf('  card: {'), ui.indexOf('  btn: {'));
    expect(card).not.toMatch(/borderWidth|shadow/);
  });
  it('the empty eyebrow stays gone', () => {
    const off = code.filter((c) => /eyebrow="My Daybook"/.test(c.text)).map((c) => c.name);
    expect(off).toEqual([]);
  });
});
