/* Lessons first (docs/plan.md, "Lessons first", C1 and C3): today's lesson is Next up until it is done, and the week's
   lesson days fill a ring of seven on Today that never empties within the week. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/index';

/* 2026-10-14 is a Wednesday; the tests run in America/Chicago time */
const tk = '2026-10-14';
const at = (s: string) => new Date(s).getTime();
const st = core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-02', screensOff: '22:30' });
const finish = (days: Days, k: string, when: string) => core.recordLesson(days, k, core.firstUndone(core.lessonsDone(days))!, at(when)).days;

describe('today’s lesson is Next up until it is done or the night opens', () => {
  it('all day until the night opens: in the morning and in the evening', () => {
    for (const t of ['T08:00', 'T12:00', 'T19:00', 'T21:29']) {
      const now = at(tk + t);
      expect(core.nextUp({}, st, tk, now).k).toBe('lesson');
      expect(core.nextUp({}, st, tk, now).act).toBe('lesson');
      expect(core.stopTiles({}, st, tk, now).cur).toBe('lesson');
      const pick = core.pickMoment({}, st, {}, tk, now);
      expect([pick.card.k, pick.card.go]).toEqual(['calm', 'lesson']);
    }
  });

  it('a check-in or wind-down that has opened meanwhile still says it is open', () => {
    const d = core.stopTiles({}, st, tk, at(tk + 'T19:00'));
    expect(d.tiles.map((x) => [x.k, x.state, x.cur])).toEqual([
      ['lesson', 'now', true],
      ['evening', 'now', false],
      ['night', 'later', false],
    ]);
    expect(core.dayRhythm({}, st, tk, at(tk + 'T08:00')).stops.map((x) => x.state)).toEqual(['next', 'later', 'later']);
    /* the legacy rhythm itself is unchanged */
    expect(core.rhythm({}, st, tk, at(tk + 'T19:00')).cur).toBe('evening');
  });

  it('once it is done, the day moves on as before', () => {
    const d = finish({}, tk, tk + 'T12:00');
    expect(core.nextUp(d, st, tk, at(tk + 'T19:00')).k).toBe('evening');
    expect(core.stopTiles(d, st, tk, at(tk + 'T23:00')).cur).toBe('night');
    expect(core.nextUp(d, st, tk, at(tk + 'T12:30')).k).toBe('evening');
  });

  it('from the time the night opens, the wind-down is the open stop and the lesson says it is still open', () => {
    const d = core.stopTiles({}, st, tk, at(tk + 'T22:30'));
    expect(d.cur).toBe('night');
    expect(d.tiles.map((x) => [x.k, x.state])).toEqual([
      ['lesson', 'due'],
      ['evening', 'due'],
      ['night', 'now'],
    ]);
    expect(core.openTile({}, st, tk, at(tk + 'T22:30'))!.go).toBe('wind');
    /* until then the lesson comes first, and after Goodnight it is the open one again */
    expect(core.stopTiles({}, st, tk, at(tk + 'T21:29')).cur).toBe('lesson');
    const down = core.phoneAway({}, tk, '22:30', at(tk + 'T22:30'), st);
    expect(core.stopTiles(down, st, tk, at(tk + 'T22:40')).cur).toBe('lesson');
  });

  it('a night with the wind-down switched off keeps the lesson first', () => {
    const off = core.routineDay({}, st, tk, 'wind', false);
    expect(core.stopTiles(off, st, tk, at(tk + 'T23:00')).cur).toBe('lesson');
  });

  describe('the night of a slip', () => {
    const slipped = (d: Days): Days => core.withDay(d, tk, { ...d[tk], status: 'clean', events: [{ id: 's', t: '20:00', outcome: 'slipped' }] } as never);

    it('leaves only the wind-down', () => {
      const d = core.stopTiles(slipped({}), st, tk, at(tk + 'T22:30'));
      expect(d.tiles.map((x) => x.k)).toEqual(['night']);
      expect(d.cur).toBe('night');
    });

    it('leaves the whole day open before the night', () => {
      expect(core.stopTiles(slipped({}), st, tk, at(tk + 'T21:00')).tiles.map((x) => x.k)).toEqual(['lesson', 'evening', 'night']);
    });

    it('keeps what was done on the line and takes nothing earned', () => {
      const read = finish({}, tk, tk + 'T12:00');
      const before = core.gameCompute(slipped(read), st, {}, tk).pts;
      const d = core.stopTiles(slipped(read), st, tk, at(tk + 'T22:30'));
      expect(d.tiles.map((x) => [x.k, x.done])).toEqual([
        ['lesson', true],
        ['night', false],
      ]);
      expect(core.gameCompute(slipped(read), st, {}, tk).pts).toBe(before);
    });

    it('after Goodnight, it says rest and does not say everything is done', () => {
      const down = core.phoneAway(slipped({}), tk, '22:30', at(tk + 'T22:30'), st);
      expect(core.stopTiles(down, st, tk, at(tk + 'T22:40')).cur).toBe(null);
      const last = core.moments(down, st, {}, tk, at(tk + 'T22:40')).at(-1)!;
      expect([last.k, last.h]).toEqual(['done', 'Rest well.']);
    });
  });

  it('the line puts what is done first, then the big card, then what is still open', () => {
    const tile = (k: string, done = false) => ({ k, done }) as core.StopTile;
    const keys = (done: string[], big: string | null) =>
      core
        .lineOrder(
          ['lesson', 'evening', 'night'].map((k) => tile(k, done.includes(k))),
          big,
        )
        .map((t) => t.k);
    expect(keys([], 'night')).toEqual(['night', 'lesson', 'evening']);
    expect(keys(['evening'], 'night')).toEqual(['evening', 'night', 'lesson']);
    expect(keys(['lesson'], 'night')).toEqual(['lesson', 'night', 'evening']);
    /* by day the card is already in its place, and with no card the day keeps its order */
    expect(keys([], 'lesson')).toEqual(['lesson', 'evening', 'night']);
    expect(keys(['lesson'], 'evening')).toEqual(['lesson', 'evening', 'night']);
    expect(keys(['lesson'], null)).toEqual(['lesson', 'evening', 'night']);
  });

  it('a day with the lesson switched off has no lesson stop to put first', () => {
    const off = core.routineDay({}, st, tk, 'lesson', false);
    expect(core.nextUp(off, st, tk, at(tk + 'T19:00')).k).toBe('evening');
  });

  it('without an account, past the free lessons, it is a re-read, still first', () => {
    let d: Days = {};
    for (let i = core.LEARN_FREE; i >= 1; i--) d = finish(d, core.addDays(tk, -i), core.addDays(tk, -i) + 'T12:00');
    const n = core.nextUp(d, st, tk, at(tk + 'T19:00'), false);
    expect([n.k, n.act, n.pts]).toEqual(['lesson', 'lesson', 5]);
  });
});

