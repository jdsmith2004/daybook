/* Today's one card (moment.ts), across scripted days of a made-up person: a calm day, the night of a slip and the morning
   after, a Sunday, a pause, days away, and a day with nothing left to do. */
import { describe, expect, it } from 'vitest';
import { blankP, LESSONS, normSettings } from '../src/legacy/core.js';
import { afterSlipLine, moments, pickMoment, standRow } from '../src/moment';
import { addEvent, changeDay, withDay } from '../src/mutate';
import type { Days } from '../src/types';

/* started October 7, Day 1 October 14; October 18 is a Sunday */
const st = normSettings({ start: '2026-10-07', day1: '2026-10-14', wk1: '2026-10-15' });
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const kinds = (days: Days, tk: string, now: number, s = st, dev = {}) => moments(days, s, {}, tk, now, dev).map((m) => m.k);
const slip = (days: Days, k: string, time = '23:00') => addEvent(days, k, 'slipped', time, {}, 1).days;

describe('a calm day', () => {
  it('the card is the day’s next stop, with no "Then:" line under it', () => {
    const p = pickMoment({}, st, {}, '2026-10-20', at(20, 7));
    /* the morning has no stop of its own any more: the day opens on its lesson */
    expect(p.card).toMatchObject({ k: 'calm', h: LESSONS[0].title, btn: 'Start', go: 'lesson', v: LESSONS[0].id });
    expect(p.more).toBeNull();
    expect(Object.keys(p)).toEqual(['card', 'more']);
  });
  it('without an account, a lesson that waits behind one is never the card', () => {
    const s0 = normSettings({ ...st, routine: { ...st.routine, morning: false } });
    const d = withDay(
      {},
      '2026-10-19',
      changeDay(undefined, '2026-10-19', (x) => void (x.p = { ...blankP(), ls: LESSONS.slice(0, 3).map((L) => L.id) }), 1),
    );
    const signedIn = pickMoment(d, s0, {}, '2026-10-20', at(20, 10), { account: true }).card;
    const local = pickMoment(d, s0, {}, '2026-10-20', at(20, 10), { account: false }).card;
    expect(signedIn).toMatchObject({ k: 'calm', go: 'lesson', v: LESSONS[3].id, h: LESSONS[3].title, btn: 'Start' });
    expect(local).toMatchObject({ k: 'calm', go: 'lesson', btn: 'Read it again' });
    expect(LESSONS.slice(0, 3).map((L) => L.id)).toContain(local.v);
  });
  it('all done: rest well, and who the person is now', () => {
    const off = normSettings({ ...st, routine: { morning: false, lesson: false, calm: false, reach: false, checkin: false, wind: false } });
    const p = pickMoment({}, off, {}, '2026-10-20', at(20, 21));
    expect(p.card.k).toBe('done');
  });
});

describe('a slip, and the morning after', () => {
  const d = slip({}, '2026-10-21');
  it('the night of it: one small thing, and the card goes once it is done', () => {
    expect(pickMoment(d, st, {}, '2026-10-21', at(21, 23, 30)).card).toMatchObject({ k: 'slip-day', h: 'Logged. That took honesty.', go: 'small' });
    const done = withDay(
      d,
      '2026-10-21',
      changeDay(d['2026-10-21'], '2026-10-21', (x) => x.events.forEach((e) => (e.recovered = true)), 2),
    );
    expect(kinds(done, '2026-10-21', at(21, 23, 40))).not.toContain('slip-day');
  });
  it('the morning after: a regular Today, nothing about the slip (the owner, October 23, 2026), and one quiet line', () => {
    const p = pickMoment(d, st, {}, '2026-10-22', at(22, 8));
    expect(p.card.k).toBe('calm');
    expect(kinds(d, '2026-10-22', at(22, 8))).not.toContain('slip-day');
    expect(afterSlipLine(d, '2026-10-22')).toEqual({ b: 'Good to see you.', rest: 'Your stats and your pattern are in Journal.' });
    expect(afterSlipLine(d, '2026-10-21')).toBeNull();
  });
  it('never a word of shame and no contractions on the slip cards', () => {
    for (const m of [...moments(d, st, {}, '2026-10-21', at(21, 23, 30)), ...moments(d, st, {}, '2026-10-22', at(22, 8))]) {
      expect(m.h + ' ' + m.p).not.toMatch(/n't|'s |failed|lost|reset to|start over/i);
    }
  });
});

