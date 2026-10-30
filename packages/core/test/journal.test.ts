/* The Journal against the legacy app: each day's row, My numbers, what works in SOS, and each week's look back.
   The legacy screens are kept as their words; here the port's pieces are joined the same way and compared with the spaces
   taken out (the layout puts spaces in different places, the words are what must match). */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'setup-flow.json', 'rekindle-words.json', 'tools-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const bare = (s: string) => s.replace(/\s+/g, '');

describe.each(logs)('$name', (fx) => {
  const st: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => {
    if (core.isKey(k)) days[k] = core.normDay(fx.input.days[k], k);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fx.cases.forEach((c: any, i: number) =>
    it(`moment ${i}: the Journal`, () => {
      const e = c.expected;
      const tk = e.tk;
      const L = core.runLedger(days, st, tk);
      for (const [k, text] of e.journal.rows) {
        const r = core.dayRow(days, st, k, tk, L);
        expect(bare(r.weekday + r.date + r.phase + r.times + r.rate + r.pill + (r.pts ? '+' + r.pts : ''))).toBe(bare(text));
      }
      const done = core.lessonsDone(days);
      expect(core.playbookText(st, done, core.LESSONS, (id) => core.LESSONS.findIndex((L) => L.id === id), core.LCHECKS)).toBe(e.journal.book);
      expect(
        bare(
          'My numbers' +
            core
              .myNumbers(days, st, tk, c.now)
              .map((x) => x.l + x.b + x.s)
              .join(''),
        ),
      ).toBe(bare(e.journal.numbers));
      const w = core.urWorks(days, tk);
      if (w.length) {
        const words = bare(e.journal.works);
        for (const x of w)
          expect(words).toContain(bare(`${x.name}${x.n} ${x.n === 1 ? 'try' : 'tries'}${x.passed} it passed after, ${x.not} still strong or slipped after`));
      } else expect(bare(e.journal.works)).toBe(bare('After a few SOS uses, this shows which tools help you most.'));
      e.journal.weeks.forEach((text: string, k: number) => {
        const v = core.weekView(days, st, tk, k);
        const tiles = [
          ['Check-ins', v.w.checkins + ' of 7', ''],
          ['Entries', v.w.events, ''],
          ['Rode it out', v.w.rode, ''],
          ['Slipped', v.w.slipped, v.w.slipDays ? v.w.slipDays + ' day' + (v.w.slipDays === 1 ? '' : 's') : ''],
        ]
          .map((x) => x.join(''))
          .join('');
        const avgs = v.avgs.map((a) => a.l + a.v + a.move).join('');
        const head =
          'Week ' + (v.wk + 1) + v.range + '‹›' + tiles + 'Average ratings0 to 10' + avgs + 'What the week shows' + v.shows.map((x) => x.join('')).join('');
        expect(bare(text).startsWith(bare(head))).toBe(true);
      });
    }),
  );
});

describe('a day in the list', () => {
  it('says how many slips', () => {
    const st = core.normSettings({ v: 1, start: '2026-09-01', day1: '2026-09-08', rollover: 4, screensOff: '23:00', u: 1 });
    const days: Days = {};
    let d = core.addEvent(days, '2026-10-10', 'slipped', '22:00').days;
    d = core.addEvent(d, '2026-10-10', 'slipped', '23:00').days;
    const L = core.runLedger(d, st, '2026-10-15');
    expect(core.dayRow(d, st, '2026-10-10', '2026-10-15', L).pill.startsWith('Slipped ×2')).toBe(true);
  });
});
