/* Becoming free, step 2: Rekindle and the morning after. What it gave and what it cost, asked the day after a slip, from a
   little distance; Rekindle's words say what is kept as who the person is; and no point number shows in the hours after a
   slip, while the points are still earned. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const day = (n: number) => core.addDays('2026-10-31', n); // day(1) is November 1
const at = (n: number, h: number, m = 0) => {
  const [y, mo, d] = day(n).split('-').map(Number);
  return new Date(y, mo - 1, d, h, m).getTime();
};
const st = core.normSettings({ start: day(1), day1: day(1), countFrom: day(1) });
const slip = (d: Days, n: number, time = '23:10'): Days => core.addEvent(d, day(n), 'slipped', time, {}, at(n, 12)).days;
const rode = (d: Days, n: number): Days => core.addEvent(d, day(n), 'rode', '21:40', {}, at(n, 12)).days;
const due = (d: Days, n: number, h: number, m = 0) => core.lookBackDue(d, st, day(n), at(n, h, m));

describe('the morning after a slip: what it gave, what it cost', () => {
  const d = slip({}, 10);
  it('asks the next day, from a little distance', () => {
    const x = due(d, 11, 9)!;
    expect(x.k).toBe(day(10));
    expect(x.q.gave).toBe('Looking back at last night, what did it give you?');
    expect(x.q.cost).toBe('And what did it cost?');
    expect(x.costs.map((c) => c[1])).toEqual(['The evening', 'Sleep', 'Trust', 'The way I feel now']);
  });
  it('a slip in the morning is looked back at as yesterday, and cost the morning', () => {
    const x = due(slip({}, 10, '09:30'), 11, 9)!;
    expect(x.q.gave).toBe('Looking back at yesterday, what did it give you?');
    expect(x.costs[0][1]).toBe('The morning');
  });
  it('never on the day of the slip, never within the first hour, never after 10 PM or before 5 AM', () => {
    expect(due(d, 10, 23, 40)).toBeNull();
    /* a slip at 3:30 AM belongs to the day before (rollover 4); at 4:10 the next log day has begun, but it is night and too soon */
    const late = slip({}, 10, '03:30');
    expect(core.lookBackDue(late, st, day(11), at(12, 4, 10))).toBeNull();
    expect(due(d, 11, 22, 5)).toBeNull();
    expect(due(d, 11, 21, 55)).not.toBeNull();
    /* an evening slip at 21:30 is asked about from the next morning, not that night */
    expect(core.lookBackDue(slip({}, 10, '21:30'), st, day(10), at(10, 22, 40))).toBeNull();
  });
  it('only the day after, and not on a day with a slip of its own', () => {
    expect(due(d, 12, 9)).toBeNull();
    expect(due(slip(d, 11, '08:00'), 11, 10)).toBeNull();
  });
  it('never in the wind-down', () => {
    const night = core.normSettings({ ...st, screensOff: '21:00' });
    expect(core.lookBackDue(d, night, day(11), at(11, 20, 30))).toBeNull();
    expect(core.lookBackDue(d, night, day(11), at(11, 9))).not.toBeNull();
  });
  it('not for a slip told the next morning ("It happened"), and not for someone who slips most days', () => {
    const told = core.addEvent({}, day(10), 'slipped', null, { mn: true } as never, at(11, 7)).days;
    expect(due(told, 11, 9)).toBeNull();
    const stepper = core.normSettings({ ...st, cleanMode: 'step', stepAt: day(1) });
    expect(core.lookBackDue(d, stepper, day(11), at(11, 9))).toBeNull();
    /* slips on most days of the last week: the look waits for the Sunday review */
    let most: Days = {};
    for (const n of [5, 6, 7, 8, 10]) most = slip(most, n);
    expect(due(most, 11, 9)).toBeNull();
  });
  it('two taps, kept on the slip, and asked once answered no more', () => {
    const ev = due(d, 11, 9)!.ev;
    let x = core.lookBackSet(d, day(10), ev.id, { gv: 'relief' });
    expect(due(x, 11, 9)).toBeNull();
    x = core.lookBackSet(x, day(10), ev.id, { cs: 'time' });
    const kept = x[day(10)].events[0];
    expect([kept.gv, kept.cs]).toEqual(['relief', 'time']);
    /* through the store's own check, as after sync */
    expect(core.normDay(JSON.parse(JSON.stringify(x[day(10)])), day(10)).events[0]).toMatchObject({ gv: 'relief', cs: 'time' });
    expect(core.lookBackSay(kept.gv, kept.cs, kept, st.rollover)).toBe(
      'It gave relief, and it cost the evening. Seeing it clearly is how the next one gets easier.',
    );
    expect(core.lookBackSay('nothing', 'feel', kept, st.rollover)).toBe(
      'It gave little, and it cost the way you feel now. Seeing it clearly is how the next one gets easier.',
    );
  });
  it('an answer that is not one of the list leaves the log as it is', () => {
    const ev = d[day(10)].events[0];
    expect(core.lookBackSet(d, day(10), ev.id, { gv: 'fun' as never })).toBe(d);
    expect(core.lookBackSet(d, day(10), 'nope', { cs: 'sleep' })).toBe(d);
    expect(core.normDay({ d: day(10), events: [{ ...ev, gv: 'fun', cs: 'x' }] } as never, day(10)).events[0]).not.toHaveProperty('gv');
  });
});

