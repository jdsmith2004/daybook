/* What is new since last time (legacy checkNew), against the legacy app: from a seen state with nothing in it, the same
   celebrations in the same order, and the same seen state saved. Plus the points an action earns. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Days, Reviews, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'setup-flow.json', 'rekindle-words.json', 'tools-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

afterEach(() => vi.useRealTimers());

describe.each(logs)('$name', (fx) => {
  const st0: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => core.isKey(k) && (days[k] = core.normDay(fx.input.days[k], k)));
  const reviews: Reviews = {};
  Object.keys(fx.input.reviews).forEach((k) => (reviews[k] = core.normReview(fx.input.reviews[k], k)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fx.cases.forEach((c: any, i: number) =>
    it(`moment ${i}: what is new`, () => {
      vi.useFakeTimers();
      vi.setSystemTime(c.now);
      const st = { ...st0, seen: { badges: [], quests: [], level: 1, full: null, lad: core.LADDER_V } };
      const r = core.checkNew(days, st, reviews, c.expected.tk, false);
      const items = r.items.map((it) => ({
        type: it.type,
        id: it.type === 'badge' ? it.b.id : it.type === 'quest' ? it.q.id : it.type === 'level' ? it.level.n : it.type === 'perfect' ? it.n : it.type === 'more' ? it.title : null,
        ...(it.type === 'level' ? { from: it.from, evolve: it.evolve } : {}),
      }));
      expect(items).toEqual(c.expected.cel.items);
      expect(r.st ? r.st.seen : st.seen).toEqual(c.expected.cel.seen);
    }),
  );
});

describe('the points an action earns', () => {
  it('names the biggest gains, or says a slip quietly', () => {
    const st = core.normSettings({ v: 1, start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00', u: 1 });
    const before: Days = {};
    const after = core.addEvent(before, '2026-10-15', 'rode', '21:00').days;
    const w = core.winGain(before, after, st, ['2026-10-15']);
    expect(w.ev).toBe(true);
    expect(w.pts).toBeGreaterThan(0);
    expect(core.winWhy(w.by, false)).toMatch(/Rode it out|Logged honestly/);
    expect(core.winWhy(w.by, true)).toBe('Logged. That took honesty.');
  });
});
