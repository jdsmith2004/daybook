/* The cards on Pattern: the period each is compared with, the columns of a range, how the days felt (the check-in's mood
   first, so a day with a slip is not left out), what was named (only with enough of it, and never praising a heavy word as
   new), what the stretches between slips say, and what is said about hard days. */
import { describe, expect, it } from 'vitest';
import { addDays, normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import {
  dayStep,
  moodStep,
  patDoing,
  patChunks,
  patFeels,
  patFelt,
  patLeads,
  patPeriod,
  patRangeLabel,
  patRideCols,
  patRideSay,
  spreadCircles,
} from '../src/pattern-cards';
import { patGaps, patKeys, patWhen } from '../src/pattern';
import type { DayKey, Days } from '../src/types';

const TK = '2026-11-01';
const st = normSettings({ start: '2026-01-01', day1: '2026-01-01' });
const late = normSettings({ start: '2026-10-28', day1: '2026-10-28' });
const blank = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} };
/** a start far back, so the log goes back that far */
const base = (): Days => ({ '2026-01-01': { events: [], u: 1 } as unknown as Days[string] });
const withFe = (d: Days, k: DayKey, words: string[]): Days => ({
  ...d,
  [k]: {
    ...(d[k] || { events: [] }),
    p: { ...blank, fe: words.map((w, i) => [w, new Date(k + 'T12:00:00').getTime() + i] as [string, number]) },
  } as unknown as Days[string],
});
const withDf = (d: Days, k: DayKey, n: 1 | 2 | 3 | 4 | 5): Days => ({
  ...d,
  [k]: { ...(d[k] || { events: [] }), p: { ...blank, df: [n, 1] } } as unknown as Days[string],
});
const withMood = (d: Days, k: DayKey, md: number): Days => ({ ...d, [k]: { ...(d[k] || { events: [] }), checkin: { md } } as unknown as Days[string] });

describe('patPeriod', () => {
  it('compares a week with the week before it, and a month with the month before', () => {
    const w = patPeriod('7', base(), st, TK);
    expect(w.keys.length).toBe(7);
    expect(w.keys[0]).toBe('2026-10-26');
    expect(w.then![0]).toBe('2026-10-19');
    expect(w.then![w.then!.length - 1]).toBe('2026-10-25');
    expect(w.than).toBe('the week before');
    const m = patPeriod('30', base(), st, TK);
    expect(m.keys.length).toBe(30);
    expect(m.then!.length).toBe(30);
    expect(m.then![m.then!.length - 1]).toBe(addDays(m.keys[0], -1));
  });
  it('has nothing to compare with before the log starts', () => {
    const p = patPeriod('7', { '2026-10-30': { events: [] } as unknown as Days[string] }, late, TK);
    expect(p.then).toBe(null);
  });
  it('All compares the first month with the latest, once they do not overlap', () => {
    const p = patPeriod('all', base(), st, TK);
    expect(p.recent.length).toBe(30);
    expect(p.then![0]).toBe('2026-01-01');
    expect(p.than).toBe('in your first month');
    const short = patPeriod('all', { '2026-10-30': { events: [] } as unknown as Days[string] }, late, TK);
    expect(short.then).toBe(null);
  });
});

describe('patRangeLabel', () => {
  it('names the range plainly', () => {
    expect(patRangeLabel(['2026-10-03', '2026-11-01'], TK)).toBe('Oct 3 to Nov 1');
    expect(patRangeLabel(['2025-03-30', '2026-11-01'], TK)).toBe('Mar 30, 2025 to Nov 1');
    expect(patRangeLabel([TK], TK)).toBe('Today');
    expect(patRangeLabel([], TK)).toBe('');
  });
});

