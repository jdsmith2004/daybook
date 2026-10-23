/* "Do you like Daybook so far?": asked once, at the end of a new person's setup, never on a walk-through, never after a slip
   or an SOS, and never again once answered. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-23';
const now = new Date(2026, 9, 23, 12, 0).getTime();
const st = core.normSettings({ ...core.defaultSettings(tk), day1: core.addDays(tk, 1) });
const calm = { now, sos: null };

it('asks a new person at the end of setup', () => {
  expect(core.likeAskDue({}, st, false, calm)).toBe(true);
});

it('never asks on a walk-through, so people who finished setup before the question existed never see it', () => {
  expect(core.likeAskDue({}, st, true, calm)).toBe(false);
  /* an older record has no answer at all and still is not asked, because only a new person's setup asks */
  const old = core.normSettings({ ...core.defaultSettings('2026-09-01') });
  expect(old.likeAsk).toBeUndefined();
  expect(core.likeAskDue({}, old, true, calm)).toBe(false);
});

it('needs saved settings', () => {
  expect(core.likeAskDue({}, null, false, calm)).toBe(false);
});

it('asks once: after either answer it never asks again, and the answer is kept with the day', () => {
  for (const a of ['yes', 'no'] as const) {
    const next = core.likeAnswer(st, a, tk, now + 1).st;
    expect(next.likeAsk).toEqual({ a, d: tk });
    expect(next.u).toBeGreaterThan(st.u);
    expect(core.likeAnsweredAlready(next)).toBe(true);
    expect(core.likeAskDue({}, next, false, calm)).toBe(false);
  }
  expect(core.likeAnsweredAlready(st)).toBe(false);
});

it('the answer survives normSettings (a backup or sync round trip)', () => {
  const next = core.likeAnswer(st, 'yes', tk, now).st;
  expect(core.normSettings(JSON.parse(JSON.stringify(next))).likeAsk).toEqual({ a: 'yes', d: tk });
});

it('never asks after a slip', () => {
  const days = core.addEvent({}, tk, 'slipped', '10:00').days;
  expect(core.likeAskDue(days, st, false, calm)).toBe(false);
  expect(core.likeAskDue(core.addEvent({}, tk, 'rode', '10:00').days, st, false, calm)).toBe(true);
});

it('never asks after an SOS: one open in the last hours, or an urge logged through SOS', () => {
  expect(core.likeAskDue({}, st, false, { now, sos: now - 5 * 60_000 })).toBe(false);
  expect(core.likeAskDue({}, st, false, { now, sos: now - (core.LIKE_QUIET * 3600_000 - 1000) })).toBe(false);
  expect(core.likeAskDue({}, st, false, { now, sos: now - (core.LIKE_QUIET * 3600_000 + 1000) })).toBe(true);
  const sos = core.addEvent({}, tk, 'rode', '10:00', { st: 'high', m: 4 }).days;
  expect(core.likeAskDue(sos, st, false, calm)).toBe(false);
});

it('the words are plain: no contractions, no pressure', () => {
  const all = JSON.stringify(core.LIKE_WORDS);
  expect(all).not.toMatch(/n't|'s |'re |'ll |'ve |5 stars|must|please rate/i);
  expect(core.LIKE_WORDS.q).toBe('Do you like Daybook so far?');
});
