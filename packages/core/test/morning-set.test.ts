/* The morning set (morning-set.ts): when it opens, last night's honest answer (a slip on the night before, with no time, never twice),
   this morning's feel, tonight's reason and time, the record kept on the day through clean-up and sync, and what the other parts read. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { keepNewer } from '../src/sync';
import type { Days } from '../src/types';

/* started October 7, Day 1 October 14 */
const st = core.normSettings({ start: '2026-10-07', day1: '2026-10-14', reasons: ['Being ready for a real, honest relationship', 'Doing my best work'] });
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const tk = '2026-10-21';
const y = '2026-10-20';

describe('when it opens', () => {
  it('in the morning, once a day, after the setup day, until set or closed', () => {
    expect(core.morningDue({}, st, tk, at(21, 7))).toBe(true);
    expect(core.morningDue({}, st, tk, at(21, 4))).toBe(true);
    expect(core.morningDue({}, st, tk, at(21, 3, 59))).toBe(false);
    expect(core.morningDue({}, st, tk, at(21, 13, 59))).toBe(true);
    expect(core.morningDue({}, st, tk, at(21, 14))).toBe(false);
    /* before the new day starts it is still last night's log day */
    const late = core.normSettings({ ...st, rollover: 6 });
    expect(core.morningDue({}, late, tk, at(21, 5))).toBe(false);
    expect(core.morningDue({}, late, tk, at(21, 6))).toBe(true);
    /* not on the setup day, and not before setup */
    expect(core.morningDue({}, st, st.start, at(7, 8))).toBe(false);
    expect(core.morningDue({}, null, tk, at(21, 8))).toBe(false);
    /* closed: skipped for today, and that costs nothing */
    const skipped = core.skipMorning({}, tk, at(21, 7));
    expect(core.morningDue(skipped, st, tk, at(21, 8))).toBe(false);
    expect(core.dayPoints(skipped, tk, st).total).toBe(0);
    expect(core.partDone(skipped, st, tk)).toBe(false);
    /* answered but not set (the app was closed between the pages): it opens again, starting on the answer */
    const half = core.answerNight({}, st, tk, 'free', at(21, 7));
    expect(core.morningDue(half, st, tk, at(21, 8))).toBe(true);
    expect(core.lastNightStart(half, st, tk)).toBe('free');
    /* set */
    const set = core.setTonight(half, st, tk, { r: 'Doing my best work', nt: '22:30' }, at(21, 7, 1)).days;
    expect(core.morningDue(set, st, tk, at(21, 9))).toBe(false);
  });
});

describe('How was last night?', () => {
  it('Free of it adds nothing to the log, and marks the morning (the morning win counts as the fire’s part)', () => {
    const d = core.answerNight({}, st, tk, 'free', at(21, 7));
    expect(d[y]).toBeUndefined();
    expect(d[tk].p?.m).toBe(true);
    expect(core.winsOf(d, tk, st).morning).toBe(true);
    expect(core.partDone(d, st, tk)).toBe(true);
    expect(core.nightTold(d, y)).toBe('free');
  });
  it('It happened is a slip on the night before, with no time, told the next morning: an honest log like any other', () => {
    const d = core.answerNight({}, st, tk, 'slip', at(21, 7));
    const ev = d[y].events;
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ outcome: 'slipped', time: null, mn: true });
    expect(core.sumDay(d[y]).slipped).toBe(1);
    expect(core.dayPoints(d, y, st).parts.find((x) => x.k === 'log')?.pts).toBe(5);
    expect(core.nightTold(d, y)).toBe('slip');
    expect(core.lastNightSlip(d, tk)).toEqual({ k: y, id: ev[0].id });
    /* the hard hours never learn a made-up time from it */
    expect(core.nightSlips(d, st, y)).toHaveLength(1);
  });
  it('never logs the night twice: a slip that night already logged is the one', () => {
    const had = core.addEvent({}, y, 'slipped', '23:40', {}, at(20, 23, 41));
    const d = core.answerNight(had.days, st, tk, 'slip', at(21, 7));
    expect(d[y].events).toHaveLength(1);
    expect(core.lastNightStart(had.days, st, tk)).toBe('slip');
    expect(core.lastNightSlip(d, tk)).toEqual({ k: y, id: had.id });
    /* a slip in the afternoon is not last night: the morning still asks, and It happened adds the night's */
    const noon = core.addEvent({}, y, 'slipped', '14:00', {}, at(20, 14)).days;
    expect(core.lastNightStart(noon, st, tk)).toBe(null);
    expect(core.answerNight(noon, st, tk, 'slip', at(21, 7))[y].events).toHaveLength(2);
    /* past midnight, before the new day, is still that night */
    const late = core.addEvent({}, y, 'slipped', '01:30', {}, at(21, 1, 30)).days;
    expect(core.lastNightStart(late, st, tk)).toBe('slip');
  });
  it('changing the answer back takes away only the slip the morning added', () => {
    let d = core.answerNight({}, st, tk, 'slip', at(21, 7));
    d = core.answerNight(d, st, tk, 'free', at(21, 7, 1));
    expect(d[y]?.events.length ?? 0).toBe(0);
    expect(core.nightTold(d, y)).toBe('free');
    /* and a slip the person logged themselves stays, whatever the morning says */
    const had = core.addEvent({}, y, 'slipped', '23:40', {}, 1).days;
    expect(core.answerNight(core.answerNight(had, st, tk, 'slip', 2), st, tk, 'free', 3)[y].events).toHaveLength(1);
  });
  it('the night before tracking began is not logged', () => {
    const d = core.answerNight({}, st, '2026-10-07', 'slip', at(7, 8));
    expect(d['2026-10-06']).toBeUndefined();
  });
});

