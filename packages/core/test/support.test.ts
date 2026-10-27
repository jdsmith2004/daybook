/* Support: the tip card on Today, first a week in and then every two weeks, at a good moment, never in a hard one, and
   never again once the person is a supporter. Nothing at all with no link set. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';
const url = 'https://example.org/tip';
const st0 = (start: string) => core.normSettings({ ...core.defaultSettings(start), day1: core.addDays(start, 7) });
const week = st0(core.addDays(tk, -core.TIP_FIRST));
const tip: core.Supporter = { since: 1, kind: 'tip', until: null, src: 'apple', cents: 500 };

it('with no link set, nothing asks', () => {
  expect(core.SUPPORT_URL === '' || core.SUPPORT_URL.startsWith('https://')).toBe(true);
  expect(core.tipAsk({}, week, tk, 12, null, '')).toBe(false);
});

it('asks first a week in, in the daytime only', () => {
  expect(core.TIP_FIRST).toBe(7);
  expect(core.tipAsk({}, week, tk, 12, null, url)).toBe(true);
  expect(core.tipAsk({}, st0(core.addDays(tk, 1 - core.TIP_FIRST)), tk, 12, null, url)).toBe(false);
  expect(core.tipAsk({}, week, tk, core.TIP_HOURS[0] - 1, null, url)).toBe(false);
  expect(core.tipAsk({}, week, tk, core.TIP_HOURS[1], null, url)).toBe(false);
  expect(core.tipAsk({}, week, tk, core.TIP_HOURS[1] - 1, null, url)).toBe(true);
});

it('never asks within four days of a slip, which covers the Rekindle quest', () => {
  for (let d = 0; d < core.TIP_CALM; d++) {
    expect(core.tipAsk(core.addEvent({}, core.addDays(tk, -d), 'slipped', '21:00').days, week, tk, 12, null, url)).toBe(false);
  }
  expect(core.tipAsk(core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '21:00').days, week, tk, 12, null, url)).toBe(true);
  expect(core.tipAsk(core.addEvent({}, tk, 'rode', '21:00').days, week, tk, 12, null, url)).toBe(true);
});

it('waits three hours after any SOS or any slip', () => {
  const now = new Date(2026, 9, 15, 12, 0).getTime();
  const H = 3600_000;
  expect(core.tipAsk({}, week, tk, 12, null, url, { now, sos: null })).toBe(true);
  expect(core.tipAsk({}, week, tk, 12, null, url, { now, sos: now - 10 * 60_000 })).toBe(false);
  expect(core.tipAsk({}, week, tk, 12, null, url, { now, sos: now - core.TIP_QUIET * H + 60_000 })).toBe(false);
  expect(core.tipAsk({}, week, tk, 12, null, url, { now, sos: now - core.TIP_QUIET * H - 60_000 })).toBe(true);
  /* a slip (on its own the four calm days hold the ask longer; the three hours hold either way) */
  expect(core.tipQuiet(core.addEvent({}, tk, 'slipped', '10:30').days, week, { now, sos: null })).toBe(true);
  expect(core.tipQuiet(core.addEvent({}, tk, 'slipped', '08:30').days, week, { now, sos: null })).toBe(false);
  expect(core.tipQuiet(core.addEvent({}, tk, 'rode', '11:30').days, week, { now, sos: null })).toBe(false);
  /* after midnight, a slip is on the evening's log day */
  const late = new Date(2026, 9, 16, 2, 0).getTime();
  expect(core.tipQuiet(core.addEvent({}, tk, 'slipped', '01:00').days, week, { now: late, sos: null })).toBe(true);
});

it('never sits next to the account card, and waits a few days after its "Not now"', () => {
  expect(core.tipAsk({}, week, tk, 12, 'week', url)).toBe(false);
  const no = core.accountLater(week, core.addDays(tk, 1 - core.TIP_GAP), 1).st;
  expect(core.tipAsk({}, no, tk, 12, null, url)).toBe(false);
  const later = core.accountLater(week, core.addDays(tk, -core.TIP_GAP), 1).st;
  expect(core.tipAsk({}, later, tk, 12, null, url)).toBe(true);
});

it('after an answer, the card waits two weeks, then asks again, and again', () => {
  expect(core.TIP_EVERY).toBe(14);
  const st = core.tipAnswered(week, tk, 1).st;
  expect(st.tipAsk).toBe(tk);
  expect(core.tipAsk({}, st, tk, 12, null, url)).toBe(false);
  expect(core.tipAsk({}, st, core.addDays(tk, core.TIP_EVERY - 1), 12, null, url)).toBe(false);
  expect(core.tipAsk({}, st, core.addDays(tk, core.TIP_EVERY), 12, null, url)).toBe(true);
  const again = core.tipAnswered(st, core.addDays(tk, core.TIP_EVERY), 2).st;
  expect(core.tipAsk({}, again, core.addDays(tk, 2 * core.TIP_EVERY - 1), 12, null, url)).toBe(false);
  expect(core.tipAsk({}, again, core.addDays(tk, 2 * core.TIP_EVERY), 12, null, url)).toBe(true);
  /* the calm-day rules still hold on the day it is due */
  const k = core.addDays(tk, core.TIP_EVERY);
  expect(core.tipAsk(core.addEvent({}, k, 'slipped', '08:00').days, st, k, 12, null, url)).toBe(false);
});

