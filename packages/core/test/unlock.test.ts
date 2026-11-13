/* The first week: one new part a day, in order, each on or after its own day, never two on a day, never after a slip or an SOS,
   skipped when already in use, and only for people who came through the short setup. Also run as the unlock simulator from the
   Fable review: three people's first fortnights, a new part never on the same day as another and never on a morning after
   "It happened". */
import { describe, expect, it } from 'vitest';
import { addEvent } from '../src/mutate';
import { addDays, defaultSettings } from '../src/legacy/core.js';
import { pickMoment } from '../src/moment';
import { FIRST_WEEK, firstWeekDay, normUnlockMem, UNLOCK_WORDS, unlockNow, type UnlockEnv, type UnlockId, type UnlockMem } from '../src/unlock';
import type { DayKey, Days, Settings } from '../src/types';

const D0 = '2026-10-01' as DayKey;
const st = { ...defaultSettings(D0), start: D0, day1: D0, fw: D0 } as Settings;
const day = (n: number) => addDays(D0, n) as DayKey;
const slip = (days: Days, k: string) => addEvent(days, k, 'slipped', '23:00', {}, 1).days;
const all: UnlockEnv = { pull: true };

/** walk the days, opening each card the day it comes; returns the day each part came on */
function walk(days: Days, s: Settings, env: (n: number) => UnlockEnv, upto = 14): Partial<Record<UnlockId, number>> {
  let mem: UnlockMem = {};
  const got: Partial<Record<UnlockId, number>> = {};
  for (let n = 0; n <= upto; n++) {
    const id = unlockNow(days, s, day(n), mem, env(n));
    if (id) {
      expect(got[id], id + ' twice').toBeUndefined();
      got[id] = n;
      mem = { ...mem, [id]: { d: day(n), o: 1 } };
      /* opened: nothing else that day */
      expect(unlockNow(days, s, day(n), mem, env(n))).toBeNull();
    }
  }
  return got;
}

