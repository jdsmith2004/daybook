/* Today's one card (moment.ts), across scripted days of a made-up person: a calm day, the night of a slip and the day
   after, a Sunday, a pause, days away, and a day with nothing left to do. */
import { LEARN_FREE, lessonPath } from '../src/index';
import { describe, expect, it } from 'vitest';
import { blankP, LESSONS, normSettings } from '../src/legacy/core.js';
import { moments, pickMoment, standRow } from '../src/moment';
import { addEvent, changeDay, withDay } from '../src/mutate';
import { srDone, sunriseDue } from '../src/rekindle';
import type { Days, Reviews } from '../src/types';

/* started October 7, Day 1 October 14; October 18 is a Sunday */
const st = normSettings({ start: '2026-10-07', day1: '2026-10-14', wk1: '2026-10-15' });
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const kinds = (days: Days, tk: string, now: number, s = st, dev = {}) => moments(days, s, {}, tk, now, dev).map((m) => m.k);
/* the morning told and tonight set, so the morning is not the next step */
const told = (k: string): Days =>
  withDay(
    {},
    k,
    changeDay(undefined, k, (x) => void (x.p = { ...blankP(), ms: { at: at(1, 6), set: at(1, 6) } }), 1),
  );
const slip = (days: Days, k: string, time = '23:00') => addEvent(days, k, 'slipped', time, {}, 1).days;

describe('a calm day', () => {
  it('the card is the day’s next stop, with no line under it (Your day names the rest)', () => {
    /* in the morning hours, the morning not told yet is the next step (next-step.ts) */
    expect(pickMoment({}, st, {}, '2026-10-20', at(20, 7)).card).toMatchObject({ k: 'calm', go: 'morning' });
    /* once it is set (or closed), the lesson */
    const p = pickMoment(told('2026-10-20'), st, {}, '2026-10-20', at(20, 7));
    expect(p.card).toMatchObject({ k: 'calm', h: LESSONS[0].title, btn: 'Start', go: 'lesson', v: LESSONS[0].id });
    expect(p.more).toBeNull();
    expect(p).not.toHaveProperty('then');
  });
  it('without an account, a lesson that waits behind one is never the card', () => {
    const s0 = normSettings({ ...st, routine: { ...st.routine, morning: false } });
    const d = withDay(
      {},
      '2026-10-19',
      changeDay(
        undefined,
        '2026-10-19',
        (x) =>
          void (x.p = {
            ...blankP(),
            ms: { at: at(1, 6), set: at(1, 6) },
            ls: lessonPath()
              .slice(0, LEARN_FREE)
              .map((L) => L.id),
          }),
        1,
      ),
    );
    const d2 = { ...d, ...told('2026-10-20') };
    const signedIn = pickMoment(d2, s0, {}, '2026-10-20', at(20, 10), { account: true }).card;
    const local = pickMoment(d2, s0, {}, '2026-10-20', at(20, 10), { account: false }).card;
    expect(signedIn).toMatchObject({ k: 'calm', go: 'lesson', v: lessonPath()[LEARN_FREE].id, h: lessonPath()[LEARN_FREE].title, btn: 'Start' });
    /* it says the next lesson waits for a free account (WP11), and its button opens the sign-up */
    expect(local).toMatchObject({ k: 'calm', go: 'lesson', v: lessonPath()[LEARN_FREE].id, btn: 'Create an account or sign in' });
  });
  it('all done: rest well, and who the person is now', () => {
    const off = normSettings({ ...st, routine: { morning: false, lesson: false, calm: false, reach: false, checkin: false, wind: false } });
    const p = pickMoment({}, off, {}, '2026-10-20', at(20, 21));
    expect(p.card.k).toBe('done');
  });
});

