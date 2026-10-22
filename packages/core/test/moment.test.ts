/* Today's one card (moment.ts), across scripted days of a made-up person: a calm day, the night of a slip and the morning
   after, a Sunday, a pause, days away, and a day with nothing left to do. */
import { describe, expect, it } from 'vitest';
import { blankP, LESSONS, normSettings } from '../src/legacy/core.js';
import { moments, pickMoment } from '../src/moment';
import { addEvent, changeDay, withDay } from '../src/mutate';
import type { Days } from '../src/types';

/* started October 7, Day 1 October 14; October 18 is a Sunday */
const st = normSettings({ start: '2026-10-07', day1: '2026-10-14', wk1: '2026-10-15' });
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const kinds = (days: Days, tk: string, now: number, s = st, dev = {}) => moments(days, s, {}, tk, now, dev).map((m) => m.k);
const slip = (days: Days, k: string, time = '23:00') => addEvent(days, k, 'slipped', time, {}, 1).days;

describe('a calm day', () => {
  it('the card is the day’s next stop, and the line under it names the rest', () => {
    const p = pickMoment({}, st, {}, '2026-10-20', at(20, 7));
    expect(p.card).toMatchObject({ k: 'calm', h: 'Good morning', btn: 'Start', go: 'morning' });
    expect(p.more).toBeNull();
    expect(p.then).toBe('Then: a lesson from 9:00 AM, the check-in around 6 PM and the wind-down from 10:00 PM.');
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
    expect(p.then).toBe('');
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
  it('the morning after: the sunrise check, with the run kept and the day after it', () => {
    const p = pickMoment(d, st, {}, '2026-10-22', at(22, 8));
    expect(p.card).toMatchObject({ k: 'morning-after', eb: 'The morning after', h: 'You came back. That is the skill.', go: 'sunrise' });
    expect(p.card.p).toBe('Last night is in the log, honestly. Your 7 days are kept. Two minutes, then the day goes on as usual.');
    expect(p.then).toMatch(/^Then: .*the wind-down\.$/);
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
    const p = pickMoment(slip({}, '2026-10-17'), st, {}, '2026-10-18', at(18, 8));
    expect(p.card.k).toBe('morning-after');
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
