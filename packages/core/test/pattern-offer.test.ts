import { describe, expect, it } from 'vitest';

import { MONTH_MIN, monthEnd, monthList, monthNext, monthRead, PAT_WORDS, patOffer, patPreview } from '../src/pattern-offer';
import { tipGets, tipGetsShort } from '../src/support';
import { supPerks } from '../src/supporter';
import type { Days, Settings } from '../src/types';

const st = { start: '2026-08-01', rollover: 4, opts: {} } as unknown as Settings;
type E = [string, string, 'rode' | 'slipped', string?];
function log(list: E[]): Days {
  const days: Record<string, unknown> = {};
  list.forEach(([k, time, outcome, trigger], i) => {
    const d = (days[k] = days[k] || { d: k, events: [], checkin: null, p: null, u: 1 }) as { events: unknown[] };
    d.events.push({ id: 'e' + i, time, outcome, trigger: trigger ?? null });
  });
  return days as Days;
}
/* Tuesdays in October 2026: the 6th, 13th, 20th, 27th */
const hardNights: E[] = [
  ['2026-10-06', '21:30', 'slipped', 'stress'],
  ['2026-10-13', '21:15', 'slipped', 'stress'],
  ['2026-10-20', '22:10', 'slipped', 'stress'],
  ['2026-10-27', '21:40', 'slipped', 'stress'],
];