describe('And this morning?', () => {
  it('is kept on the morning, answers the day’s feel when it is open, and the day does not ask again', () => {
    let d = core.setMorningFeel({}, tk, 3, at(21, 7));
    expect(core.morningOf(d[tk])?.f).toBe(3);
    expect(core.dayFeelOf(d[tk])?.w).toBe('Good');
    expect(core.dayFeelDue(d, st, tk)).toBe(false);
    d = core.setMorningFeel(d, tk, null, at(21, 7, 1));
    expect(core.morningOf(d[tk])?.f).toBeUndefined();
    /* the morning set alone keeps the day's question closed */
    expect(core.dayFeelDue(core.answerNight({}, st, tk, 'free', 1), st, tk)).toBe(false);
  });
  it('the Sunday review can show how mornings after free nights felt against the others', () => {
    let d: Days = {};
    for (const [day, n, f] of [
      [15, 'free', 3],
      [16, 'free', 3],
      [17, 'slip', 1],
      [18, 'free', 2],
      [19, 'slip', 3],
    ] as const) {
      const k = '2026-10-' + day;
      d = core.setMorningFeel(core.answerNight(d, st, k, n, at(day, 7)), k, f, at(day, 7));
    }
    expect(core.wakeAfter(d, tk)).toEqual({ free: { good: 2, n: 3 }, other: { good: 1, n: 2 } });
  });
});

describe('Who are you doing tonight for?', () => {
  it('offers the person’s own reasons, then who they are becoming, at most four; the starting ones when there are none', () => {
    const s2 = core.normSettings({ ...st, becoming: 'I am becoming someone who keeps his word.' });
    expect(core.morningReasons({}, s2, tk)).toEqual([
      'Being ready for a real, honest relationship',
      'Doing my best work',
      'I am becoming someone who keeps his word.',
    ]);
    const none = core.normSettings({ start: '2026-10-07', reasons: [], why: '' });
    expect(core.morningReasons({}, none, tk).length).toBe(3);
  });
  it('Set tonight keeps the reason and time on today, and the time is tomorrow’s starting one', () => {
    expect(core.nightAtStart(core.normSettings({ start: '2026-10-07', screensOff: '23:00' }))).toBe('23:00');
    const r = core.setTonight({}, st, tk, { r: 'Doing my best work', nt: '23:00' }, at(21, 7, 40));
    const ms = core.morningOf(r.days[tk]);
    expect(ms).toMatchObject({ r: 'Doing my best work', nt: '23:00', set: at(21, 7, 40) });
    expect(r.st.nightAt).toBe('23:00');
    expect(core.nightAtStart(r.st)).toBe('23:00');
    expect(r.days[tk].p?.m).toBe(true);
    /* the reason picked last time comes first the next morning */
    expect(core.morningReasons(r.days, r.st, '2026-10-22')[0]).toBe('Doing my best work');
  });
});

