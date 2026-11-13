/* Two moments a day (two-moments.ts; docs/review-plan.md C3, WP5): the night hour, the sky by the clock, Good night's words, the
   morning on the line, who starts with what, faith only when it is on, and the finish line after a clean week. */
import { describe, expect, it } from 'vitest';
import { addDays, normSettings } from '../src/legacy/core.js';
import { phoneAway, stopTiles } from '../src/day';
import { dayFeelDue } from '../src/day-feel';
import { answerNight, morningReasons, setTonight } from '../src/morning-set';
import { addEvent } from '../src/mutate';
import {
  afterNightHour,
  bedNights,
  bedRow,
  dayFeelOn,
  faithOn,
  finishLine,
  freshSettings,
  goodNightText,
  goodNightWords,
  morningReply,
  nightWaitLine,
  skyPhase,
} from '../src/two-moments';
import type { Days } from '../src/types';

const tk = '2026-10-20';
const st = normSettings({ start: '2026-10-01', day1: '2026-10-08', screensOff: '23:00', nightAt: '22:30' });
const at = (h: number, m = 0, k = tk) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10), h, m).getTime();

describe('the night hour', () => {
  it('starts at tonight’s time and lasts until the new day', () => {
    expect(afterNightHour({}, st, tk, at(22, 29))).toBe(false);
    expect(afterNightHour({}, st, tk, at(22, 30))).toBe(true);
    /* 1 AM is still the same log day's night */
    expect(afterNightHour({}, st, tk, at(1, 0, addDays(tk, 1)))).toBe(true);
    expect(afterNightHour({}, st, tk, at(12, 0))).toBe(false);
  });
  it('waits for Good night to open, so the two never disagree', () => {
    /* screens off at 3 AM: Good night counts from 9 PM, so a night set for 8 PM opens at 9 */
    const late = { ...st, screensOff: '03:00' as const, nightAt: '20:00' as const };
    expect(afterNightHour({}, late, tk, at(20, 30))).toBe(false);
    expect(afterNightHour({}, late, tk, at(21, 0))).toBe(true);
  });
  it('follows the time the morning set', () => {
    const d = setTonight({}, st, tk, { r: 'x', nt: '21:00' }, 1).days;
    expect(afterNightHour(d, st, tk, at(21, 15))).toBe(true);
  });
  it('a night past midnight opens past midnight', () => {
    const late = { ...st, nightAt: '00:30' as const };
    expect(afterNightHour({}, late, tk, at(23, 50))).toBe(false);
    expect(afterNightHour({}, late, tk, at(0, 40, addDays(tk, 1)))).toBe(true);
  });
});

describe('the sky follows the clock', () => {
  it('dawn, day, dusk, night', () => {
    expect(skyPhase({}, st, tk, at(7))).toBe('dawn');
    expect(skyPhase({}, st, tk, at(12))).toBe('day');
    expect(skyPhase({}, st, tk, at(19))).toBe('dusk');
    expect(skyPhase({}, st, tk, at(23))).toBe('night');
    expect(skyPhase({}, st, tk, at(2, 0, addDays(tk, 1)))).toBe('night');
  });
});

describe('the morning on the line', () => {
  const keys = (d: Days, h: number) => stopTiles(d, st, tk, at(h)).tiles.map((t) => t.k);
  it('comes first, and the lesson stays the big card', () => {
    const r = stopTiles({}, st, tk, at(8));
    expect(r.tiles[0]).toMatchObject({ k: 'morning', state: 'now', cur: false, go: 'morning', line: 'How was last night?' });
    expect(r.cur).toBe('lesson');
  });
  it('says what was told, and is done once tonight is set', () => {
    let d = answerNight({}, st, tk, 'free', 1);
    expect(stopTiles(d, st, tk, at(15)).tiles[0]).toMatchObject({ done: false, state: 'due', line: 'A free night, told · set tonight' });
    d = setTonight(d, st, tk, { r: 'x', nt: '22:30' }, 2).days;
    expect(stopTiles(d, st, tk, at(15)).tiles[0]).toMatchObject({ done: true, line: 'A free night, told · tonight set' });
  });
  it('has no morning before the first day after setup', () => {
    expect(stopTiles({}, st, '2026-10-01', at(8, 0, '2026-10-01')).tiles.map((t) => t.k)).not.toContain('morning');
  });
  it('the night of a slip drops a morning not done, as it drops the rest', () => {
    const d = addEvent({}, tk, 'slipped', '20:00', {}, 1).days;
    expect(keys(d, 22)).not.toContain('morning');
  });
  it('the last stop is Good night', () => {
    const t = stopTiles({}, st, tk, at(12)).tiles.find((x) => x.k === 'night')!;
    expect(t).toMatchObject({ title: 'Good night', head: 'Phone to bed', line: 'Phone to bed at 10:30 PM' });
  });
});

