/* "How long does it usually last?", asked once of people who set up before setup asked it (lasts-ask.ts): at a good moment, never
   twice, never on a day another ask came, and its answer fills in Time given back. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const start = '2026-10-20';
const tk = '2026-11-20';
const now = new Date(2026, 10, 20, 12, 0).getTime();
const before = new Date(2026, 9, 20, 9, 0).getTime();
const onb = (a: Record<string, unknown>, at = before) => ({ n: 1, at, a, hist: [] });
/* a 1.3.4 person: how often answered, how long not, set up a month ago */
const old = core.normSettings({ ...core.defaultSettings(start), day1: start, onb: onb({ habit: 'porn', freq: 'f2' }) });
const calm: core.LikeNear = { now, sos: null };
const due = (s: core.Settings | null, days: core.Days = {}, k = tk, near = calm) => core.lastsAskDue(days, s, k, near);

it('asks a person who set up before the question came back', () => {
  expect(core.lastsAskFor(old)).toBe(true);
  expect(due(old)).toBe(true);
});

it('never asks someone who answered it, who set up after it came back (a skip there was their answer), or who has no how often', () => {
  const answered = core.normSettings({ ...old, onb: onb({ habit: 'porn', freq: 'f2', mins: 'm1' }) });
  expect(due(answered)).toBe(false);
  const fresh = core.normSettings({ ...old, onb: onb({ habit: 'porn', freq: 'f2' }, core.LASTS_SETUP_FROM + 1000) });
  expect(due(fresh)).toBe(false);
  const noFreq = core.normSettings({ ...old, onb: onb({ habit: 'porn' }) });
  expect(due(noFreq)).toBe(false);
  expect(due(core.normSettings({ ...old, onb: null }))).toBe(false);
  expect(due(null)).toBe(false);
});

it('is asked once: shown, skipped or answered, it never comes again, and that survives a sync round trip', () => {
  const shown = core.lastsShown(old, tk, now).st;
  for (let i = 0; i < 200; i += 3) expect(due(shown, {}, core.addDays(tk, i))).toBe(false);
  expect(core.normSettings(JSON.parse(JSON.stringify(shown))).lastsAt).toBe(tk);
});

it('the answer goes where setup keeps it, and Time given back fills in', () => {
  expect(core.timeBack({}, old, tk)).toBeNull();
  const ans = core.lastsAnswer(old, 'm2', tk, now).st;
  expect(ans.onb!.a.mins).toBe('m2');
  expect(ans.onb!.a.freq).toBe('f2');
  expect(ans.lastsAt).toBe(tk);
  expect(core.timeBack({}, ans, tk)).not.toBeNull();
});

it('waits for a good moment: not after a slip, an SOS, on the morning the flame was lit, or the first days', () => {
  expect(due(old, core.addEvent({}, tk, 'slipped', '01:00').days)).toBe(false);
  expect(due(old, core.addEvent({}, core.addDays(tk, -1), 'slipped', '10:00').days)).toBe(false);
  expect(due(old, {}, tk, { now, sos: now - 3600_000 })).toBe(false);
  expect(due(old, {}, core.addDays(start, 1))).toBe(false);
});

it('one ask a day: not on a day another ask came, and none comes on the day it did', () => {
  for (const k of ['tipAsk', 'tipMo', 'acctNo', 'acctNudge', 'likeAt'] as const) expect(due(core.normSettings({ ...old, [k]: tk }))).toBe(false);
  const shown = core.lastsShown(old, tk, now).st;
  expect(core.likeAskDue({}, shown, tk, calm)).toBe(false);
  expect(core.accountAsk({}, shown, tk, 1, false)).toBeNull();
});

it("asks in the person's habit's own words and answers, as setup does", () => {
  expect(core.lastsPage(old).h).toBe('How long does it usually last?');
  const drink = core.normSettings({ ...old, onb: onb({ habit: 'alcohol', freq: 'f2' }) });
  const pg = core.lastsPage(drink);
  expect(pg.h).toBe('When you drink, how long does it usually go on?');
  expect(pg.list!.map((x) => x[0])).toEqual(['m1', 'm2', 'm3', 'm4']);
});

it('"lasts" is an ask on the fixed list, and its screen has a name', () => {
  expect(core.evProps({ what: 'lasts' })).toEqual({ what: 'lasts' });
  expect((core.EV_ROUTES as readonly string[]).includes('lasts')).toBe(true);
});

it('the tip card waits on the day it was asked', () => {
  const shown = core.lastsShown(old, tk, now).st;
  expect(core.tipAsk({}, shown, tk, 12, null, 'https://tip.example', calm)).toBe(false);
});