describe('the answers feed the pattern and the Sunday review', () => {
  const answer = (d: Days, n: number, gv: core.SlipGave, cs: core.SlipCost) => {
    const id = d[day(n)].events.find((e) => e.outcome === 'slipped')!.id;
    return core.lookBackSet(core.lookBackSet(d, day(n), id, { gv }), day(n), id, { cs });
  };
  let d: Days = slip(slip(slip({}, 3), 6), 9);
  d = answer(d, 3, 'relief', 'sleep');
  d = answer(d, 6, 'escape', 'sleep');
  d = answer(d, 9, 'relief', 'trust');
  it('the pattern names what slips gave and cost, most first', () => {
    const p = core.patLookBack(d, day(12))!;
    expect(p.n).toBe(3);
    expect(p.head).toBe('It cost sleep');
    expect(p.line).toBe('Looking back on 3 slips: most often it gave relief (2 of 3), and it cost sleep (2 of 3).');
    expect(core.patLookBack(slip({}, 3), day(12))).toBeNull();
  });
  it('the Sunday review says it beside the urges ridden out', () => {
    /* November 8, 2026 is a Sunday: the week is November 2 to 8 */
    expect(core.storyLookBack(rode(d, 5), day(8), day(8), 1)).toBe('Looking back, they gave relief and cost sleep. And you rode out 1 urge.');
    expect(core.storyLookBack(slip({}, 3), day(8), day(8), 0)).toBeNull();
  });
});

describe('Rekindle says what is kept as who the person is', () => {
  it('after the hold, the urges ridden out and the days free of it, never a level or points', () => {
    const d = slip(rode(rode(rode(rode({}, 2), 4), 6), 8), 14);
    expect(core.rkLitLine(d, st, {}, day(14), day(14))).toBe('4 urges ridden out, 13 days free of it. All still yours.');
  });
});

describe('no point number in the hours after a slip', () => {
  const d = slip({}, 10, '23:10');
  it('for twelve hours after the latest slip', () => {
    expect(core.ptsQuiet(d, st, at(10, 23, 20))).toBe(true);
    expect(core.ptsQuiet(d, st, at(11, 11, 0))).toBe(true);
    expect(core.ptsQuiet(d, st, at(11, 11, 15))).toBe(false);
    expect(core.ptsQuiet({}, st, at(11, 9))).toBe(false);
  });
  it('a slip told the next morning counts from when it was logged', () => {
    const told = core.addEvent({}, day(10), 'slipped', null, {}, at(11, 7)).days;
    expect(core.ptsQuiet(told, st, at(11, 7, 5))).toBe(true);
    expect(core.ptsQuiet(told, st, at(11, 19, 30))).toBe(false);
  });
  it('the morning’s quiet link to Rekindle shows until Rekindle has asked about the slip', () => {
    const told = core.addEvent({}, day(10), 'slipped', null, {}, at(11, 7)).days;
    const id = told[day(10)].events[0].id;
    expect(core.rkOpenFor(told, day(10), id)).toBe(true);
    expect(core.rkOpenFor(core.patchEvent(told, day(10), id, { fa: 'okay' }), day(10), id)).toBe(false);
    expect(core.rkOpenFor(told, day(10), 'nope')).toBe(false);
  });
  it('the slip day’s page shows no points, and they are still earned', () => {
    const x = core.daySummary(d, st, day(10), day(12));
    expect(x.pts).toBe(0);
    expect(core.dayPoints(d, day(10), st).total).toBeGreaterThan(0);
  });
});
