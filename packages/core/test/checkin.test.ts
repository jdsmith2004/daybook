/* The three-number check-in (October 24, 2026): mood, urges and stress, then Goodnight, which saves the check-in and puts
   the phone away in one tap. Days saved with the older four numbers still read, show and edit as they did. */
import { describe, expect, it } from 'vitest';
import { ASKED, checkinAnswered, checkinFormOf, logRateKeys, moodOf, rateKeys, saveCheckin, sayGoodnight, stopTiles, type CheckinForm } from '../src/day';
import { addDays, daysCsv, normCheckin, normDay, normSettings } from '../src/legacy/core.js';
import { changeDay } from '../src/mutate';
import { loggedDay } from '../src/log-start';
import { dayRow, weekView } from '../src/journal';
import { patDiffs, patKeys } from '../src/pattern';
import { weekFeel } from '../src/nudges';
import { runLedger } from '../src/legacy/core.js';
import type { Days } from '../src/types';

const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '22:30' });
const tk = '2026-10-24';
const blank = (): CheckinForm => checkinFormOf({}, tk);
const at = (h: number, m = 0) => new Date(2026, 9, 24, h, m).getTime();

describe('the three numbers', () => {
  it('asks mood, urges and stress, in that order', () => {
    expect(ASKED).toEqual(['md', 'u', 's']);
  });
  it('keeps mood and urges when answered, and leaves them out when not, so older days read as before', () => {
    const d = saveCheckin({}, tk, { ...blank(), md: 7, u: 2, s: 4 }, 1);
    expect(d[tk].checkin).toMatchObject({ md: 7, u: 2, s: 4, m: null, done: true });
    const none = saveCheckin({}, tk, { ...blank(), s: 4 }, 1);
    expect('md' in none[tk].checkin!).toBe(false);
    expect('u' in none[tk].checkin!).toBe(false);
    expect(checkinFormOf(d, tk)).toMatchObject({ md: 7, u: 2, s: 4 });
  });
  it('survives being read back from storage or sync, and an answer out of range is dropped', () => {
    expect(normCheckin({ md: 6, u: 0, s: 3 })).toMatchObject({ md: 6, u: 0, s: 3 });
    expect(normCheckin({ md: 11, u: -1 })).not.toHaveProperty('md');
    expect(normCheckin({ md: 11, u: -1 })).not.toHaveProperty('u');
    const day = normDay({ d: tk, events: [], checkin: { md: 5, done: true, at: 1 }, p: null, u: 1 }, tk);
    expect(day.checkin?.md).toBe(5);
  });
  it('editing an older day keeps its motivation, connection and energy', () => {
    const old = saveCheckin({}, '2026-10-10', { m: 6, c: 5, e: 4, s: 3, ro: null, n: '' }, 1);
    const f = checkinFormOf(old, '2026-10-10');
    expect(f).toMatchObject({ md: null, u: null, m: 6, c: 5, e: 4 });
    const again = saveCheckin(old, '2026-10-10', { ...f, md: 8 }, 2);
    expect(again['2026-10-10'].checkin).toMatchObject({ md: 8, m: 6, c: 5, e: 4, s: 3 });
  });
  it('a draft from before mood was asked still loads and saves', () => {
    const draft = { m: null, c: null, e: null, s: 5, ro: 'Y', n: 'ok' } as CheckinForm;
    expect(checkinAnswered(draft)).toBe(true);
    expect(saveCheckin({}, tk, draft, 1)[tk].checkin).toMatchObject({ s: 5, ro: 'Y', n: 'ok' });
  });
  it('a check-in with only a mood in it is kept, and starts the log', () => {
    const d = changeDay(null, tk, (x) => void (x.checkin = { ...normCheckin({})!, md: 4 }), 1);
    expect(d?.checkin?.md).toBe(4);
    expect(loggedDay(d)).toBe(true);
  });
  it('knows when nothing is answered yet', () => {
    expect(checkinAnswered(blank())).toBe(false);
    expect(checkinAnswered({ ...blank(), u: 0 })).toBe(true);
    expect(checkinAnswered({ ...blank(), n: '  ' })).toBe(false);
    expect(checkinAnswered({ ...blank(), n: 'a line' })).toBe(true);
  });
});