describe('the line from their own log', () => {
  it('says nothing until there is something true to say', () => {
    expect(patPreview({} as Days, st, '2026-10-30')).toBeNull();
    expect(patPreview(log([['2026-10-06', '21:00', 'rode']]), st, '2026-10-30')).toBeNull();
  });
  it('names the hard day and hours when the log shows them', () => {
    const line = patPreview(log(hardNights), st, '2026-10-30')!;
    expect(line).toContain('Tuesdays are your hardest day');
    expect(line).toContain('9 to 11 PM');
    expect(line).toMatch(/See what sets them off\.$/);
  });
  it('never uses a contraction, or a word of shame', () => {
    const line = patPreview(log(hardNights), st, '2026-10-30')!;
    expect(line).not.toMatch(/'|’|failed|relapse|addict/i);
  });
});

describe('when it is asked for', () => {
  const FROM = 1000;
  const tk = '2026-11-10';
  const noon = new Date(2026, 10, 10, 12).getTime();
  const near = { now: noon, sos: null };
  const days = log(hardNights);
  it('not before it is on sale', () => {
    expect(patOffer(days, st, tk, near, null)).toBeNull();
  });
  it('with the line from the log, when one exists', () => {
    expect(patOffer(days, st, tk, near, FROM)).toContain('Tuesdays');
    expect(patOffer({} as Days, st, tk, near, FROM)).toBeNull();
  });
  it('not in the hours after an SOS', () => {
    expect(patOffer(days, st, tk, { now: noon, sos: noon - 3600_000 }, FROM)).toBeNull();
    expect(patOffer(days, st, tk, { now: noon, sos: noon - 4 * 3600_000 }, FROM)).toContain('Tuesdays');
  });
  it('not in the days after a slip', () => {
    const slipped = log([...hardNights, ['2026-11-08', '21:00', 'slipped']]);
    expect(patOffer(slipped, st, tk, near, FROM)).toBeNull();
    expect(patOffer(slipped, st, '2026-11-12', { now: new Date(2026, 10, 12, 12).getTime(), sos: null }, FROM)).not.toBeNull();
  });
  it('never of someone who has it', () => {
    const have = { ...st, pat: { since: 2000, kind: 'lifetime', until: null, src: 'apple' } } as Settings;
    expect(patOffer(days, have, tk, near, FROM)).toBeNull();
    const before = { ...st, sup: { since: 500, kind: 'tip', until: null, src: 'apple' } } as Settings;
    expect(patOffer(days, before, tk, near, FROM)).toBeNull();
  });
  it('of someone who tipped after it went on sale, since their tip opened sync', () => {
    const after = { ...st, sup: { since: 2000, kind: 'tip', until: null, src: 'apple' } } as Settings;
    expect(patOffer(days, after, tk, near, FROM)).toContain('Tuesdays');
  });
});

describe('what changed this month', () => {
  const sept: E[] = [
    ['2026-09-03', '23:10', 'slipped', 'stress'],
    ['2026-09-08', '23:20', 'slipped', 'stress'],
    ['2026-09-12', '23:30', 'slipped', 'stress'],
    ['2026-09-20', '23:40', 'slipped', 'stress'],
    ['2026-09-22', '23:05', 'slipped', 'bored'],
    ['2026-09-25', '20:00', 'rode'],
  ];
  const oct: E[] = [
    ['2026-10-05', '21:10', 'slipped', 'stress'],
    ['2026-10-06', '21:30', 'rode', 'stress'],
    ['2026-10-14', '21:40', 'rode'],
    ['2026-10-22', '22:00', 'rode', 'bored'],
    ['2026-10-29', '21:50', 'rode'],
  ];
  const days = log([...sept, ...oct]);

  it('lists finished months with enough in them, newest first, and never the one still going', () => {
    expect(monthList(days, st, '2026-10-30')).toEqual(['2026-09']);
    expect(monthList(days, st, '2026-11-01')).toEqual(['2026-10', '2026-09']);
    expect(monthList(log(sept.slice(0, MONTH_MIN - 1)), st, '2026-11-01')).toEqual([]);
  });
  it('a better month says what got better', () => {
    const r = monthRead(days, st, '2026-10')!;
    expect(r.name).toBe('October');
    expect(r.head).toBe('October was lighter than September.');
    const t = r.lines.map((l) => l.t).join(' ');
    expect(t).toContain('1 slip in October, down from 5.');
    expect(t).toContain('You rode out 8 in 10 hard moments, up from 2 in 10.');
    expect(t).toContain('came before 1 of your slips, down from 4.');
    expect(t).toContain('Your hardest hours were 9 to 11 PM. In September they were 11 PM to 1 AM.');
  });
  it('a harder month says so plainly, without shame, and holds on to something', () => {
    const hard = log([
      ['2026-09-03', '21:00', 'slipped'],
      ['2026-09-08', '21:00', 'rode'],
      ['2026-09-12', '21:00', 'rode'],
      ['2026-10-03', '21:00', 'slipped'],
      ['2026-10-08', '21:00', 'slipped'],
      ['2026-10-12', '21:00', 'slipped'],
    ]);
    const r = monthRead(hard, st, '2026-10')!;
    expect(r.head).toBe('October was harder, and you stayed with it.');
    expect(r.lines[0].t).toContain('Every one is logged');
    expect(JSON.stringify(r)).not.toMatch(/failed|relapse|worse|lost|reset|addict/i);
  });
  it('a first month, with nothing to compare, still reads', () => {
    const r = monthRead(log(sept), st, '2026-09')!;
    expect(r.head).toBe('You stayed with it all through September.');
    expect(r.lines[0].t).toBe('5 slips logged in September.');
  });
  it('a share ridden out is said only when it rose or is most of them', () => {
    const low = log([
      ['2026-10-03', '21:00', 'slipped'],
      ['2026-10-08', '21:00', 'slipped'],
      ['2026-10-12', '21:00', 'slipped'],
      ['2026-10-14', '21:00', 'rode'],
    ]);
    expect(monthRead(low, st, '2026-10')!.lines.map((l) => l.k)).not.toContain('ride');
  });
  it('the hardest hours are where things happen, and one reason behind every slip is said as each', () => {
    const r = monthRead(
      log([
        ['2026-10-03', '21:30', 'slipped', 'stress'],
        ['2026-10-08', '21:40', 'slipped', 'stress'],
        ['2026-10-12', '21:10', 'rode'],
        ['2026-10-14', '21:20', 'rode'],
      ]),
      st,
      '2026-10',
    )!;
    const t = r.lines.map((l) => l.t).join(' ');
    expect(t).toContain('9 to 11 PM');
    expect(t).toContain('came before each of your 2 slips');
  });
  it('a month with no slips says that first', () => {
    const r = monthRead(
      log([
        ['2026-10-03', '21:00', 'rode'],
        ['2026-10-08', '21:00', 'rode'],
        ['2026-10-12', '21:00', 'rode'],
      ]),
      st,
      '2026-10',
    )!;
    expect(r.head).toBe('October had no slips at all.');
  });
  it('a month with too little in it has no read', () => {
    expect(monthRead(days, st, '2026-07')).toBeNull();
  });
  it('knows when a month ended and when the next read comes', () => {
    expect(monthEnd('2026-10')).toBe(new Date(2026, 10, 1).getTime());
    expect(monthEnd('2026-12')).toBe(new Date(2027, 0, 1).getTime());
    expect(monthNext('2026-10-30')).toBe('November 1');
    expect(monthNext('2026-12-30')).toBe('January 1');
  });
});

describe('the words', () => {
  it('no contraction, and nothing that talks a person out of paying', () => {
    const all = JSON.stringify(PAT_WORDS);
    expect(all).not.toMatch(/\b\w+'(t|s|re|ve|ll)\b/);
    expect(all).not.toMatch(/you do not need|free version|free is enough|you owe/i);
  });
  it('once it is on sale, a tip says only what it opens', () => {
    expect(tipGets(true)).not.toMatch(/pattern/);
    expect(tipGetsShort(true)).not.toMatch(/pattern/);
    expect(tipGets(false)).toMatch(/pattern/);
    expect(
      supPerks(false)
        .map((p) => p.name)
        .join(),
    ).not.toMatch(/pattern/i);
  });
});
