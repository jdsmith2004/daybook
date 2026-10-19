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

it('the words make no demand and promise nothing for money', () => {
  const all = JSON.stringify(core.TIP_WORDS);
  expect(all).not.toMatch(/n't|alive|only \d|%|unlock (more|every)|premium/i);
  expect(core.TIP_WORDS.p).toContain('nothing to unlock');
});

it('the Support button on Today hides in the days after a slip, and with no link', () => {
  expect(core.tipButton({}, tk, url)).toBe(true);
  expect(core.tipButton({}, tk, '')).toBe(false);
  expect(core.tipButton(core.addEvent({}, core.addDays(tk, 1 - core.TIP_CALM), 'slipped', '21:00').days, tk, url)).toBe(false);
  expect(core.tipButton(core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '21:00').days, tk, url)).toBe(true);
});

it('the setup shows its free page only when a link is set, just before the end', () => {
  const ids = core.obPages({}).map((p) => p.id);
  expect(ids.includes('free')).toBe(!!core.SUPPORT_URL);
  const all = core.OB_PAGES.map((p) => p.id);
  expect(all.indexOf('free')).toBe(all.indexOf('done') - 1);
});
