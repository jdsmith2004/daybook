/* The morning after a night SOS that was ridden out: one line at the morning stop, what helped, and the note for next time
   asked there once (the end of the check-in does not ask it at night). */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { DayEvent, Days, Settings } from '../src/types';

const st: Settings = core.normSettings({ start: '2026-10-25', day1: '2026-11-01' });
const D = '2026-11-10'; // a Tuesday
const M = core.addDays(D, 1); // the morning after

type Ev = Partial<DayEvent>;
const sos = (o: Ev = {}): Ev => ({
  id: 'u1',
  time: '01:30',
  outcome: 'rode',
  m: 12,
  st: 'high',
  tr: [
    ['breathe', 's'],
    ['bed', 'p'],
  ],
  ...o,
});
const day = (k: string, evs: Ev[]): Days => ({ [k]: core.normDay({ events: evs }, k) });

describe('last night’s win', () => {
  it('says the urge ridden out at night, how strong it was, how long it took, and what was tried, the one that worked first', () => {
    const w = core.nightWin(day(D, [sos()]), st, M)!;
    expect(w).toMatchObject({
      k: D,
      evId: 'u1',
      n: 1,
      eyebrow: 'Last night · Tuesday',
      line: 'Last night you rode one out at 1:30 AM.',
      sub: 'Very strong at the start. It passed in 12 minutes.',
      rode: 1,
      askNote: true,
      mins: 12,
    });
    expect(w.helped.map((h) => h.id)).toEqual(['bed', 'breathe']);
    expect(w.helped[0]).toEqual({ id: 'bed', name: 'Go to bed', ic: 'moon' });
  });

  it('counts 10 PM to 5 AM: late on the day before, or early on the new day', () => {
    expect(core.nightWin(day(D, [sos({ time: '23:10' })]), st, M)?.line).toBe('Last night you rode one out at 11:10 PM.');
    expect(core.nightWin(day(M, [sos({ time: '04:30' })]), st, M)?.line).toBe('Last night you rode one out at 4:30 AM.');
    expect(core.nightWin(day(D, [sos({ time: '20:30' })]), st, M)).toBeNull();
    expect(core.nightWin(day(M, [sos({ time: '06:00' })]), st, M)).toBeNull();
    /* the same win is not last night's two mornings later */
    expect(core.nightWin(day(D, [sos()]), st, core.addDays(M, 1))).toBeNull();
  });

  it('is only an SOS ridden out, and not a night with a slip (that has the sunrise check)', () => {
    expect(core.nightWin(day(D, [{ id: 'q', time: '23:00', outcome: 'rode' }]), st, M)).toBeNull();
    expect(core.nightWin(day(D, [sos(), { id: 's', time: '02:40', outcome: 'slipped' }]), st, M)).toBeNull();
    /* a slip earlier in the evening is not last night */
    expect(core.nightWin(day(D, [{ id: 's', time: '19:00', outcome: 'slipped' }, sos()]), st, M)?.evId).toBe('u1');
  });

  it('two in one night: both counted, the last one named', () => {
    const w = core.nightWin(day(D, [sos({ id: 'b', time: '01:30' }), sos({ id: 'a', time: '23:15', st: undefined, tr: undefined, m: 5 })]), st, M)!;
    expect(w.line).toBe('Last night you rode out 2 urges, the last at 1:30 AM.');
    expect(w.evId).toBe('b');
    const one = core.nightWin(day(D, [sos({ st: undefined, tr: undefined, m: 0 })]), st, M)!;
    expect(one.sub).toBe('It passed in under a minute.');
    expect(one.helped).toEqual([]);
  });

  it('asks for the note only while there is none', () => {
    expect(core.nightWin(day(D, [sos()]), { ...st, note: 'It passes. It always does.' }, M)?.askNote).toBe(false);
    expect(core.nightWin(day(D, [sos()]), { ...st, note: '   ' }, M)?.askNote).toBe(true);
  });

  it('starts the note in the person’s voice', () => {
    expect(core.winNote({ mins: 12 }, 'breathe')).toBe('Breathing slowly helped. It passed in 12 minutes. It will pass again.');
    expect(core.winNote({ mins: 1 }, null)).toBe('It passed in 1 minute. It will pass again.');
    expect(core.winNote({ mins: 12 }, 'nope')).toBe('It passed in 12 minutes. It will pass again.');
  });

  it('is said on the morning stop’s tile, before the two questions', () => {
    const now = new Date(2026, 10, 11, 7, 30).getTime();
    const t = core.stopTiles(day(D, [sos()]), st, M, now).tiles.find((x) => x.k === 'morning')!;
    expect(t.body).toMatch(/^Last night you rode one out at 1:30 AM\. Then two quick questions/);
    const plain = core.stopTiles({}, st, M, now).tiles.find((x) => x.k === 'morning')!;
    expect(plain.body).toMatch(/^Two quick questions about last night/);
  });
});

describe('the note waits for the morning (asked once)', () => {
  it('after an SOS ridden out at night, when the morning stop will show', () => {
    expect(core.winLater(st, D, sos())).toBe(true);
    expect(core.winLater(st, D, sos({ time: '22:30' }))).toBe(true);
  });

  it('not after one in the day, a slip, an entry that was not SOS, or when there is no morning stop', () => {
    expect(core.winLater(st, D, sos({ time: '15:00' }))).toBe(false);
    expect(core.winLater(st, D, sos({ outcome: 'slipped' }))).toBe(false);
    expect(core.winLater(st, D, { outcome: 'rode', time: '01:30' })).toBe(false);
    expect(core.winLater(st, D, null)).toBe(false);
    expect(core.winLater({ ...st, routine: { ...st.routine, morning: false } }, D, sos())).toBe(false);
    /* the very first morning has no stop: before 5 AM on the first day */
    expect(core.winLater(st, st.start, sos({ time: '04:30' }))).toBe(false);
    expect(core.winLater(st, st.start, sos({ time: '23:00' }))).toBe(true);
  });
});