it('a moment of earned value asks too, at a good moment only', () => {
  const now = new Date(2026, 9, 15, 12, 0).getTime();
  expect(core.tipMoment({}, week, tk, 12, url, { now, sos: null })).toBe(true);
  /* never quietly after a slip, never in the quiet hours, never at night, never in the calm days after a slip */
  expect(core.tipMoment({}, week, tk, 12, url, { now, sos: null }, true)).toBe(false);
  expect(core.tipMoment({}, week, tk, 12, url, { now, sos: now - 30 * 60_000 })).toBe(false);
  expect(core.tipMoment({}, week, tk, 22, url, { now, sos: null })).toBe(false);
  expect(core.tipMoment(core.addEvent({}, core.addDays(tk, -2), 'slipped', '21:00').days, week, tk, 12, url, null)).toBe(false);
  expect(core.tipMoment({}, week, tk, 12, '', null)).toBe(false);
  expect(core.tipMoment({}, { ...week, sup: tip }, tk, 12, url, null)).toBe(false);
});

it('never more than one ask of any kind in seven days', () => {
  expect(core.TIP_SPACE).toBe(7);
  /* a moment asked: the card and other moments wait seven days */
  const mo = core.tipMomentShown(week, tk, 1).st;
  expect(mo.tipMo).toBe(tk);
  expect(core.tipAsk({}, mo, tk, 12, null, url)).toBe(false);
  expect(core.tipMoment({}, mo, core.addDays(tk, core.TIP_SPACE - 1), 12, url)).toBe(false);
  expect(core.tipAsk({}, mo, core.addDays(tk, core.TIP_SPACE - 1), 12, null, url)).toBe(false);
  expect(core.tipMoment({}, mo, core.addDays(tk, core.TIP_SPACE), 12, url)).toBe(true);
  expect(core.tipAsk({}, mo, core.addDays(tk, core.TIP_SPACE), 12, null, url)).toBe(true);
  /* the card answered: moments wait seven days, the card itself fourteen */
  const card = core.tipAnswered(week, tk, 1).st;
  expect(core.tipMoment({}, card, core.addDays(tk, core.TIP_SPACE - 1), 12, url)).toBe(false);
  expect(core.tipMoment({}, card, core.addDays(tk, core.TIP_SPACE), 12, url)).toBe(true);
  expect(core.tipAsk({}, card, core.addDays(tk, core.TIP_SPACE), 12, null, url)).toBe(false);
});

it('once the person is a supporter, every ask stops for good', () => {
  const sup = { ...week, sup: tip };
  expect(core.isSupporter(core.normSettings(sup))).toBe(true);
  for (const d of [0, 14, 200]) expect(core.tipAsk({}, sup, core.addDays(tk, d), 12, null, url)).toBe(false);
  expect(core.tipButton({}, tk, url, sup)).toBe(false);
  expect(core.tipButton({}, tk, url, week)).toBe(true);
  /* a monthly plan that ended asks again, gently, like anyone else */
  const ended = { ...week, sup: { ...tip, kind: 'monthly' as const, until: 1000 } };
  expect(core.tipAsk({}, ended, tk, 12, null, url, { now: new Date(2026, 9, 15, 12).getTime(), sos: null })).toBe(true);
});

it('the words are warm, concrete about what $5 opens, and never shame or say anything is owed', () => {
  const all = JSON.stringify(core.TIP_WORDS);
  expect(all).not.toMatch(/n't|alive|only \d|%|premium|owe|should|must|enough|free version|more of it reaches/i);
  expect(all).not.toMatch(/shut|close down|go away|lose your/i);
  /* the asks sell what a tip opens: they never say the free part is enough, or that nobody needs to pay */
  expect(all).not.toMatch(/stays? free|is free|need to pay|have to pay|no need|optional/i);
  expect(core.TIP_WORDS.p).toContain('$5');
  expect(core.TIP_WORDS.p).toMatch(/sync/);
  expect(core.TIP_WORDS.lock.btn).toBe('Unlock with a $5 tip');
  /* the second way on iPhone is offered plainly, never as a deal against Apple's */
  expect(core.TIP_WORDS.sheet.web).not.toMatch(/cheap|less|save|fee|cut|apple takes/i);
  /* nothing promises flame looks while there are none to choose */
  if (!core.LOOKS_READY) expect(all).not.toMatch(/look(s)? for your flame|flame looks/i);
});

it('the Support button on Today hides in the days after a slip, and with no link', () => {
  expect(core.tipButton({}, tk, url)).toBe(true);
  expect(core.tipButton({}, tk, '')).toBe(false);
  /* not in the hours after an SOS, like the other asks */
  const at = Date.parse(tk + 'T12:00:00');
  expect(core.tipButton({}, tk, url, week, at, { now: at, sos: at - 3600_000 })).toBe(false);
  expect(core.tipButton({}, tk, url, week, at, { now: at, sos: at - (core.TIP_QUIET + 1) * 3600_000 })).toBe(true);
  expect(core.tipButton(core.addEvent({}, core.addDays(tk, 1 - core.TIP_CALM), 'slipped', '21:00').days, tk, url)).toBe(false);
  expect(core.tipButton(core.addEvent({}, core.addDays(tk, -core.TIP_CALM), 'slipped', '21:00').days, tk, url)).toBe(true);
});

it('the setup has no tip page: the tip jar is on Today and More, and the welcome page says Daybook is free', () => {
  expect(core.OB_PAGES.some((p) => p.id === 'free')).toBe(false);
});