describe('the week’s lesson days: a ring of seven', () => {
  it('runs Monday to Sunday and counts the days with a lesson', () => {
    let d: Days = {};
    d = finish(d, '2026-10-12', '2026-10-12T12:00');
    d = finish(d, '2026-10-14', '2026-10-14T09:00');
    /* last Sunday is last week */
    d = finish(d, '2026-10-11', '2026-10-11T12:00');
    const w = core.lessonWeek(d, tk);
    expect(w.days.map((x) => x.k)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    expect(w.days.map((x) => x.on)).toEqual([true, false, true, false, false, false, false]);
    expect(w.days.map((x) => x.today)).toEqual([false, false, true, false, false, false, false]);
    expect(w.n).toBe(2);
    /* on a Sunday, the whole week is in it */
    expect(core.lessonWeek(d, '2026-10-11').days[0].k).toBe('2026-10-05');
    expect(core.lessonWeek(d, '2026-10-11').n).toBe(1);
  });

  it('a re-read counts as that day’s lesson; nothing else does', () => {
    let d = finish({}, '2026-10-12', '2026-10-12T12:00');
    d = core.recordLesson(d, '2026-10-13', core.lessonById('l1')!, at('2026-10-13T12:00')).days;
    d = core.addEvent(d, tk, 'rode', '20:00', {}, 1).days;
    expect(core.lessonWeek(d, tk).n).toBe(2);
  });

  it('never empties within the week, and a slip never touches it', () => {
    let d: Days = {};
    for (const k of ['2026-10-12', '2026-10-13']) d = finish(d, k, k + 'T12:00');
    const counts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const k = core.addDays('2026-10-12', i);
      if (i === 3) d = core.addEvent(d, k, 'slipped', '23:00', {}, 1).days;
      counts.push(core.lessonWeek(d, k).n);
    }
    expect(counts).toEqual([1, 2, 2, 2, 2, 2, 2]);
    /* a new week is a new ring */
    expect(core.lessonWeek(d, '2026-10-19').n).toBe(0);
  });
});