describe('the first week', () => {
  it('reads a bad memory safely', () => {
    expect(normUnlockMem('x')).toEqual({});
    expect(normUnlockMem({ bed: { d: '2026-10-03', o: true }, doors: 4, zzz: { d: 'a' } })).toEqual({ bed: { d: '2026-10-03', o: 1 } });
  });
  it('is only for people who came through the short setup', () => {
    const old = { ...st, fw: undefined } as Settings;
    expect(firstWeekDay(old, day(3))).toBeNull();
    for (let n = 0; n < 10; n++) expect(unlockNow({}, old, day(n), {}, all)).toBeNull();
    expect(firstWeekDay(st, day(3))).toBe(3);
  });
  it('brings one part a day, each on its own day, in order', () => {
    const got = walk({}, st, () => all);
    expect(got).toEqual(Object.fromEntries(FIRST_WEEK.map(([id, d]) => [id, d])));
    /* nothing on the day of setup or the first morning */
    expect(unlockNow({}, st, day(0), {}, all)).toBeNull();
    expect(unlockNow({}, st, day(1), {}, all)).toBeNull();
  });
  it('moves the rest a day when one is missed, and never doubles up', () => {
    /* the app was not opened on days 2 to 4: day 5 brings the bed, and the rest follow a day apart */
    let mem: UnlockMem = {};
    const seen: [number, UnlockId][] = [];
    for (let n = 5; n <= 12; n++) {
      const id = unlockNow({}, st, day(n), mem, all);
      if (id) {
        seen.push([n, id]);
        mem = { ...mem, [id]: { d: day(n), o: 1 } };
      }
    }
    expect(seen).toEqual([
      [5, 'bed'],
      [6, 'person'],
      [7, 'plan'],
      [8, 'doors'],
      [9, 'voice'],
    ]);
  });
  it('keeps the card for its day until opened, then it is gone', () => {
    const mem: UnlockMem = { bed: { d: day(2) } };
    expect(unlockNow({}, st, day(2), mem, all)).toBe('bed');
    /* the next day brings the next one: the bed lives where it always lives */
    expect(unlockNow({}, st, day(3), mem, all)).toBe('person');
  });
  it('waits a day after "It happened" and in the hours after an SOS', () => {
    const days = slip({}, day(2));
    /* the slip was on night 2: told on morning 3. Nothing on 2 or 3; the bed comes on 4 */
    const got = walk(days, st, () => all);
    expect(got.bed).toBe(4);
    expect(got.person).toBe(5);
    expect(unlockNow({}, st, day(2), {}, { ...all, quiet: true })).toBeNull();
  });
  it("brings the phone's bed only to people quitting porn", () => {
    const drink = { ...st, onb: { n: 1, at: 1, a: { habit: 'alcohol' }, hist: [] } } as Settings;
    expect(walk({}, drink, () => all).bed).toBeUndefined();
  });
  it('skips a part already in use', () => {
    const named = { ...st, safePerson: 'Sam' } as Settings;
    const got = walk({}, named, () => ({ bedUsed: true, voiceUsed: true }));
    /* no bed, no person, no doors (no Screen Time here), no voice: only the plan, on its own day */
    expect(got).toEqual({ plan: 4 });
  });
  it('never brings two new things on one day, for three different first fortnights', () => {
    const sam = slip(slip(slip({}, day(1)), day(3)), day(4));
    const maya = slip({}, day(6));
    const dan = {};
    for (const [days, env] of [
      [sam, (n: number) => ({ quiet: n === 8 })],
      [maya, () => all],
      [dan, (n: number) => ({ ...all, bedUsed: n > 3 })],
    ] as [Days, (n: number) => UnlockEnv][]) {
      const got = walk(days, st, env);
      const when = Object.values(got);
      expect(new Set(when).size).toBe(when.length);
      for (const n of when) {
        expect(n).toBeGreaterThanOrEqual(2);
        /* never the day of a slip or the morning after */
        expect(!!(days[day(n)] || days[day(n - 1)]) && [day(n), day(n - 1)].some((k) => (days[k]?.events || []).some((e) => e.outcome === 'slipped'))).toBe(
          false,
        );
      }
    }
  });
});

describe('on Today', () => {
  it('waits behind the lesson as After this', () => {
    const open = pickMoment({}, st, {}, day(2), new Date(day(2) + 'T12:00').getTime(), { unlock: 'bed' });
    expect(open.card.k).not.toBe('unlock');
    expect(open.more?.k).toBe('unlock');
  });
  it('speaks plainly, with no contractions and never "unlocked"', () => {
    for (const w of Object.values(UNLOCK_WORDS)) for (const t of Object.values(w)) expect(t).not.toMatch(/[a-z]['’][a-z]/i);
    for (const w of Object.values(UNLOCK_WORDS)) expect(w.eb).not.toMatch(/unlock/i);
  });
});

describe('the first line of the plan', () => {
  it('asks about the hardest moment setup heard, and once kept, the first week counts it as done', async () => {
    const { obPlanLine, setPlanLine } = await import('../src/setup');
    const withLate = { ...st, onb: { n: 1, at: 1, a: { when: ['lonely'] }, hist: [] } } as Settings;
    const x = obPlanLine(withLate);
    expect(x.ask).toBe('you feel lonely or low');
    const kept = setPlanLine(withLate, x.opts[0], 0);
    expect(kept.plan[1]).toEqual({ when: 'I am lonely or low', then: x.opts[0] });
    expect(unlockNow({}, kept, day(4), { bed: { d: day(2), o: 1 }, person: { d: day(3), o: 1 } }, {})).toBeNull();
    expect(unlockNow({}, withLate, day(4), { bed: { d: day(2), o: 1 }, person: { d: day(3), o: 1 } }, {})).toBe('plan');
  });
});