describe('a slip, and the day after', () => {
  const d = slip({}, '2026-10-21');
  /* Day 1 October 18: the slip ends a 3-day run, so there is no run question */
  const short = normSettings({ ...st, day1: '2026-10-18' });
  it("the day of a slip has no card of its own: the card is the day's next stop, as on any day (the owner, November 18, 2026)", () => {
    for (const h of [9, 14, 20, 23]) {
      const tk = '2026-10-21';
      const slipped = moments(d, st, {}, tk, at(21, h, 30)).map((m) => m.k);
      const calm = moments({}, st, {}, tk, at(21, h, 30)).map((m) => m.k);
      expect(slipped).toEqual(calm);
    }
  });
  it('no "morning after" card: the day after opens on its next stop, morning or evening', () => {
    for (const h of [8, 17]) {
      const p = pickMoment(d, short, {}, '2026-10-22', at(22, h, 27));
      expect(p.card.k).toBe('calm');
      expect(p.more).toBeNull();
      expect(
        moments(d, short, {}, '2026-10-22', at(22, h, 27))
          .map((m) => m.eb + ' ' + m.h)
          .join(' '),
      ).not.toMatch(/morning after|sunrise/i);
    }
  });
  it('asks nothing about the count, on the night of a slip or the morning after', () => {
    for (const h of [8, 11, 20]) expect(kinds(d, '2026-10-22', at(22, h)).join(' ')).not.toMatch(/run-/);
    expect(
      moments(d, st, {}, '2026-10-22', at(22, 8))
        .map((m) => m.eb + m.h + m.p)
        .join(' '),
    ).not.toMatch(/start fresh|keep counting|run question/i);
  });
  it('never a word of shame and no contractions on the slip cards', () => {
    for (const m of [...moments(d, st, {}, '2026-10-21', at(21, 23, 30)), ...moments(d, st, {}, '2026-10-22', at(22, 8))]) {
      expect(m.h + ' ' + m.p).not.toMatch(/n't|'s |failed|lost|reset to|start over/i);
    }
  });
});

describe('"and one more" clears once the sunrise check is done that day (bug, October 24)', () => {
  /* Day 1 October 1: a slip on Wednesday the 21st ends a 20-day run, which waits for the quest until Saturday night */
  const s0 = normSettings({ start: '2026-10-01', day1: '2026-10-01' });
  const d = slip({}, '2026-10-21');
  it('a later slip ends the run: the earlier slip’s sunrise check is not named any more', () => {
    /* another slip on Friday: the ledger still marks Wednesday "open", but no run waits now */
    const again = slip(d, '2026-10-23', '12:00');
    expect(sunriseDue(again, s0, '2026-10-23')).toBeNull();
    const all = moments(again, s0, {}, '2026-10-23', at(23, 13));
    expect(all.map((m) => m.k)).toEqual(['calm']);
    expect(all.map((m) => m.one).join(' ')).not.toMatch(/sunrise/);
  });
  it('while a run the old rule covers waits, coming back marks the check, and no card is named', () => {
    const tk = '2026-10-22';
    expect(pickMoment(d, s0, {}, tk, at(22, 9), { pause: true }).more).toBeNull();
    const due = sunriseDue(d, s0, tk)!;
    expect(sunriseDue(srDone(d, due.k, due.ev.id, tk), s0, tk)).toBeNull();
  });
});