describe('what shows', () => {
  it('one check-in shows the three asked now, and an older day its own four', () => {
    expect(rateKeys({ md: 7, u: 2, s: 3 })).toEqual(['md', 'u', 's']);
    expect(rateKeys({ s: 3 })).toEqual(['md', 'u', 's']);
    expect(rateKeys({ m: 6, c: 5, e: null, s: 3 })).toEqual(['m', 'c', 'e', 's']);
    /* an older day edited with a mood shows both */
    expect(rateKeys({ md: 8, m: 6, s: 3 })).toEqual(['md', 'u', 'm', 's']);
  });
  it('a log shows each rating it holds, stress always, and the three asked now when it holds none', () => {
    expect(logRateKeys({})).toEqual(['md', 'u', 's']);
    const old = saveCheckin({}, '2026-10-10', { m: 6, c: 5, e: 4, s: 3, ro: null, n: '' }, 1);
    expect(logRateKeys(old)).toEqual(['m', 'c', 'e', 's']);
    const both = saveCheckin(old, tk, { ...blank(), md: 7, u: 1 }, 2);
    expect(logRateKeys(both)).toEqual(['md', 'u', 'm', 'c', 'e', 's']);
  });
  it('mood is the mood, or motivation on an older day', () => {
    expect(moodOf({ md: 2, m: 9 })).toBe(2);
    expect(moodOf({ m: 9 })).toBe(9);
    expect(moodOf(null)).toBeNull();
  });
  it('the check-in stop says the mood and stress once saved', () => {
    const d = saveCheckin({}, tk, { ...blank(), md: 7, u: 2, s: 3 }, 1);
    expect(stopTiles(d, st, tk, at(21)).tiles.find((t) => t.k === 'evening')!.line).toBe('Mood 7 · Stress 3');
    const u = saveCheckin({}, tk, { ...blank(), u: 2 }, 1);
    expect(stopTiles(u, st, tk, at(21)).tiles.find((t) => t.k === 'evening')!.line).toBe('Urges 2');
  });
  it('the Journal row and the week say mood and urges', () => {
    const d = saveCheckin({}, tk, { ...blank(), md: 7, u: 2, s: 3 }, 1);
    expect(dayRow(d, st, tk, tk, runLedger(d, st, tk)).rate).toBe('Mood 7 · Urges 2 · Stress 3');
    const v = weekView(d, st, tk, 99);
    expect(v.avgs.map((a) => a.l + ' ' + a.v)).toEqual(['Mood 7.0', 'Urges 2.0', 'Stress 3.0']);
    expect(v.avgs[0].vals.filter((x) => x != null)).toEqual([7]);
  });
  it('the week compares with the week before', () => {
    let d = saveCheckin({}, tk, { ...blank(), md: 7 }, 1);
    d = saveCheckin(d, addDays(tk, -7), { ...blank(), md: 5 }, 2);
    expect(weekView(d, st, tk, 99).avgs[0].move).toBe('↑ 2.0 vs last week');
  });
  it('the export has a column for each', () => {
    const d = saveCheckin({}, tk, { ...blank(), md: 7, u: 2, s: 3 }, 1);
    const [head, ...rows] = daysCsv(d, st, tk).trim().split('\r\n');
    const cells = (line: string) => line.slice(1, -1).split('","');
    const cols = cells(head);
    const row = cells(rows[rows.length - 1]);
    expect(row[cols.indexOf('Mood')]).toBe('7');
    expect(row[cols.indexOf('Urges')]).toBe('2');
    expect(row[cols.indexOf('Stress')]).toBe('3');
  });
  it('hard days compare mood and urges too', () => {
    let d: Days = {};
    for (let i = 0; i < 8; i++) {
      const k = addDays('2026-10-01', i);
      const slip = i % 2 === 0;
      if (slip) d = { ...d, [k]: { d: k, events: [{ id: 'e' + i, outcome: 'slipped', time: '22:00', at: 1 } as never], checkin: null, p: null, u: 1 } };
      d = saveCheckin(d, k, { ...checkinFormOf(d, k), md: slip ? 3 : 7, u: slip ? 8 : 3 }, 2);
    }
    const r = patDiffs(d, patKeys('30', d, st, '2026-10-08'));
    expect(r.list.map((x) => x.k)).toEqual(['u', 'md']);
    expect(r.list[0].line).toBe('Urges were higher on slip days: 8 out of 10, against 3.');
    expect(r.list[1].line).toBe('Mood was lower on slip days: 3 out of 10, against 7.');
  });
  it('a heavy few days read the mood', () => {
    let d: Days = {};
    for (let i = 0; i < 3; i++) d = saveCheckin(d, addDays(tk, -i), { ...blank(), md: 2, m: 9 }, 1);
    expect(weekFeel(d, tk)).toBe('heavy');
  });
});

describe('Goodnight', () => {
  it('saves the check-in and puts the phone away in one tap: both evening stops are done', () => {
    const d = sayGoodnight({}, tk, { ...blank(), md: 6, u: 1, s: 2, h: 7 }, '22:10', 5, st);
    expect(d[tk].checkin).toMatchObject({ md: 6, u: 1, s: 2, h: 7, so: 'Y', done: true });
    expect(d[tk].p?.po).toBe('22:10');
    const tiles = stopTiles(d, st, tk, at(22, 12)).tiles;
    expect(tiles.find((t) => t.k === 'evening')!.done).toBe(true);
    expect(tiles.find((t) => t.k === 'night')!.done).toBe(true);
  });
  it('with nothing answered, it is only the phone away, and the check-in stays open', () => {
    const d = sayGoodnight({}, tk, blank(), '22:10', 5, st);
    expect(d[tk].p?.po).toBe('22:10');
    expect(d[tk].checkin?.done).toBe(false);
    expect(sayGoodnight({}, tk, null, '23:40', 5, st)[tk].checkin).toBeNull();
  });
  it('keeps sleep saved earlier when the form leaves it alone', () => {
    let d = saveCheckin({}, tk, { ...blank(), h: 8 }, 1);
    d = sayGoodnight(d, tk, { ...checkinFormOf(d, tk), h: undefined, md: 5 }, '22:00', 2, st);
    expect(d[tk].checkin).toMatchObject({ h: 8, md: 5 });
  });
});