describe('the order', () => {
  it('a pause in progress comes first', () => {
    expect(pickMoment(slip({}, '2026-10-21'), st, {}, '2026-10-22', at(22, 8), { pause: true }).card.k).toBe('pause');
  });
  it('the Sunday review on Sunday, and still on Monday while it is open', () => {
    expect(pickMoment({}, st, {}, '2026-10-18', at(18, 10)).card).toMatchObject({ k: 'sunday', h: 'Your Sunday review', v: '2026-10-18' });
    expect(pickMoment({}, st, {}, '2026-10-19', at(19, 10)).card).toMatchObject({ k: 'sunday', h: 'Last week’s review is still open' });
    expect(kinds({}, '2026-10-20', at(20, 10))).not.toContain('sunday');
  });
  it('two at once: the second waits as "and one more"', () => {
    const p = pickMoment(slip({}, '2026-10-17'), st, {}, '2026-10-18', at(18, 8), { pause: true });
    expect(p.card.k).toBe('pause');
    expect(p.more?.k).toBe('sunday');
    expect(p.more?.one).toBe('your Sunday review');
  });
  it('days away not known: the fill-in, once Welcome back was closed', () => {
    expect(pickMoment({}, st, {}, '2026-10-20', at(20, 10), { back: 5 }).card).toMatchObject({ k: 'away', h: '5 days not known yet', go: 'back' });
    expect(pickMoment({}, st, {}, '2026-10-20', at(20, 10), { back: 1 }).card.h).toBe('1 day not known yet');
  });
  it('the calm day is always the last, and never "and one more"', () => {
    const all = kinds({}, '2026-10-18', at(18, 10));
    expect(all[all.length - 1]).toBe('calm');
    expect(pickMoment({}, st, {}, '2026-10-20', at(20, 10)).more).toBeNull();
  });
  it('the first week, once: before the calm day', () => {
    const s0 = normSettings({ start: '2026-10-07', day1: '2026-10-14' });
    expect(pickMoment({}, s0, {}, '2026-10-15', at(15, 10)).card.k).toBe('first-week');
  });
});

describe('the standing row', () => {
  it('in the first week: of your first days, with the flame’s form', () => {
    const d = slip({}, '2026-10-16', '12:00');
    expect(standRow(d, st, {}, '2026-10-20', at(20, 10), 'Torch')).toMatchObject({ big: '5 of your first 6 days', line: 'with no slip · a Torch' });
    expect(standRow({}, st, {}, '2026-10-14', at(14, 10), 'Spark')!.big).toBe('Day 1');
  });
  it('after the first week: the last 7 days', () => {
    const d = slip(slip({}, '2026-10-16', '12:00'), '2026-10-21', '12:00');
    expect(standRow(d, st, {}, '2026-10-25', at(25, 10), 'Kindling')).toMatchObject({ big: '6 of the last 7 days', line: 'with no slip · Kindling' });
  });
  it('never a zero the morning after a slip', () => {
    const d = slip(slip({}, '2026-10-14', '12:00'), '2026-10-15', '12:00');
    expect(standRow(d, st, {}, '2026-10-16', at(16, 18), 'Spark')!.big).not.toMatch(/^0/);
  });
  it('a quieter line: what was logged today, and the week’s goal from Sunday', () => {
    const d = addEvent({}, '2026-10-20', 'rode', '09:00', {}, 1).days;
    const sun = { 's2026-10-18': { sun: { w: [], c: [], g: { t: 'Phone out of the bedroom, 5 nights', k: 'phone' as const, n: 5 } } } } as never;
    const r = standRow(d, st, sun, '2026-10-20', at(20, 10), 'Spark')!;
    expect(r.note).toMatch(/^1 logged today · \d of 5 nights this week$/);
    expect(standRow({}, st, {}, '2026-10-20', at(20, 10), 'Spark')!.note).toBe('');
  });
  it('stepping down: this stretch, with the best beside it', () => {
    const s0 = normSettings({ start: '2026-10-01', day1: '2026-10-08', cleanMode: 'step', stepAt: '2026-10-08' });
    const d = slip(slip({}, '2026-10-10', '10:00'), '2026-10-17', '10:00');
    const r = standRow(d, s0, {}, '2026-10-18', new Date(2026, 9, 18, 9, 0).getTime(), 'Campfire')!;
    expect(r.big).toBe('23 hours');
    expect(r.line).toMatch(/^this stretch · best \d+ d · a Campfire$/);
  });
});
