/* Unlocked: the parts that wait out of the setup open one at a time, each on its day, spaced apart, never after a slip, and
   low on Today so the lesson stays the next step. */
import { describe, expect, it } from 'vitest';
import { addEvent } from '../src/mutate';
import { defaultSettings } from '../src/legacy/core.js';
import { pickMoment } from '../src/moment';
import { normUnlockMem, UNLOCK_GAP, UNLOCK_WORDS, unlockNow, type UnlockMem } from '../src/unlock';
import type { Days, Settings } from '../src/types';

const st = { ...defaultSettings('2026-10-01'), start: '2026-10-01', day1: '2026-10-01' } as Settings;
/* two lessons done on the first two days */
const base = (): Days =>
  ({
    '2026-10-01': { p: { ls: ['l1'] } },
    '2026-10-02': { p: { ls: ['l2'] } },
  }) as unknown as Days;
const slip = (days: Days, k: string) => addEvent(days, k, 'slipped', '23:00', {}, 1).days;

describe('when a part unlocks', () => {
  it('opens the journal on day 3 with two lessons done, not before', () => {
    expect(unlockNow(base(), st, '2026-10-02', {}, {})).toBeNull();
    expect(unlockNow(base(), st, '2026-10-03', {}, {})).toBe('journal');
    expect(unlockNow({ '2026-10-01': { p: { ls: ['l1'] } } } as unknown as Days, st, '2026-10-05', {}, {})).toBeNull();
  });
  it('never offers the journal to someone already writing in it', () => {
    expect(unlockNow(base(), st, '2026-10-03', {}, { journalUsed: true })).toBeNull();
  });
  it('opens the apps that pull you in from day 7, only on a phone that has it', () => {
    const mem: UnlockMem = { journal: { d: '2026-10-03', o: 1 } };
    expect(unlockNow(base(), st, '2026-10-07', mem, {})).toBeNull();
    expect(unlockNow(base(), st, '2026-10-06', mem, { pull: true })).toBeNull();
    expect(unlockNow(base(), st, '2026-10-07', mem, { pull: true })).toBe('pull');
  });
  it('one at a time, with days between', () => {
    /* the journal came late (day 6): the next waits UNLOCK_GAP days after it */
    const mem: UnlockMem = { journal: { d: '2026-10-06', o: 1 } };
    expect(unlockNow(base(), st, '2026-10-08', mem, { pull: true })).toBeNull();
    expect(unlockNow(base(), st, '2026-10-0' + (6 + UNLOCK_GAP), mem, { pull: true })).toBe('pull');
  });
  it('stays the card on its day until opened, then is gone', () => {
    const mem: UnlockMem = { journal: { d: '2026-10-03' } };
    expect(unlockNow(base(), st, '2026-10-03', mem, {})).toBe('journal');
    expect(unlockNow(base(), st, '2026-10-03', { journal: { d: '2026-10-03', o: 1 } }, {})).toBeNull();
    expect(unlockNow(base(), st, '2026-10-04', mem, {})).toBeNull();
  });
  it('waits on the day of a slip, the day after, and in the quiet hours', () => {
    expect(unlockNow(slip(base(), '2026-10-03'), st, '2026-10-03', {}, {})).toBeNull();
    expect(unlockNow(slip(base(), '2026-10-03'), st, '2026-10-04', {}, {})).toBeNull();
    expect(unlockNow(slip(base(), '2026-10-03'), st, '2026-10-05', {}, {})).toBe('journal');
    expect(unlockNow(base(), st, '2026-10-03', {}, { quiet: true })).toBeNull();
  });
  it('reads a bad memory safely', () => {
    expect(normUnlockMem('x')).toEqual({});
    expect(normUnlockMem({ journal: { d: '2026-10-03', o: true }, pull: 4, zzz: { d: 'a' } })).toEqual({ journal: { d: '2026-10-03', o: 1 } });
  });
});

describe('on Today', () => {
  it('waits behind the lesson as After this', () => {
    const open = pickMoment(base(), st, {}, '2026-10-03', new Date('2026-10-03T12:00').getTime(), { unlock: 'journal' });
    expect(open.card.k).not.toBe('unlock');
    expect(open.more?.k).toBe('unlock');
  });
  it('speaks plainly, with no contractions', () => {
    for (const w of Object.values(UNLOCK_WORDS)) for (const t of Object.values(w)) expect(t).not.toMatch(/[a-z]['’][a-z]/i);
  });
});