describe('what the other parts read', () => {
  const r1 = core.setTonight({}, st, '2026-10-19', { r: 'Doing my best work', nt: '22:00' }, at(19, 7));
  const r2 = core.setTonight(r1.days, r1.st, y, { r: 'Being ready for a real, honest relationship', nt: '22:30' }, at(20, 7, 40));
  it('tonight: today’s choice, or the last morning’s carried over, or the starting time with no reason', () => {
    expect(core.tonightOf(r2.days, r2.st, y)).toEqual({
      at: '22:30',
      r: 'Being ready for a real, honest relationship',
      rAt: at(20, 7, 40),
      from: y,
      today: true,
    });
    expect(core.tonightOf(r2.days, r2.st, tk)).toMatchObject({ at: '22:30', from: y, today: false });
    expect(core.tonightOf(r2.days, r2.st, '2026-10-30')).toEqual({ at: '22:30', r: null, rAt: null, from: null, today: false });
  });
  it('mornings set, in a row, and free nights', () => {
    expect(core.morningsSet(r2.days, '2026-10-14', tk)).toBe(2);
    expect(core.morningRun(r2.days, tk)).toBe(2);
    expect(core.morningRun(r2.days, y)).toBe(2);
    expect(core.morningRun(r2.days, '2026-10-23')).toBe(0);
    const d = core.answerNight(core.answerNight(r2.days, st, y, 'free', 1), st, tk, 'slip', 2);
    expect(core.freeNights(d, '2026-10-14', tk)).toEqual({ free: 1, told: 2 });
    expect(core.firstMorning(d, tk)).toBe('2026-10-19');
  });
});

describe('kept like the rest of the day', () => {
  it('survives the day’s clean-up, a backup, and an older app that does not know it', () => {
    const d = core.setTonight(core.answerNight({}, st, tk, 'slip', 1), st, tk, { r: 'Doing my best work', nt: '22:30' }, 2).days;
    const again = core.normDay(JSON.parse(JSON.stringify(d[tk])), tk);
    expect(again.p?.ms).toEqual(d[tk].p?.ms);
    expect(core.normDay(JSON.parse(JSON.stringify(d[y])), y).events[0].mn).toBe(true);
    /* a day holding only a skip is still a day */
    expect(core.skipMorning({}, tk, 5)[tk]).toBeTruthy();
    /* junk is dropped */
    expect(core.normDay({ p: { ms: { n: 'maybe', nt: '25:00', f: 7 } } }, tk).p).toBe(null);
    /* an older app sends the day back without ms or mn: they come back */
    const old = { ...d[tk], p: { ...d[tk].p!, ms: undefined } };
    delete (old.p as { ms?: unknown }).ms;
    expect(keepNewer(old, d[tk]).p?.ms).toEqual(d[tk].p?.ms);
    const oldY = { ...d[y], events: d[y].events.map(({ mn: _mn, ...e }) => e) };
    expect(keepNewer(oldY, d[y]).events[0].mn).toBe(true);
  });
  it('the golden rules do not move: an It happened slip counts like a slip logged with no time', () => {
    const a = core.answerNight({}, st, tk, 'slip', 1);
    const b = core.addEvent({}, y, 'slipped', null, {}, 1).days;
    const ga = core.gameCompute(a, st, {}, tk);
    const gb = core.gameCompute(b, st, {}, tk);
    expect(ga.level.n).toBe(gb.level.n);
    expect(core.dayPoints(a, y, st)).toEqual(core.dayPoints(b, y, st));
  });
});

describe('the words', () => {
  it('are plain, with no contractions, no points and no blame', () => {
    const all = [...Object.values(core.MORNING_WORDS), core.tonightLine({ waits: false, habit: 'porn' }), core.tonightLine({ waits: true, habit: 'porn' })];
    for (const w of all) {
      expect(w).not.toMatch(/n[’']t\b|[’'](re|ll|ve|m|d)\b|\bit[’']s\b/i);
      expect(w).not.toMatch(/\b(fail|failed|bad|wrong|should|reset|lost|points?|streak)\b/i);
    }
    expect(core.tonightLine({ waits: true, habit: 'alcohol' })).toBe('Phone down at');
    expect(core.tonightLine({ waits: true, habit: 'porn' })).toBe('Adult sites wait from');
    expect(core.morningHello(at(21, 7))).toBe('Good morning · Wednesday');
  });
});