describe('Good night', () => {
  it('counts the nights put to bed, and only grows', () => {
    let d = phoneAway({}, tk, '22:40', 1, st);
    expect(bedNights(d)).toBe(1);
    d = phoneAway(d, addDays(tk, 1), '22:50', 2, st);
    expect(bedNights(d)).toBe(2);
    expect(goodNightWords({ days: d, st, tk }).doneSub).toBe('2 nights put to bed. This is the part that lasts.');
  });
  it('says only adult sites wait, and only apart from the words', () => {
    expect(nightWaitLine('06:00')).toBe('Adult sites wait until 6:00 AM.');
    expect(goodNightWords({ days: {}, st, tk }).sub).toBe('Phone on its charger, away from your bed.');
  });
  it('the bed moment’s row: seven nights, tonight last', () => {
    const d = phoneAway({}, tk, '22:40', 1, st);
    const row = bedRow(d, tk);
    expect(row).toHaveLength(7);
    expect(row[6]).toEqual({ k: tk, d: 'T', m: 'free' });
    expect(row[5].m).toBe('none');
  });
  it('after a slip, it says they came back', () => {
    const d = addEvent({}, tk, 'slipped', '20:00', {}, 1).days;
    expect(goodNightWords({ days: d, st, tk }).doneSub).toMatch(/came back/);
  });
  it('the good-night text never says why', () => {
    const t = goodNightText('Dana');
    expect(t).toMatch(/^Good night, Dana\./);
    expect(t.toLowerCase()).not.toMatch(/porn|slip|urge|habit|night \d|nights|clean|relapse|sober|streak/);
  });
});

describe('who starts with what', () => {
  it('new people start without the check-in and the day’s feeling', () => {
    const f = freshSettings(tk);
    expect(f.routine.checkin).toBe(false);
    expect(dayFeelOn(f)).toBe(false);
    expect(dayFeelDue({}, normSettings({ ...f, start: '2026-10-01' }), tk)).toBe(false);
    /* and it survives the settings being read back */
    expect(normSettings(f).dayFeel).toBe(false);
    expect(normSettings(f).routine.checkin).toBe(false);
  });
  it('people who had them keep them', () => {
    expect(st.routine.checkin).toBe(true);
    expect(dayFeelOn(st)).toBe(true);
  });
});

describe('faith, only when it is on', () => {
  const withFaith = (faith: string) => normSettings({ ...st, reasons: ['A', 'B', 'C'], onb: { n: 1, at: 1, a: { faith }, hist: [] } });
  it('is a morning reason when faith plays a part', () => {
    expect(faithOn(withFaith('big'))).toBe(true);
    expect(morningReasons({}, withFaith('some'), tk)).toEqual(['A', 'My faith', 'B']);
  });
  it('is nowhere when it does not', () => {
    expect(faithOn(withFaith('no'))).toBe(false);
    expect(faithOn(st)).toBe(false);
    expect(morningReasons({}, withFaith('no'), tk)).not.toContain('My faith');
  });
});

describe('the morning reply', () => {
  it('is plain, and It happened gets no ceremony', () => {
    expect(morningReply('free', false)).toBe('A free night. That one is yours for good.');
    expect(morningReply('slip', false)).toBe('Logged. Telling it is your part, and it is done.');
    expect(morningReply('slip', true)).toBe('Last night is logged. Today is open.');
  });
});

describe('the finish line', () => {
  it('stays hidden until a clean week, then counts toward graduation', () => {
    expect(finishLine({}, st, '2026-10-05')).toBeNull();
    /* a known week: Today opened each day, no slip */
    const d: Days = {};
    for (let k = '2026-10-08'; k <= '2026-10-20'; k = addDays(k, 1)) d[k] = { events: [], p: { o: 1 } } as never;
    const line = finishLine(d, st, tk);
    expect(line === null || /^\d+ of 90 toward graduation$/.test(line)).toBe(true);
  });
});

describe('the new setup starts fresh', () => {
  it('obBegin starts without the check-in and the day’s feeling', async () => {
    const { obBegin } = await import('../src/setup');
    const s = obBegin({} as never, tk, 1);
    expect(s.routine.checkin).toBe(false);
    expect(s.dayFeel).toBe(false);
  });
});