describe('the order', () => {
  it('a pause in progress comes first', () => {
    expect(pickMoment(slip({}, '2026-10-21'), st, {}, '2026-10-22', at(22, 8), { pause: true }).card.k).toBe('pause');
  });
  it('the Sunday review on Sunday, and still on Monday while it is open', () => {
    /* the first one is a part unlocked: its card opens its own page first (unlock.ts) */
    /* it is a step on the line (next-step.ts), so it is the calm day's card, never a second card above the line */
    expect(pickMoment(told('2026-10-18'), st, {}, '2026-10-18', at(18, 10)).card).toMatchObject({
      k: 'calm',
      h: 'Your first Sunday review',
      go: 'unlock',
      v: '2026-10-18',
    });
    const done = { '2026-10-11': { sun: {} } } as unknown as Reviews;
    expect(pickMoment(told('2026-10-18'), st, done, '2026-10-18', at(18, 10)).card).toMatchObject({
      k: 'calm',
      h: 'Your Sunday review',
      go: 'review',
      v: '2026-10-18',
    });
    expect(pickMoment(told('2026-10-19'), st, {}, '2026-10-19', at(19, 10)).card).toMatchObject({ k: 'calm', h: 'Look back on last week', go: 'review' });
    expect(pickMoment(told('2026-10-20'), st, {}, '2026-10-20', at(20, 10)).card).toMatchObject({ k: 'calm', go: 'lesson' });
    expect(kinds({}, '2026-10-18', at(18, 10))).not.toContain('sunday');
  });
  it('two at once: the second waits as "and one more"', () => {
    const p = pickMoment({}, st, {}, '2026-10-18', at(18, 8), { pause: true });
    expect(p.card.k).toBe('pause');
    /* the day's next step is never "and one more": the line under the card names it */
    expect(p.more).toBeNull();
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
  const g = normSettings({ ...st, cleanMode: 'gentle' });
  it('strict: the days in a row, with the flame’s form', () => {
    const d = slip({}, '2026-10-16', '12:00');
    expect(standRow(d, st, {}, '2026-10-20', at(20, 10), 'Torch')).toMatchObject({ big: '4 days', line: 'in a row with no slip · a Torch' });
    expect(standRow({}, st, {}, '2026-10-14', at(14, 10), 'Spark')!.big).toBe('Day 1');
  });
  it('gentle, in the first week: of your first days', () => {
    const d = slip({}, '2026-10-16', '12:00');
    expect(standRow(d, g, {}, '2026-10-20', at(20, 10), 'Torch')).toMatchObject({ big: '5 of your first 6 days', line: 'with no slip · a Torch' });
  });
  it('gentle, after the first week: the last 7 days', () => {
    const d = slip(slip({}, '2026-10-16', '12:00'), '2026-10-21', '12:00');
    expect(standRow(d, g, {}, '2026-10-25', at(25, 10), 'Kindling')).toMatchObject({ big: '6 of the last 7 days', line: 'with no slip · Kindling' });
  });
  it('the morning after a slip, today is already the first day of the count', () => {
    const d = slip(slip({}, '2026-10-14', '12:00'), '2026-10-15', '12:00');
    expect(standRow(d, st, {}, '2026-10-16', at(16, 18), 'Spark')!.big).toBe('1 day');
    expect(standRow(d, g, {}, '2026-10-16', at(16, 18), 'Spark')!.big).not.toMatch(/^0/);
  });
  it('a quieter line: the week’s goal from Sunday (today’s entries are in Today so far)', () => {
    const d = addEvent({}, '2026-10-20', 'rode', '09:00', {}, 1).days;
    const sun = { 's2026-10-18': { sun: { w: [], c: [], g: { t: 'Phone out of the bedroom, 5 nights', k: 'phone' as const, n: 5 } } } } as never;
    const r = standRow(d, st, sun, '2026-10-20', at(20, 10), 'Spark')!;
    expect(r.note).toMatch(/^\d of 5 nights this week$/);
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

describe('the quiet lines (the owner, November 18, 2026: "There are so many pop-ups"; the pop-ups audit)', () => {
  it('a word about reminders, the five questions and a new part are a line, never the card', () => {
    const s0 = st;
    const nudge = { k: 'paused' as const, h: 'Reminders are paused', p: '' };
    for (const dev of [{ nudge }, { recheck: true }, { unlock: 'bed' as const }]) {
      const p = pickMoment(told('2026-10-20'), s0, {}, '2026-10-20', at(20, 10), dev);
      expect(p.card.k).toBe('calm');
      expect(p.line).not.toBeNull();
    }
  });
  it('a day that is done still says so, with the word about reminders as its line', () => {
    const off = normSettings({ ...st, routine: { morning: false, lesson: false, calm: false, reach: false, checkin: false, wind: false } });
    const p = pickMoment({}, off, {}, '2026-10-20', at(20, 21), { nudge: { k: 'off', h: 'Reminders are off', p: '' } });
    expect(p.card.k).toBe('done');
    expect(p.line?.k).toBe('nudge');
  });
});
