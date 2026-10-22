/* Support: one tip ask on Today, at a good moment, never in a hard one, and nothing at all with no link set. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';
const url = 'https://example.org/tip';
const st0 = (start: string) => core.normSettings({ ...core.defaultSettings(start), day1: core.addDays(start, 7) });
const month = st0(core.addDays(tk, -core.TIP_AFTER));

it('with no link set, nothing asks', () => {
  expect(core.SUPPORT_URL === '' || core.SUPPORT_URL.startsWith('https://')).toBe(true);
  expect(core.tipAsk({}, month, tk, 12, null, '')).toBe(false);
});

it('asks a month in, in the daytime only', () => {
  expect(core.tipAsk({}, month, tk, 12, null, url)).toBe(true);
  expect(core.tipAsk({}, st0(core.addDays(tk, 1 - core.TIP_AFTER)), tk, 12, null, url)).toBe(false);
  expect(core.tipAsk({}, month, tk, core.TIP_HOURS[0] - 1, null, url)).toBe(false);
  expect(core.tipAsk({}, month, tk, core.TIP_HOURS[1], null, url)).toBe(false);
  expect(core.tipAsk({}, month, tk, core.TIP_HOURS[1] - 1, null, url)).toBe(true);
});

it('never asks within four days of a slip, which covers the Rekindle quest', () => {
  for (let d = 0; d < core.TIP_CALM; d++) {
    expect(core.tipAsk(core.addEvent({}, core.addDays(tk, -d), 'slipped', '21:00').days, month, tk, 12, null, url)).toBe(false);
  }
  expect(core.tipAsk(core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '21:00').days, month, tk, 12, null, url)).toBe(true);
  expect(core.tipAsk(core.addEvent({}, tk, 'rode', '21:00').days, month, tk, 12, null, url)).toBe(true);
});

it('waits three hours after any SOS or any slip', () => {
  const now = new Date(2026, 9, 15, 12, 0).getTime();
  const H = 3600_000;
  expect(core.tipAsk({}, month, tk, 12, null, url, { now, sos: null })).toBe(true);
  expect(core.tipAsk({}, month, tk, 12, null, url, { now, sos: now - 10 * 60_000 })).toBe(false);
  expect(core.tipAsk({}, month, tk, 12, null, url, { now, sos: now - core.TIP_QUIET * H + 60_000 })).toBe(false);
  expect(core.tipAsk({}, month, tk, 12, null, url, { now, sos: now - core.TIP_QUIET * H - 60_000 })).toBe(true);
  /* a slip (on its own the four calm days hold the ask longer; the three hours hold either way) */
  expect(core.tipQuiet(core.addEvent({}, tk, 'slipped', '10:30').days, month, { now, sos: null })).toBe(true);
  expect(core.tipQuiet(core.addEvent({}, tk, 'slipped', '08:30').days, month, { now, sos: null })).toBe(false);
  expect(core.tipQuiet(core.addEvent({}, tk, 'rode', '11:30').days, month, { now, sos: null })).toBe(false);
  /* after midnight, a slip is on the evening's log day */
  const late = new Date(2026, 9, 16, 2, 0).getTime();
  expect(core.tipQuiet(core.addEvent({}, tk, 'slipped', '01:00').days, month, { now: late, sos: null })).toBe(true);
});

it('never sits next to the account card, and waits a few days after its "Not now"', () => {
  expect(core.tipAsk({}, month, tk, 12, 'week', url)).toBe(false);
  const no = core.accountLater(month, core.addDays(tk, 1 - core.TIP_GAP), 1).st;
  expect(core.tipAsk({}, no, tk, 12, null, url)).toBe(false);
  const later = core.accountLater(month, core.addDays(tk, -core.TIP_GAP), 1).st;
  expect(core.tipAsk({}, later, tk, 12, null, url)).toBe(true);
});

it('asks once: after either answer, Today never asks again', () => {
  const st = core.tipAnswered(month, tk, 1).st;
  expect(st.tipAsk).toBe(tk);
  expect(core.tipAsk({}, st, core.addDays(tk, 200), 12, null, url)).toBe(false);
});

it('the words are honest about the need, never threaten, and promise nothing for money', () => {
  const all = JSON.stringify(core.TIP_WORDS);
  expect(all).not.toMatch(/n't|alive|only \d|%|unlock (more|every)|premium/i);
  expect(core.TIP_WORDS.p).toContain('nothing to pay for');
  expect(all).not.toMatch(/shut|close down|go away|lose/i);
});

it('the Support button on Today hides in the days after a slip, and with no link', () => {
  expect(core.tipButton({}, tk, url)).toBe(true);
  expect(core.tipButton({}, tk, '')).toBe(false);
  expect(core.tipButton(core.addEvent({}, core.addDays(tk, 1 - core.TIP_CALM), 'slipped', '21:00').days, tk, url)).toBe(false);
  expect(core.tipButton(core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '21:00').days, tk, url)).toBe(true);
});

it('the setup has no tip page: the tip jar is on Today and More, and the welcome page says Daybook is free', () => {
  expect(core.OB_PAGES.some((p) => p.id === 'free')).toBe(false);
});
