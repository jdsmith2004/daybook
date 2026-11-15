/* "Do you like Daybook so far?": asked at good moments until the person says Yes (the owner, November 15, 2026), spaced
   LIKE_EVERY days apart, never in the hours after an SOS or a slip, and never on a day another ask came. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const start = '2026-10-20';
const tk = '2026-10-25';
const now = new Date(2026, 9, 25, 12, 0).getTime();
const st = core.normSettings({ ...core.defaultSettings(start), day1: core.addDays(start, 1) });
const calm: core.LikeNear = { now, sos: null };
const due = (s: core.Settings | null, days: core.Days = {}, k = tk, near = calm) => core.likeAskDue(days, s, k, near);

it('asks at a good moment a few days in', () => {
  expect(due(st)).toBe(true);
});

it('waits LIKE_FIRST days from the start: the first day is setup, with its own account ask', () => {
  expect(due(st, {}, core.addDays(start, core.LIKE_FIRST - 1))).toBe(false);
  expect(due(st, {}, core.addDays(start, core.LIKE_FIRST))).toBe(true);
});

it('needs saved settings', () => {
  expect(due(null)).toBe(false);
});

it('a Yes ends it for good, and survives a backup or sync round trip', () => {
  const yes = core.likeAnswer(st, 'yes', tk, now + 1).st;
  expect(yes.likeAsk).toEqual({ a: 'yes', d: tk });
  expect(yes.u).toBeGreaterThan(st.u);
  expect(core.likeSaidYes(yes)).toBe(true);
  for (let i = 0; i < 400; i += 7) expect(due(yes, {}, core.addDays(tk, i))).toBe(false);
  expect(core.normSettings(JSON.parse(JSON.stringify(yes))).likeAsk).toEqual({ a: 'yes', d: tk });
});

it('"Not yet" is never final: it comes back LIKE_EVERY days later, again and again, until Yes', () => {
  let s = st;
  let k: string = tk;
  for (let round = 0; round < 6; round++) {
    expect(due(s, {}, k)).toBe(true);
    s = core.likeAnswer(s, 'no', k, now).st;
    expect(core.likeSaidYes(s)).toBe(false);
    expect(due(s, {}, core.addDays(k, core.LIKE_EVERY - 1))).toBe(false);
    k = core.addDays(k, core.LIKE_EVERY);
  }
  expect(due(s, {}, k)).toBe(true);
});

it('a question shown and left unanswered waits too, and blocks a tip ask the same day', () => {
  const shown = core.likeShown(st, tk, now).st;
  expect(shown.likeAt).toBe(tk);
  expect(due(shown)).toBe(false);
  expect(due(shown, {}, core.addDays(tk, core.LIKE_EVERY))).toBe(true);
  const st0 = { ...shown, start: '2026-10-01' };
  expect(core.tipMoment({}, st0, tk, 12, 'https://x', calm)).toBe(false);
  expect(core.tipMoment({}, { ...st0, likeAt: core.addDays(tk, -1) }, tk, 12, 'https://x', calm)).toBe(true);
});

it('an old "Not yet" from the setup of before is asked again, once the gap has passed', () => {
  const old = core.normSettings({ ...st, likeAsk: { a: 'no', d: '2026-10-21' } });
  expect(core.likeLast(old)).toBe('2026-10-21');
  expect(due(old, {}, '2026-10-24')).toBe(false);
  expect(due(old, {}, '2026-10-25')).toBe(true);
});

it('never on the day of a slip or the day after; a ridden-out urge is a good moment', () => {
  expect(due(st, core.addEvent({}, tk, 'slipped', '01:00').days)).toBe(false);
  expect(due(st, core.addEvent({}, core.addDays(tk, -1), 'slipped', '10:00').days)).toBe(false);
  expect(due(st, core.addEvent({}, core.addDays(tk, -3), 'slipped', '10:00').days)).toBe(true);
  expect(due(st, core.addEvent({}, tk, 'rode', '10:00').days)).toBe(true);
});

it('never in the hours after an SOS', () => {
  expect(due(st, {}, tk, { now, sos: now - 5 * 60_000 })).toBe(false);
  expect(due(st, {}, tk, { now, sos: now - (core.LIKE_QUIET * 3600_000 - 1000) })).toBe(false);
  expect(due(st, {}, tk, { now, sos: now - (core.LIKE_QUIET * 3600_000 + 1000) })).toBe(true);
});

it('never on a day another ask came: the tip card, a tip on a moment, the account card answered', () => {
  for (const f of ['tipAsk', 'tipMo', 'acctNo', 'acctNudge'] as const) {
    expect(due({ ...st, [f]: tk })).toBe(false);
    expect(due({ ...st, [f]: core.addDays(tk, -1) })).toBe(true);
  }
});

it('a Yes on this phone holds when an account copy still says Not yet', () => {
  const mine = core.likeAnswer(st, 'yes', tk, now).st;
  const theirs = core.likeAnswer(st, 'no', '2026-10-22', now - 1000).st;
  expect(core.accountHere(theirs, mine)?.likeAsk?.a).toBe('yes');
});

it('the words are plain: no contractions, no pressure, no stars', () => {
  const all = JSON.stringify(core.LIKE_WORDS);
  expect(all).not.toMatch(/n't|'s |'re |'ll |'ve |star|must|please rate|review/i);
  expect(core.LIKE_WORDS.q).toBe('Do you like Daybook so far?');
});