describe('patChunks', () => {
  const keys = (n: number) => Array.from({ length: n }, (_, i) => addDays(TK, i - n + 1));
  it('a week is seven days, a month is five equal columns, and anything longer is at most 13 columns', () => {
    expect(patChunks(keys(7)).map((c) => c.length)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    const m = patChunks(keys(30));
    expect(m.map((c) => c.length)).toEqual([6, 6, 6, 6, 6]);
    expect(patChunks(keys(300)).length).toBeLessThanOrEqual(13);
  });
  it('keeps every day, in order', () => {
    const k = keys(100);
    expect(patChunks(k).flat()).toEqual(k);
  });
  it('a log of one day is one column', () => {
    expect(patChunks([TK])).toEqual([[TK]]);
  });
});

describe('the riding out', () => {
  it('counts each column and names today', () => {
    let d: Days = base();
    d = addEvent(d, TK, 'rode', '21:00', { trigger: null }, 1).days;
    d = addEvent(d, TK, 'slipped', '22:00', { trigger: null }, 1).days;
    const cols = patRideCols(d, patKeys('7', d, st, TK), TK);
    expect(cols.length).toBe(7);
    expect(cols[6]).toMatchObject({ label: 'Today', rode: 1, slipped: 1 });
  });
  it('leads with the wins, and never a share a slip can drag down', () => {
    const col = (rode: number, slipped: number) => ({ from: TK, label: '', rode, slipped });
    expect(patRideSay({ then: 0.5, now: 0.8 }, [col(8, 2)])).toEqual({ head: '8 ridden out', line: 'You ride out 8 in 10 hard moments now, up from 5 in 10.' });
    expect(patRideSay({ then: 0.8, now: 0.8 }, [col(8, 2)]).line).toBe('You ride out about 8 in 10 hard moments, and it is holding.');
    expect(patRideSay({ then: 0.8, now: 0.5 }, [col(5, 5)])).toEqual({ head: '5 ridden out', line: '' });
    expect(patRideSay(null, [col(0, 2)]).head + patRideSay(null, [col(0, 2)]).line).not.toMatch(/\d/);
    expect(patRideSay(null, [col(0, 0)]).head).toBe('A quiet stretch');
  });
});

describe('how you are doing', () => {
  const slips = (back: number[]) => {
    let d = base();
    for (const b of back) d = addEvent(d, addDays(TK, -b), 'slipped', '22:00', { trigger: null }, 1).days;
    return d;
  };
  const range = (a: number, b: number, by: number) => Array.from({ length: Math.ceil((b - a) / by) }, (_, i) => a + i * by);
  const at = (d: Days, r: '7' | '30' | 'all' = '30') => patDoing(d, patPeriod(r, d, st, TK));
  it('says getting better against the month before, with both numbers', () => {
    const c = at(slips([3, ...range(30, 44, 2)]));
    expect(c.kind).toBe('better');
    expect(c.head).toBe('Getting better');
    expect(c.line).toBe('29 of the last 30 days had no slip, up from 23 the month before.');
  });
  it('says a harder stretch with its numbers, and no shame', () => {
    const c = at(slips(range(1, 13, 2)));
    expect(c.kind).toBe('harder');
    expect(c.line).toBe('24 of the last 30 days had no slip, down from 30 the month before. That is a signal, not a verdict.');
  });
  it('says holding strong near the top, and steady otherwise', () => {
    expect(at(slips([3, 33])).head).toBe('Holding strong');
    const mid = at(slips([...range(0, 30, 2), ...range(30, 60, 2)]));
    expect(mid.head).toBe('Steady');
    expect(mid.line).toBe('15 of the last 30 days had no slip, about the same as the month before.');
  });
  it('never falls: a slip is a flat step', () => {
    const c = at(slips([10]));
    for (let i = 1; i < c.now.length; i++) expect(c.now[i]).toBeGreaterThanOrEqual(c.now[i - 1]);
    expect(c.now[c.now.length - 1]).toBe(29);
    expect(c.now[19]).toBe(c.now[18]);
  });
  it('a week compares with the week before, and one slip is not a change', () => {
    expect(at(slips([1]), '7').kind).toBe('strong');
    expect(at(slips([1, 2]), '7').kind).toBe('harder');
  });
  it('with nothing to compare, says what is there', () => {
    const young = normSettings({ start: '2026-10-20', day1: '2026-10-20' });
    const clean = patDoing({}, patPeriod('all', {}, young, TK));
    expect(clean).toMatchObject({ kind: null, then: null, head: 'Every day', line: 'All of your 13 days so far had no slip.' });
    const d = addEvent({}, '2026-10-25', 'slipped', '22:00', { trigger: null }, 1).days;
    expect(patDoing(d, patPeriod('all', d, young, TK))).toMatchObject({ head: '12 of 13 days', line: 'had no slip.' });
  });
  it('All lays the latest month over the first', () => {
    const c = at(slips(range(280, 298, 1)), 'all');
    expect(c.line).toContain('in your first month');
    expect(c.now.length).toBe(30);
    expect(c.then!.length).toBe(30);
  });
});

describe('the longest stretch', () => {
  it('keeps the longest stretch, past the ten runs it lists and through a slip', () => {
    let d = base();
    d = addEvent(d, '2026-03-01', 'slipped', '22:00', { trigger: null }, 1).days;
    for (let i = 0; i < 12; i++) d = addEvent(d, addDays('2026-10-01', i * 2), 'slipped', '22:00', { trigger: null }, 1).days;
    const g = patGaps(d, st, TK);
    expect(g.runs.length).toBe(10);
    expect(g.longest).toBeGreaterThan(Math.max(...g.runs));
    expect(g.longest).toBe(213);
  });
});

describe('how the days felt', () => {
  it('reads the mood as a step', () => {
    expect([0, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(moodStep)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
  it('the check-in looks back over the day, so it wins over the morning question; a day with neither has no step', () => {
    let d = withDf({}, TK, 5);
    expect(dayStep(d[TK])).toBe(5);
    d = withMood(d, TK, 1);
    expect(dayStep(d[TK])).toBe(1);
    expect(dayStep(undefined)).toBe(null);
    expect(dayStep({ events: [] } as unknown as Days[string])).toBe(null);
  });
  it('a mood of 0 counts: it is an answer', () => {
    expect(dayStep(withMood({}, TK, 0)[TK])).toBe(1);
  });
  it('says steady when the two periods are close', () => {
    let d = base();
    for (let i = 0; i < 14; i++) d = withDf(d, addDays(TK, -i), 4);
    expect(patFelt(d, patPeriod('7', d, st, TK), TK)).toMatchObject({ head: 'Steady', line: '7 of 7 mostly good, about the same as the week before.' });
  });
  it('says mostly only when it is most of them', () => {
    let d = base();
    for (let i = 0; i < 6; i++) d = withDf(d, addDays(TK, -i), i < 4 ? 4 : 3);
    expect(patFelt(d, patPeriod('7', d, st, TK), TK)).toMatchObject({ head: 'Mostly good', line: '4 of 6 answered.' });
    d = base();
    for (let i = 0; i < 6; i++) d = withDf(d, addDays(TK, -i), i < 3 ? 2 : 3);
    expect(patFelt(d, patPeriod('7', d, st, TK), TK).head).toBe('A mix of days');
  });
  it('says the days got better, with the counts', () => {
    let d = base();
    for (let i = 0; i < 30; i++) d = withDf(d, addDays(TK, -i), i < 20 ? 4 : 3);
    for (let i = 30; i < 60; i++) d = withDf(d, addDays(TK, -i), i < 35 ? 4 : 2);
    const f = patFelt(d, patPeriod('30', d, st, TK), TK);
    expect(f.n).toBe(30);
    expect(f.head).toBe('More good days');
    expect(f.line).toBe('20 of 30, up from 5 of 30 the month before.');
    expect(f.by[3]).toBe(20);
  });
  it('says fewer hard days when that is the change', () => {
    let d = base();
    for (let i = 0; i < 7; i++) d = withDf(d, addDays(TK, -i), 3);
    for (let i = 7; i < 14; i++) d = withDf(d, addDays(TK, -i), 1);
    expect(patFelt(d, patPeriod('7', d, st, TK), TK)).toMatchObject({ head: 'Fewer hard days', line: '0 of 7, down from 7 of 7 the week before.' });
  });
  it('says a harder stretch kindly, with no count to feel bad about', () => {
    let d = base();
    for (let i = 0; i < 7; i++) d = withDf(d, addDays(TK, -i), 1);
    for (let i = 7; i < 14; i++) d = withDf(d, addDays(TK, -i), 5);
    const f = patFelt(d, patPeriod('7', d, st, TK), TK);
    expect(f.head).toBe('A harder stretch');
    expect(f.line).not.toMatch(/\d/);
  });
  it('with too little to compare, says what is there and claims nothing', () => {
    const d = withDf(withDf(base(), TK, 3), addDays(TK, -1), 3);
    expect(patFelt(d, patPeriod('7', d, st, TK), TK).head).toBe('2 days answered');
    expect(patFelt(base(), patPeriod('7', base(), st, TK), TK).head).toBe('Nothing answered');
  });
});

describe('the marks for how the days felt', () => {
  it('a day with no answer stays blank', () => {
    let d = withDf(base(), TK, 5);
    d = withDf(d, addDays(TK, -6), 1);
    const f = patFelt(d, patPeriod('7', d, st, TK), TK);
    expect(f.weeks).toBe(false);
    expect(f.marks.map((m) => m.n)).toEqual([1, null, null, null, null, null, 5]);
  });
  it('a month is a mark a day, and a long log is a mark a week, at the middle of its answers', () => {
    let d = base();
    for (let i = 0; i < 300; i++) d = withDf(d, addDays(TK, -i), i % 2 ? 4 : 2);
    expect(patFelt(d, patPeriod('30', d, st, TK), TK).marks.length).toBe(30);
    const all = patFelt(d, patPeriod('all', d, st, TK), TK);
    expect(all.weeks).toBe(true);
    expect(all.marks.length).toBe(44);
    expect(all.marks[all.marks.length - 1].n).toBe(3);
  });
});

describe('what is said about hard days', () => {
  const day = (d: Days, k: DayKey, slip: boolean, h: number): Days => {
    const out = slip ? addEvent(d, k, 'slipped', '22:00', { trigger: null }, 1).days : d;
    return { ...out, [k]: { ...(out[k] || { events: [] }), checkin: { h, md: slip ? 2 : 8 } } as unknown as Days[string] };
  };
  const build = (n: number) => {
    let d = base();
    for (let i = 0; i < n; i++) {
      d = day(d, addDays(TK, -i * 2), true, 5);
      d = day(d, addDays(TK, -i * 2 - 1), false, 8);
    }
    return d;
  };
  it('says nothing until there are enough days on each side', () => {
    const d = build(4);
    expect(patLeads(d, patPeriod('30', d, st, TK).keys).list).toEqual([]);
  });
  it('says what comes before a slip, and leaves out what the slip itself moves', () => {
    const d = build(6);
    const l = patLeads(d, patPeriod('30', d, st, TK).keys).list;
    expect(l.map((x) => x.k)).toEqual(['h']);
  });
});

describe('the days of the week', () => {
  const tue = (n: number) => {
    let d = base();
    /* Tuesday, October 27, 2026 and the Tuesdays before it */
    for (let i = 0; i < n; i++) d = addEvent(d, addDays('2026-10-27', -i * 7), 'slipped', '22:00', { trigger: null }, 1).days;
    return d;
  };
  const spread = (d: Days) => {
    for (const [k, i] of [
      ['2026-10-26', 0],
      ['2026-10-22', 1],
      ['2026-10-17', 2],
    ] as [DayKey, number][])
      d = addEvent(d, k, 'slipped', '22:00', { trigger: null }, 1 + i).days;
    return d;
  };
  it('names no hardest day on a short range, or when luck could do it', () => {
    const d = tue(4);
    expect(patWhen(d, st, patKeys('7', d, st, TK), TK).day).toBe(null);
    const thin = spread(tue(3));
    expect(patWhen(thin, st, patKeys('all', thin, st, TK), TK).day).toBe(null);
  });
  it('names one with enough behind it', () => {
    const d = spread(tue(6));
    expect(patWhen(d, st, patKeys('all', d, st, TK), TK).day).toMatchObject({ name: 'Tuesday', n: 6, of: 9 });
  });
});

describe('what was named', () => {
  it('counts each corner of the field and the top words', () => {
    const d = withFe(base(), TK, ['Calm', 'Calm', 'Hopeful', 'Lonely', 'Angry']);
    const f = patFeels(undefined, d, patPeriod('7', d, st, TK), TK);
    expect(f.n).toBe(5);
    expect(f.quads.map((q) => q.q)).toEqual(['green', 'yellow', 'blue', 'red']);
    expect(f.quads.map((q) => q.n)).toEqual([2, 1, 1, 1]);
    expect(f.words[0]).toMatchObject({ w: 'Calm', n: 2 });
    expect(f.head).toBe('A mix of feelings');
    expect(f.line).toBe('Calm feelings came up most: 40% of what you named.');
    expect(f.kinds).toBe(4);
  });
  it('with only a few named, shows them and claims nothing', () => {
    const d = withFe(base(), TK, ['Calm', 'Calm']);
    const f = patFeels(undefined, d, patPeriod('7', d, st, TK), TK);
    expect(f.n).toBe(2);
    expect(f.head).toBe('2 feelings named');
    expect(f.line).toBe('');
  });
  it('the words named never go down when a range is quiet', () => {
    const d = withFe(withFe(base(), addDays(TK, -20), ['Calm', 'Proud']), TK, ['Sad']);
    expect(patFeels(undefined, d, patPeriod('7', d, st, TK), TK).kinds).toBe(3);
  });
  it('counts a journal entry and a slip’s feeling too', () => {
    const at = new Date(TK + 'T12:00:00').getTime();
    const jn = { abcd: { id: 'abcd', d: TK, at, w: 'Proud', t: '', u: 1 } };
    const f = patFeels(jn, base(), patPeriod('7', base(), st, TK), TK);
    expect(f.n).toBe(1);
    expect(f.words[0].w).toBe('Proud');
  });
  it('leaves out a word the field no longer has', () => {
    const d = withFe(base(), TK, ['Calm', 'Grumpy']);
    expect(patFeels(undefined, d, patPeriod('7', d, st, TK), TK).n).toBe(1);
  });
  it('compares with the period before only with enough on each side', () => {
    let d = base();
    d = withFe(d, TK, ['Calm', 'Calm', 'Calm', 'Calm', 'Lonely']);
    d = withFe(d, addDays(TK, -8), ['Lonely', 'Lonely', 'Lonely', 'Lonely', 'Calm']);
    expect(patFeels(undefined, d, patPeriod('7', d, st, TK), TK)).toMatchObject({
      head: 'More pleasant',
      line: '80% of what you named, up from 20% the week before.',
    });
    const thin = withFe(base(), TK, ['Calm', 'Calm', 'Calm', 'Calm', 'Lonely']);
    expect(patFeels(undefined, thin, patPeriod('7', thin, st, TK), TK).line).toContain('came up most');
  });
  it('a heavier stretch is said without a number', () => {
    let d = base();
    d = withFe(d, TK, ['Lonely', 'Lonely', 'Lonely', 'Lonely', 'Calm']);
    d = withFe(d, addDays(TK, -8), ['Calm', 'Calm', 'Calm', 'Calm', 'Lonely']);
    expect(patFeels(undefined, d, patPeriod('7', d, st, TK), TK)).toMatchObject({ head: 'A heavier stretch', line: 'Naming it is part of what helps.' });
  });
  it('names only a new pleasant word as new, and only with something earlier to go by', () => {
    let d = base();
    d = withFe(d, addDays(TK, -20), ['Calm', 'Calm', 'Calm', 'Calm', 'Calm']);
    d = withFe(d, TK, ['Proud', 'Hopeless', 'Hopeless']);
    expect(patFeels(undefined, d, patPeriod('7', d, st, TK), TK).fresh).toBe('New this week: Proud.');
    const first = withFe(base(), TK, ['Proud', 'Proud', 'Calm']);
    expect(patFeels(undefined, first, patPeriod('7', first, st, TK), TK).fresh).toBe('');
    let heavy = withFe(base(), addDays(TK, -20), ['Calm', 'Calm', 'Calm', 'Calm', 'Calm']);
    heavy = withFe(heavy, TK, ['Hopeless', 'Hopeless']);
    expect(patFeels(undefined, heavy, patPeriod('7', heavy, st, TK), TK).fresh).toBe('');
  });
  it('with nothing named, says nothing', () => {
    const f = patFeels(undefined, base(), patPeriod('7', base(), st, TK), TK);
    expect(f).toMatchObject({ n: 0, head: '', line: '', fresh: '', words: [], kinds: 0 });
  });
});

describe('spreadCircles', () => {
  const clear = (l: { x: number; y: number; r: number }[], gap: number) => {
    for (let i = 0; i < l.length; i++)
      for (let j = i + 1; j < l.length; j++) expect(Math.hypot(l[i].x - l[j].x, l[i].y - l[j].y)).toBeGreaterThanOrEqual(l[i].r + l[j].r + gap - 0.5);
  };

  it('parts shapes that overlap and keeps them in the square', () => {
    const out = spreadCircles(
      [
        { x: 200, y: 200, r: 30 },
        { x: 225, y: 200, r: 24 },
        { x: 250, y: 200, r: 30 },
      ],
      300,
      10,
    );
    clear(out, 10);
    for (const p of out) {
      expect(p.x - p.r).toBeGreaterThanOrEqual(0);
      expect(p.x + p.r).toBeLessThanOrEqual(300);
    }
  });

  it('leaves alone what touches nothing', () => {
    const list = [
      { x: 40, y: 40, r: 20 },
      { x: 200, y: 200, r: 20 },
    ];
    expect(spreadCircles(list, 300, 10)).toEqual(list);
  });

  it('parts two on the same spot, the same way every time', () => {
    const list = [
      { x: 100, y: 100, r: 20 },
      { x: 100, y: 100, r: 20 },
    ];
    const a = spreadCircles(list, 300);
    clear(a, 0);
    expect(spreadCircles(list, 300)).toEqual(a);
    expect(a[0].x).toBeLessThan(a[1].x);
  });

  it('pulls one that starts over the edge back in', () => {
    expect(spreadCircles([{ x: 295, y: 5, r: 20 }], 300)).toEqual([{ x: 280, y: 20, r: 20 }]);
  });
});
