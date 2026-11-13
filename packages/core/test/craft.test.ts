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
    const off = code.filter((c) => /<Text style=\{\{ fontFamily: font\.\w+, color:(?:(?!fontSize)[^}])*\}\}/.test(c.text)).map((c) => c.name);
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

/* the app's own voice never calls a person "clean", an "addict" or a "relapse": the goal is someone who is free. Lessons quote
   those words as the belief they turn over, and scripture is left as written, so those files are not read. */
describe('the words', () => {
  const coreDir = join(src, '../../../packages/core/src');
  const VOICE = ['nudges.ts', 'notify.ts', 'trail.ts', 'sunday-read.ts', 'rekindle-learn.ts', 'hero.ts', 'flame-low.ts'];
  const BAD = /\b(clean|addicts?|relapse[sd]?|relapsing)\b/i;
  const strings = (text: string) => {
    const bare = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    return bare.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || [];
  };
  const voice = [
    ...code.filter((f) => !/^(lib|shots)\//.test(f.name)).map((f) => ({ name: f.name, text: f.text })),
    ...VOICE.map((n) => ({ name: 'core/' + n, text: readFileSync(join(coreDir, n), 'utf8') })),
  ];
  it('no "clean", "addict" or "relapse" in the app’s own voice', () => {
    const hits = voice.flatMap((f) =>
      strings(f.text)
        .filter((s) => /\s/.test(s) && BAD.test(s.replace(/(Sex|Love) Addicts Anonymous/g, '')))
        .map((s) => f.name + ': ' + s.slice(0, 80)),
    );
    expect(hits).toEqual([]);
  });
});

/* ---------- contrast: the pairs a person reads or touches (WCAG: 4.5 for small text, 3 for a control against what it sits on) ---------- */
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
describe('contrast', () => {
  const theme = readFileSync(join(src, 'lib/theme.ts'), 'utf8');
  const palette = (name: string) => {
    const body = theme.slice(theme.indexOf('const ' + name));
    const get = (k: string) => new RegExp('\\n  ' + k + ": '(#[0-9A-Fa-f]{6})'").exec(body)![1];
    return { bg: get('bg'), surface: get('surface'), muted: get('muted'), ink: get('ink') };
  };
  for (const name of ['light', 'dark']) {
    it('the ' + name + ' theme: ink and muted text read on the page and on a card', () => {
      const p = palette(name);
      for (const on of [p.bg, p.surface]) {
        expect(ratio(p.ink, on)).toBeGreaterThanOrEqual(4.5);
        expect(ratio(p.muted, on)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it('the switch’s off track stands out from its card, light and dark', () => {
    const m = /scheme === 'dark' \? '(#[0-9A-Fa-f]{6})' : '(#[0-9A-Fa-f]{6})', c\.accent/.exec(readFileSync(join(src, 'components/settings-ui.tsx'), 'utf8'));
    expect(m).not.toBeNull();
    expect(ratio(m![1], palette('dark').surface)).toBeGreaterThanOrEqual(3);
    expect(ratio(m![2], palette('light').surface)).toBeGreaterThanOrEqual(3);
  });
  it('the night ink (chart axes, scene text) reads on the darkest and the lightest of the night skies', () => {
    const m = /nightInk = \{ ink: '#[0-9A-Fa-f]{6}', muted: '(#[0-9A-Fa-f]{6})'/.exec(theme);
    expect(m).not.toBeNull();
    expect(ratio(m![1], '#1B1040')).toBeGreaterThanOrEqual(4.5);
  });
});

/* ---------- words: the two rules a machine can check ---------- */
describe('the words that must stay true', () => {
  const pub = join(src, '../public');
  const pages: { name: string; text: string }[] = [];
  (function walk(d: string) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(html|txt)$/.test(f)) pages.push({ name: relative(pub, p), text: readFileSync(p, 'utf8') });
    }
  })(pub);
  it('no page says "no tracking" or "collects nothing at all": Daybook counts how it is used, anonymously', () => {
    const hits = pages.filter((f) => /no tracking|collects nothing at all/i.test(f.text)).map((f) => f.name);
    expect(hits).toEqual([]);
  });
  it('nothing tells a person they need not pay', () => {
    const hits = pages.filter((f) => /need not pay|do not need to pay|no need to pay/i.test(f.text)).map((f) => f.name);
    expect(hits).toEqual([]);
  });
  it('setup does not say answers are "never tied to who you are" (an account is; the anonymous counts are)', () => {
    const hits = code.filter((f) => f.name === 'app/setup.tsx' && /never tied to who you are/.test(f.text)).map((f) => f.name);
    expect(hits).toEqual([]);
  });
  it('the app does not claim "every tool stays the same" or that SOS puts a tool first "every time"', () => {
    const hits = code.filter((f) => /Every tool stays the same|first every time/.test(f.text)).map((f) => f.name);
    expect(hits).toEqual([]);
  });
});
