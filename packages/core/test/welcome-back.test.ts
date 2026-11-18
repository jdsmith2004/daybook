/* Welcome back opens by itself only after real days with the app unopened (away.ts awayBack; the owner, November 18, 2026: "if I
   use the app every single day and I just slip a lot and it's like, hey, welcome back. You came back. It just gets freaking annoying
   because I always come back"). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const day = (n: number) => core.addDays('2026-10-31', n); // day(1) is November 1
const at = (n: number, h: number) => {
  const [y, mo, d] = day(n).split('-').map(Number);
  return new Date(y, mo - 1, d, h).getTime();
};
const st = core.normSettings({ start: day(1), day1: day(1), countFrom: day(1), awayFrom: day(1), truthFrom: day(1) });
const open = (d: Days, n: number): Days => core.markOpen(d, day(n), at(n, 9));
const slip = (d: Days, n: number): Days => core.addEvent(d, day(n), 'slipped', '23:10', {}, at(n, 23)).days;

describe('Welcome back', () => {
  it('never opens for someone who opens Daybook every day and slips often, even with the mornings left unanswered', () => {
    let d: Days = {};
    for (let n = 1; n <= 14; n++) {
      d = open(d, n);
      if (n % 5 === 0) d = slip(d, n);
    }
    /* the nights not told are still a gap the calendar can fill in (back.tsx, from Days) */
    expect(core.awayDue(d, st, day(15))).toMatchObject({ away: false });
    expect(core.awayBack(d, st, day(15))).toBeNull();
    for (let n = 2; n <= 15; n++) expect(core.awayBack(d, st, day(n))).toBeNull();
  });

  it('opens after real days with the app unopened', () => {
    let d: Days = {};
    for (let n = 1; n <= 5; n++) d = core.answerNight(open(d, n), st, day(n), 'free', at(n, 8));
    /* away from day 6 to day 10, back on day 11 (last night is the morning's to ask); the night of day 5, the last before leaving, was never told either */
    const due = core.awayBack(d, st, day(11));
    expect(due).toMatchObject({ from: day(5), to: day(9) });
    /* a weekend away is not time away: two days unopened never open it */
    let w: Days = {};
    for (const n of [1, 2, 3, 4, 5, 8, 9, 10]) w = open(w, n);
    expect(core.awayBack(w, st, day(10))).toBeNull();
  });
});
