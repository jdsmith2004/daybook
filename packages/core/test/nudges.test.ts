/* Notifications that fit the person: skipped when done, capped, kinder after a slip, a backup once the habit holds,
   quieter when ignored, and a fade to silence when the app goes quiet. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, NudgeLog, NudgePrefs } from '../src/index';

/* 2026-10-14 is a Wednesday; the tests run in America/Chicago time */
const tk = '2026-10-14';
const at = (s: string) => new Date(s).getTime();
const st = core.normSettings({ ...core.defaultSettings('2026-09-01'), day1: '2026-09-02', screensOff: '22:30' });
const ci: NudgePrefs = { ...core.NUDGE_DEFAULTS, lesson: false, checkin: true, risk: false };
const log0 = core.nudgeLogNew();
const plan = (days: Days, prefs: NudgePrefs, now: number, log: NudgeLog = log0, k = tk, allowed = true) =>
  core.nudgePlan(days, st, {}, prefs, log, k, now, allowed);
const routine = (p: core.Nudge[]) => p.filter((n) => n.k !== 'back');
const checkedIn = (days: Days, k: string, when: string): Days => ({
  ...days,
  [k]: {
    d: k,
    events: [],
    p: null,
    u: 1,
    checkin: { m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: true, at: at(when) },
  },
});
const slip = (days: Days, k: string, time: string) => core.addEvent(days, k, 'slipped', time, {}, 1).days;

describe('the plan', () => {
  it('is empty with nothing turned on, or before setup', () => {
    expect(routine(plan({}, { ...core.NUDGE_DEFAULTS, lesson: false, risk: false }, at('2026-10-14T09:00')))).toEqual([]);
    expect(plan({}, { ...core.NUDGE_DEFAULTS, lesson: false, risk: false }, at('2026-10-14T09:00'), log0, tk, false)).toEqual([]);
    expect(core.nudgePlan({}, null, {}, ci, log0, tk, at('2026-10-14T09:00'), true)).toEqual([]);
  });

  it('covers today and tomorrow at the set time, and skips what is done or past', () => {
    const p = routine(plan({}, ci, at('2026-10-14T09:00')));
    expect(p.map((n) => [n.id, n.at, n.body])).toEqual([
      ['checkin-2026-10-14', at('2026-10-14T18:00'), core.wordsOf(core.pickWords('checkin', log0, '2026-10-14'), st)],
      ['checkin-2026-10-15', at('2026-10-15T18:00'), core.wordsOf(core.pickWords('checkin', log0, '2026-10-15'), st)],
    ]);
    expect(routine(plan(checkedIn({}, tk, '2026-10-14T14:00'), ci, at('2026-10-14T14:05'))).map((n) => n.d)).toEqual(['2026-10-15']);
    expect(routine(plan({}, ci, at('2026-10-14T18:30'))).map((n) => n.d)).toEqual(['2026-10-15']);
  });

  it('when the app goes quiet, fades: five come-back notes over a month, each with something in it, then nothing', () => {
    const p = plan({}, ci, at('2026-10-14T21:40')).filter((n) => n.k === 'back');
    expect(p.map((n) => n.d)).toEqual(['2026-10-16', '2026-10-18', '2026-10-21', '2026-10-28', '2026-11-13']);
    /* with no opens known, at the hour the app is open now when that is daytime, else 6 PM */
    expect(new Date(p[0].at).getHours()).toBe(18);
    expect(new Date(plan({}, ci, at('2026-10-14T13:20')).filter((n) => n.k === 'back')[2].at).toTimeString().slice(0, 5)).toBe('13:00');
    expect(p.map((n) => n.body)).toEqual(core.NUDGE_WORDS.back);
    expect(p.map((n) => n.pic)).toEqual(['flame-steady', 'flame-steady', 'flame-ember', 'flame-ember', 'flame-asleep']);
    expect(p[4].body).toBe('This is the last note for now. Daybook stays quiet until you open it, and everything is kept.');
    expect(plan({}, { ...ci, back: false }, at('2026-10-14T09:00')).some((n) => n.k === 'back')).toBe(false);
    /* nothing past the last note */
    expect(Math.max(...plan({}, ci, at('2026-10-14T09:00')).map((n) => n.at))).toBe(at('2026-11-13T09:00'));
  });

  it('the come-back notes are for anyone the phone lets Daybook notify, even with only the heads-up on', () => {
    expect(plan({}, { ...core.NUDGE_DEFAULTS }, at('2026-10-14T09:00')).filter((n) => n.k === 'back').length).toBe(5);
    expect(plan({}, { ...core.NUDGE_DEFAULTS, lesson: false, risk: false }, at('2026-10-14T09:00')).filter((n) => n.k === 'back').length).toBe(5);
    expect(plan({}, ci, at('2026-10-14T09:00'), log0, tk, false).some((n) => n.k === 'back')).toBe(false);
  });

  it('the ladder comes at the hour the app is usually open, from a month of opens', () => {
    /* most evenings around 8 PM for a month, a few late nights, and lunch the last few days */
    const opens: number[] = [];
    for (let i = 1; i <= 27; i++) opens.push(at(core.addDays(tk, -i) + 'T20:10'));
    for (let i = 1; i <= 27; i += 3) opens.push(at(core.addDays(tk, -i) + 'T23:30'), at(core.addDays(tk, -i) + 'T23:50'), at(core.addDays(tk, -i) + 'T01:15'));
    for (let i = 1; i <= 3; i++) opens.push(at(core.addDays(tk, -i) + 'T12:05'));
    opens.push(at('2026-08-01T15:00'), at('2026-08-02T15:00'));
    const log = { ...log0, opens };
    expect(core.usualHour(log, at('2026-10-14T09:00'))).toBe(20);
    const back = plan({}, ci, at('2026-10-14T09:00'), log).filter((n) => n.k === 'back');
    expect(back.map((n) => new Date(n.at).toTimeString().slice(0, 5))).toEqual(['20:00', '20:00', '20:00', '20:00', '20:00']);
    /* recent days weigh more: a week of lunchtimes beats three weeks back of evenings */
    const shift = [...opens.filter((t) => t < at('2026-10-04T00:00')), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => at(core.addDays(tk, -i) + 'T12:30'))];
    expect(core.usualHour({ opens: shift }, at('2026-10-14T09:00'))).toBe(12);
    /* nothing at night: only late-night opens fall back to the hour now, else 6 PM */
    expect(core.usualHour({ opens: [at('2026-10-13T23:30'), at('2026-10-13T02:00')] }, at('2026-10-14T02:30'))).toBe(18);
    expect(core.usualHour({ opens: [] }, at('2026-10-14T10:40'))).toBe(10);
  });

  it('tender words when the person left on a hard day', () => {
    const words = (d: Days) =>
      plan(d, ci, at('2026-10-14T22:00'))
        .filter((n) => n.k === 'back')
        .map((n) => n.body);
    expect(words(slip({}, tk, '21:30'))).toEqual(core.NUDGE_WORDS.tender);
    expect(words(slip({}, core.addDays(tk, -1), '23:30'))).toEqual(core.NUDGE_WORDS.tender);
    expect(words(slip({}, core.addDays(tk, -3), '21:30'))).toEqual(core.NUDGE_WORDS.back);
    expect(core.NUDGE_WORDS.tender.join(' ')).not.toMatch(/lesson/i);
  });

  it('keeps at most three a day, an hour apart, the heads-up first; a saved morning reminder is read and ignored', () => {
    let d: Days = {};
    for (const k of ['2026-09-30', '2026-10-01', '2026-10-06', '2026-10-07', '2026-10-08']) d = slip(d, k, '19:10');
    const all: NudgePrefs = {
      ...core.NUDGE_DEFAULTS,
      lesson: false,
      morning: true,
      morningAt: '08:00',
      checkin: true,
      wind: true,
      risk: true,
      checkinAt: '18:00',
    };
    const today = routine(plan(d, all, at('2026-10-14T07:00'))).filter((n) => n.d === tk);
    expect(today.map((n) => n.k)).toEqual(['risk', 'wind']);
    expect(core.nudgesOn({ ...core.NUDGE_DEFAULTS, lesson: false, risk: false, morning: true })).toBe(false);
    expect(today.find((n) => n.k === 'risk')!.at).toBe(at('2026-10-14T17:30'));
  });

  it('on a Sunday, folds the review into the check-in reminder', () => {
    const p = routine(plan({}, { ...ci, review: true }, at('2026-10-18T09:00'), log0, '2026-10-18'));
    expect(p[0]).toMatchObject({ k: 'checkin', d: '2026-10-18', also: 'sunday', body: 'Check in, and a few minutes to look back on your week.' });
    const alone = routine(plan({}, { ...ci, checkin: false, review: true }, at('2026-10-18T09:00'), log0, '2026-10-18'));
    expect(alone[0]).toMatchObject({ k: 'sunday', url: '/review', quiet: true, at: at('2026-10-18T17:00') });
  });

  it('after a heavy few days, the routine notes offer and do not ask; the heads-up stays as it is', () => {
    let d: Days = {};
    for (const k of ['2026-10-11', '2026-10-12', '2026-10-13']) {
      d = checkedIn(d, k, k + 'T21:00');
      d[k].checkin = { ...d[k].checkin!, m: 2, s: 6 };
    }
    for (const k of ['2026-09-30', '2026-10-01', '2026-10-06', '2026-10-07', '2026-10-08']) d = slip(d, k, '19:10');
    expect(core.weekFeel(d, tk)).toBe('heavy');
    const all: NudgePrefs = { ...core.NUDGE_DEFAULTS, lesson: false, morning: true, checkin: true, wind: true, risk: true, checkinAt: '15:00' };
    const today = routine(plan(d, all, at('2026-10-14T07:00'))).filter((n) => n.d === tk);
    expect(today.find((n) => n.k === 'checkin')).toMatchObject({ body: 'A short check-in is enough tonight. Nothing to get right.', pic: 'flame-warm' });
    expect(today.map((n) => n.k)).toEqual(['checkin', 'risk', 'wind']);
    expect(today.find((n) => n.k === 'wind')!.quiet).toBe(true);
    expect(today.find((n) => n.k === 'risk')).toMatchObject({ body: core.wordsOf(core.pickWords('risk', log0, tk), st), pic: 'flame-bright' });
    expect(today.find((n) => n.k === 'risk')!.quiet).toBeUndefined();
    /* high stress alone is heavy too; a steady week is not */
    const stressed = checkedIn({}, '2026-10-13', '2026-10-13T21:00');
    stressed['2026-10-13'].checkin = { ...stressed['2026-10-13'].checkin!, m: 7, s: 8 };
    expect(core.weekFeel(stressed, tk)).toBe('heavy');
    stressed['2026-10-13'].checkin = { ...stressed['2026-10-13'].checkin!, m: 6, s: 4 };
    expect(core.weekFeel(stressed, tk)).toBe('steady');
    expect(core.weekFeel({}, tk)).toBe('steady');
    /* the cap of three still holds */
    expect(today.length).toBeLessThanOrEqual(3);
  });

  it('the kinder words after a slip win over the mood words', () => {
    let d: Days = {};
    for (const k of ['2026-10-11', '2026-10-12', '2026-10-13']) {
      d = checkedIn(d, k, k + 'T21:00');
      d[k].checkin = { ...d[k].checkin!, m: 1 };
    }
    d = slip(d, tk, '21:30');
    const next = routine(plan(d, ci, at('2026-10-14T22:00')))[0];
    expect(next).toMatchObject({ d: '2026-10-15', body: 'A new day. Everything you built is still here.', pic: 'flame-warm' });
  });

  it('after a slip, sends no more, only kinder words', () => {
    const d = slip({}, tk, '21:30');
    const before = routine(plan({}, ci, at('2026-10-14T22:00')));
    const after = routine(plan(d, ci, at('2026-10-14T22:00')));
    expect(after.length).toBe(before.length);
    expect(after[0]).toMatchObject({ d: '2026-10-15', body: 'A new day. Everything you built is still here.' });
  });

  it('while the Rekindle quest is open, its reminder takes the check-in reminder’s place', () => {
    const d = slip({}, '2026-10-12', '21:30');
    const words = (k: string) => routine(plan(d, ci, at(k + 'T09:00'), log0, k)).map((n) => n.d + ' ' + n.body);
    expect(words('2026-10-14')).toEqual([
      '2026-10-14 Your Rekindle quest is still open. One small step today.',
      '2026-10-15 Your Rekindle quest is still open. One small step today.',
    ]);
    expect(words('2026-10-16')).toEqual(['2026-10-16', '2026-10-17'].map((k) => k + ' ' + core.wordsOf(core.pickWords('checkin', log0, k), st)));
  });
});

describe('the habit takes over', () => {
  let own: Days = {};
  for (let i = 1; i <= 5; i++) own = checkedIn(own, core.addDays(tk, -i), core.addDays(tk, -i) + 'T16:00');

  it('checking in on your own most days moves the reminder later, as a backup', () => {
    expect(core.ciOnOwn(own, st, ci, tk)).toBe(true);
    expect(routine(plan(own, ci, at('2026-10-14T09:00')))[0].at).toBe(at('2026-10-14T19:30'));
    /* never past screens-off less half an hour */
    expect(core.ciBackupAt({ ...st, screensOff: '22:00' }, { ...ci, checkinAt: '21:00' })).toBe('21:30');
    expect(core.ciOnOwn(own, st, { ...ci, ciKeep: true }, tk)).toBe(false);
    expect(core.ciOnOwn(checkedIn({}, '2026-10-13', '2026-10-13T16:00'), st, ci, tk)).toBe(false);
  });

  it('Today says so once, with the set time as the other choice', () => {
    expect(core.nudgeCard(own, st, ci, log0, tk)).toMatchObject({ k: 'backup', at: '19:30', no: 'Keep it at 6:00 PM' });
    expect(core.nudgeCard(own, st, ci, { ...log0, bk: tk }, tk)).toBeNull();
  });

  it('offers to move the reminder to when the person really checks in', () => {
    let late: Days = {};
    for (let i = 1; i <= 6; i++) late = checkedIn(late, core.addDays(tk, -i), core.addDays(tk, -i) + 'T21:4' + (i % 3));
    expect(core.ciUsual(late, st, tk)).toBe('21:45');
    expect(core.nudgeCard(late, st, ci, log0, tk)).toMatchObject({ k: 'time', at: '21:45', yes: 'Move it to 9:45 PM' });
    expect(core.nudgeCard(late, st, ci, { ...log0, tm: '2026-10-01' }, tk)).toBeNull();
    expect(core.nudgeCard(late, st, ci, { ...log0, tm: '2026-09-10' }, tk)).not.toBeNull();
  });
});

describe('learning from what happened', () => {
  /* one check-in reminder delivered on day k, then the app opened at `open` */
  const after = (log: NudgeLog, k: string, open: number, days: Days = {}, allowed = true) => {
    const n = { id: 'checkin-' + k, k: 'checkin' as const, d: k, at: at(k + 'T18:00') };
    return core.nudgeLearn({ ...log, plan: [n], opens: [...log.opens, open] }, days, st, {}, open, allowed);
  };
  const ignored = (log: NudgeLog, k: string) => after(log, k, at(core.addDays(k, 1) + 'T12:00'));

  it('three misses in a row step a kind down, then pause it', () => {
    let log = log0;
    for (const k of ['2026-10-01', '2026-10-02', '2026-10-03']) log = ignored(log, k);
    expect(log.lv.checkin).toBe(1);
    /* every other day now */
    const p = routine(plan({}, ci, at('2026-10-14T09:00'), log));
    expect(p.length).toBe(1);
    for (const k of ['2026-10-04', '2026-10-06', '2026-10-08']) log = ignored(log, k);
    expect(log.lv.checkin).toBe(2);
    expect(routine(plan({}, ci, at('2026-10-14T09:00'), log))).toEqual([]);
    expect(core.nudgeCard({}, st, ci, log, tk)).toMatchObject({
      k: 'paused',
      kind: 'checkin',
      p: 'The check-in reminder has not been helping lately, so Daybook paused it. Everything else stays the same.',
    });
    expect(routine(plan({}, ci, at('2026-10-14T09:00'), core.nudgeResume(log, 'checkin'))).length).toBe(2);
  });

  it('a tap, an open soon after, or the thing done counts as a help, and steps back up', () => {
    const down: NudgeLog = { ...log0, lv: { checkin: 1 }, miss: { checkin: 2 } };
    expect(after(down, '2026-10-05', at('2026-10-05T19:00')).lv.checkin).toBe(0);
    const tapped = core.nudgeLearn(
      { ...down, plan: [{ id: 'checkin-2026-10-05', k: 'checkin', d: '2026-10-05', at: at('2026-10-05T18:00') }], taps: ['checkin-2026-10-05'] },
      {},
      st,
      {},
      at('2026-10-07T12:00'),
      true,
    );
    expect(tapped).toMatchObject({ lv: { checkin: 0 }, miss: { checkin: 0 }, taps: [] });
    const did = checkedIn({}, '2026-10-05', '2026-10-05T23:00');
    expect(after(down, '2026-10-05', at('2026-10-06T12:00'), did).lv.checkin).toBe(0);
  });

  it('waits a few hours before calling it a miss, and judges nothing the phone did not deliver', () => {
    const soon = core.nudgeLearn(
      { ...log0, plan: [{ id: 'checkin-2026-10-05', k: 'checkin', d: '2026-10-05', at: at('2026-10-05T18:00') }] },
      {},
      st,
      {},
      at('2026-10-05T20:30'),
      true,
    );
    expect(soon.wait.length).toBe(1);
    expect(soon.miss.checkin || 0).toBe(0);
    const off = after({ ...log0, miss: { checkin: 2 } }, '2026-10-05', at('2026-10-07T12:00'), {}, false);
    expect(off).toMatchObject({ lv: {}, miss: { checkin: 2 }, wait: [] });
  });

  it('no card in the two days after a slip', () => {
    const log: NudgeLog = { ...log0, lv: { checkin: 2 } };
    expect(core.nudgeCard(slip({}, core.addDays(tk, -1), '21:00'), st, ci, log, tk)).toBeNull();
    expect(core.nudgeCard(slip({}, core.addDays(tk, -2), '21:00'), st, ci, log, tk)).not.toBeNull();
  });

  it('a new plan keeps what was due until it is judged', () => {
    const due = { id: 'checkin-2026-10-13', k: 'checkin' as const, d: '2026-10-13', at: at('2026-10-13T18:00') };
    const kept = core.nudgeKeep({ ...log0, plan: [due] }, plan({}, ci, at('2026-10-14T09:00')), at('2026-10-14T09:00'));
    expect(kept.plan[0]).toEqual(due);
    expect(kept.plan.length).toBe(1 + 2 + core.NUDGE_BACK.length);
  });

  it('keeps 28 days of open times, at most 200', () => {
    const now = at('2026-10-14T09:00');
    const opens = [at('2026-09-10T12:00'), at('2026-09-20T12:00'), ...Array.from({ length: 250 }, (_, i) => now - i * 3600000).reverse()];
    const x = core.nudgeLearn({ ...log0, opens }, {}, st, {}, now, true);
    expect(x.opens.length).toBe(200);
    expect(x.opens.includes(at('2026-09-20T12:00'))).toBe(false);
    expect(core.nudgeLearn({ ...log0, opens: [at('2026-09-20T12:00')] }, {}, st, {}, now, true).opens).toEqual([at('2026-09-20T12:00')]);
  });

  it('a stored log is read safely', () => {
    expect(core.normNudgeLog(null)).toMatchObject({ plan: [], wait: [], lv: {}, taps: [], bk: null });
    expect(core.normNudgeLog({ taps: ['a', 3], opens: [1, 'x'] })).toMatchObject({ taps: ['a'], opens: [1] });
  });

  it('a morning reminder planned before it was retired is let go', () => {
    const ci = { id: 'checkin-2026-10-14', k: 'checkin', d: tk, at: 1 };
    const mo = { id: 'morning-2026-10-14', k: 'morning', d: tk, at: 1 };
    const x = core.normNudgeLog({ plan: [mo, ci], wait: [mo, null], lv: { morning: 2 } });
    expect(x.plan).toEqual([ci]);
    expect(x.wait).toEqual([]);
    /* a step it had reached stays in the log, harmless: nothing reads it */
    expect(core.nudgeCard({}, st, { ...core.NUDGE_DEFAULTS, lesson: false, morning: true }, x, tk)).toBeNull();
  });
});

describe('words that learn', () => {
  const rec = (n: number, h: number, last: string | null) => ({ n, h, last });

  it('three wordings per routine kind, the first being the old one', () => {
    for (const k of core.NUDGE_LEARNED) expect(core.NUDGE_WORDS.pick[k].length).toBe(3);
    expect(core.NUDGE_WORDS.pick.checkin[0]).toBe(core.NUDGE_WORDS.checkin);
    expect(core.wordsOf('wind.0', st)).toBe(core.NUDGE_WORDS.wind('10:30 PM'));
  });

  it('rotates when nothing is known: each day sent and not helped, the next day tries another', () => {
    let log: NudgeLog = log0;
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const k = core.addDays(tk, i);
      const w = core.pickWords('checkin', log, k);
      seen.push(w);
      log = { ...log, w: { ...log.w, [w]: rec(1, 0, k) } };
    }
    expect(new Set(seen).size).toBe(3);
  });

  it('yesterday’s wording loses to a fresh one, and to an equal one sent longer ago', () => {
    const y = core.addDays(tk, -1);
    expect(core.pickWords('checkin', { w: { 'checkin.0': rec(1, 0, y), 'checkin.1': rec(1, 0, y), 'checkin.2': rec(0, 0, null) } }, tk)).toBe('checkin.2');
    expect(core.pickWords('wind', { w: { 'wind.0': rec(3, 1, y), 'wind.1': rec(3, 1, '2026-09-20'), 'wind.2': rec(3, 1, y) } }, tk)).toBe('wind.1');
  });

  it('a wording that helped 5 of 6 keeps winning over one that helped 1 of 6', () => {
    for (let i = 0; i < 10; i++) {
      const k = core.addDays(tk, i);
      const w = { 'checkin.0': rec(6, 1, core.addDays(k, -3)), 'checkin.1': rec(6, 5, core.addDays(k, -1)), 'checkin.2': rec(6, 3, core.addDays(k, -2)) };
      expect(core.pickWords('checkin', { w }, k)).toBe('checkin.1');
    }
  });

  it('is the same for a given day, and changes across days', () => {
    const picks = Array.from({ length: 12 }, (_, i) => core.pickWords('sunday', log0, core.addDays(tk, i)));
    expect(Array.from({ length: 12 }, (_, i) => core.pickWords('sunday', log0, core.addDays(tk, i)))).toEqual(picks);
    expect(new Set(picks).size).toBeGreaterThan(1);
  });

  it('each note carries its wording, learned when it is judged; the mood and kinder words are not learned', () => {
    const p = routine(plan({}, ci, at('2026-10-14T09:00')));
    expect(p[0].w).toBe(core.pickWords('checkin', log0, tk));
    const kept = core.nudgeKeep(log0, p, at('2026-10-14T09:00'));
    expect(kept.plan[0].w).toBe(p[0].w);
    const helped = core.nudgeLearn({ ...kept, opens: [at('2026-10-14T18:30')] }, {}, st, {}, at('2026-10-14T18:30'), true);
    expect(helped.w[p[0].w!]).toEqual({ n: 1, h: 1, last: tk });
    const missed = core.nudgeLearn(kept, {}, st, {}, at('2026-10-15T12:00'), true);
    expect(missed.w[p[0].w!]).toEqual({ n: 1, h: 0, last: tk });
    const d = slip({}, tk, '21:30');
    expect(routine(plan(d, ci, at('2026-10-14T22:00')))[0].w).toBeUndefined();
  });

  it('a stored count is read safely', () => {
    expect(core.normNudgeLog({ w: { 'checkin.0': { n: 2, h: 5, last: 3 }, x: 'y' } }).w).toEqual({ 'checkin.0': { n: 2, h: 2, last: null } });
  });
});

it('the words never say what Daybook is for, and use no contractions', () => {
  const all = JSON.stringify({ ...core.NUDGE_WORDS, wind: core.NUDGE_WORDS.wind('10:30 PM') });
  expect(all).not.toMatch(/miss you/i);
  expect(all).not.toMatch(/porn|slip|clean|urge|addict|relapse|sober|habit|sex|streak|lose|lost your/i);
  expect(all).not.toMatch(/n['’]t|['’](re|ll|ve|d|m)\b|\b(it|that|there|what)['’]s\b/i);
});

it('the setup asks when to check in only where the device can notify, right after the review', () => {
  expect(core.obPages({}).some((p) => p.id === 'remind')).toBe(false);
  const ids = core.obPages({}, { notify: true }).map((p) => p.id);
  expect(ids.indexOf('remind')).toBe(ids.indexOf('review') + 1);
});

describe('the lesson reminder (Lessons first, C2)', () => {
  const ls: NudgePrefs = { ...core.NUDGE_DEFAULTS, risk: false };
  /* the app is usually open around 7 PM */
  const opens = Array.from({ length: 10 }, (_, i) => at(core.addDays(tk, -i - 1) + 'T19:20'));
  const logO: NudgeLog = { ...log0, opens };
  const lessonsOf = (p: core.Nudge[]) => routine(p).filter((n) => n.k === 'lesson');
  const finish = (days: Days, k: string, id: string, when: string) => core.recordLesson(days, k, core.lessonById(id)!, at(when)).days;
  const hm = (t: number) => new Date(t).toTimeString().slice(0, 5);

  it('is the one routine reminder on by default', () => {
    expect(core.NUDGE_DEFAULTS.lesson).toBe(true);
    expect(core.NUDGE_DEFAULTS.checkin).toBe(false);
    expect(core.NUDGE_DEFAULTS.wind).toBe(false);
    expect(core.nudgesOn({ ...core.NUDGE_DEFAULTS, risk: false })).toBe(true);
    expect(core.NUDGE_LEARNED).toContain('lesson');
    expect(core.NUDGE_PREF.lesson).toBe('lesson');
  });

  it('with no lesson finished yet, comes at the hour the app is usually open, and opens the next lesson', () => {
    const p = lessonsOf(plan({}, ls, at('2026-10-14T09:00'), logO));
    expect(p.map((n) => [n.id, hm(n.at), n.url])).toEqual([
      ['lesson-2026-10-14', '19:00', '/lesson/l1'],
      ['lesson-2026-10-15', '19:00', '/lesson/l1'],
    ]);
    expect(p[0].body).toBe(core.wordsOf(core.pickWords('lesson', logO, tk), st));
    expect(core.NUDGE_WORDS.pick.lesson).toContain(p[0].body);
    expect(core.lessonAt({}, logO, tk, at('2026-10-14T09:00'))).toEqual({ at: '19:00', from: 'usual' });
  });

  it('comes at the time the last lesson was finished, a day later', () => {
    const d = finish({}, '2026-10-13', 'l1', '2026-10-13T12:40');
    expect(d['2026-10-13'].p!.lt).toBe(at('2026-10-13T12:40'));
    expect(core.lessonAt(d, logO, tk, at('2026-10-14T09:00'))).toEqual({ at: '12:40', from: 'last' });
    const p = lessonsOf(plan(d, ls, at('2026-10-14T09:00'), logO));
    expect(p.map((n) => [n.d, hm(n.at), n.url])).toEqual([
      [tk, '12:40', '/lesson/l2'],
      ['2026-10-15', '12:40', '/lesson/l2'],
    ]);
    /* a re-read counts as the day's lesson and moves the time too */
    const again = finish(d, tk, 'l1', '2026-10-14T08:15');
    expect(again[tk].p!.lv).toEqual(['l1']);
    expect(core.lessonAt(again, logO, '2026-10-15', at('2026-10-14T09:00')).at).toBe('08:15');
  });

  it('never at night on its own: a lesson finished late falls back to the usual hour', () => {
    const late = finish({}, '2026-10-13', 'l1', '2026-10-13T23:10');
    expect(core.lessonAt(late, logO, tk, at('2026-10-14T09:00'))).toEqual({ at: '19:00', from: 'usual' });
    const early = finish({}, '2026-10-13', 'l1', '2026-10-13T06:30');
    expect(core.lessonLast(early, tk)).toBeNull();
    const ten = finish({}, '2026-10-13', 'l1', '2026-10-13T21:59');
    expect(core.lessonLast(ten, tk)).toBe('21:59');
    /* the usual hour is daytime only */
    expect(core.usualHour({ opens: [at('2026-10-13T23:30')] }, at('2026-10-14T01:00'))).toBe(18);
  });

  it('is skipped once today’s lesson is done, and when there is no new lesson to do', () => {
    const d = finish({}, tk, 'l1', '2026-10-14T10:00');
    expect(lessonsOf(plan(d, ls, at('2026-10-14T10:05'), logO)).map((n) => [n.d, hm(n.at), n.url])).toEqual([['2026-10-15', '10:00', '/lesson/l2']]);
    /* without an account, the lessons after the first three wait behind one: no reminder for a re-read */
    let three: Days = {};
    for (let i = 0; i < 3; i++)
      three = finish(three, core.addDays(tk, -3 + i), core.firstUndone(core.lessonsDone(three))!.id, core.addDays(tk, -3 + i) + 'T12:00');
    expect(core.lessonDue(three, st, tk, false)).toBeNull();
    expect(lessonsOf(core.nudgePlan(three, st, {}, ls, logO, tk, at('2026-10-14T09:00'), true, false))).toEqual([]);
    expect(core.lessonDue(three, st, tk, true)).toBe(core.firstUndone(core.lessonsDone(three))!.id);
    /* a day with the lesson switched off in the routine */
    const off = core.routineDay({}, st, tk, 'lesson', false);
    expect(lessonsOf(plan(off, ls, at('2026-10-14T09:00'), logO)).map((n) => n.d)).toEqual(['2026-10-15']);
    /* turned off */
    expect(lessonsOf(plan({}, { ...ls, lesson: false }, at('2026-10-14T09:00'), logO))).toEqual([]);
  });

  it('shares one note with the check-in reminder within the same hour, at the check-in time', () => {
    const d = finish({}, '2026-10-13', 'l1', '2026-10-13T18:40');
    const p = routine(plan(d, { ...ls, checkin: true, checkinAt: '18:00' }, at('2026-10-14T09:00'), logO)).filter((n) => n.d === tk);
    expect(p.map((n) => [n.k, hm(n.at), n.also, n.body, n.url, n.w])).toEqual([
      ['lesson', '18:00', 'checkin', core.NUDGE_WORDS.lessonCi, '/lesson/l2', undefined],
    ]);
    /* two hours apart: two notes */
    const two = routine(plan(d, { ...ls, checkin: true, checkinAt: '20:45' }, at('2026-10-14T09:00'), logO)).filter((n) => n.d === tk);
    expect(two.map((n) => [n.k, hm(n.at)])).toEqual([
      ['lesson', '18:40'],
      ['checkin', '20:45'],
    ]);
    /* checked in already: only the lesson, on its own words */
    const c = checkedIn(d, tk, '2026-10-14T08:00');
    const one = routine(plan(c, { ...ls, checkin: true, checkinAt: '18:00' }, at('2026-10-14T09:00'), logO)).filter((n) => n.d === tk);
    expect(one.map((n) => [n.k, hm(n.at), n.also])).toEqual([['lesson', '18:40', undefined]]);
  });

  it('a shared note helped when either was done that day', () => {
    const d = finish({}, '2026-10-13', 'l1', '2026-10-13T18:40');
    const p = plan(d, { ...ls, checkin: true, checkinAt: '18:00' }, at('2026-10-14T09:00'), logO);
    const kept = core.nudgeKeep(logO, p, at('2026-10-14T09:00'));
    const c = checkedIn(d, tk, '2026-10-14T21:00');
    expect(core.nudgeLearn(kept, c, st, {}, at('2026-10-15T08:00'), true).miss.lesson || 0).toBe(0);
    expect(core.nudgeLearn(kept, d, st, {}, at('2026-10-15T08:00'), true).miss.lesson).toBe(1);
  });

  it('after a slip, never more: the first note of the day says it kindly, and opens Today', () => {
    const d = slip({}, '2026-10-13', '22:30');
    const p = lessonsOf(plan(d, ls, at('2026-10-14T09:00'), logO));
    expect(p[0].body).toBe(core.NUDGE_WORDS.after);
    expect(p[0].url).toBe('/');
  });

  it('steps down when ignored, and is named on Today when paused', () => {
    const x = { ...logO, lv: { lesson: 2 } };
    expect(lessonsOf(plan({}, ls, at('2026-10-14T09:00'), x))).toEqual([]);
    const card = core.nudgeCard({}, st, ls, x, tk);
    expect(card && card.k === 'paused' && card.kind).toBe('lesson');
    expect(card!.p).toMatch(/^The lesson reminder /);
  });

  it('the finished time is kept safely in the day record', () => {
    expect(core.normDay({ d: tk, events: [], p: { ls: ['l1'], lt: at('2026-10-14T12:00') } }, tk).p!.lt).toBe(at('2026-10-14T12:00'));
    expect(core.normDay({ d: tk, events: [], p: { ls: ['l1'], lt: 'noon' } }, tk).p!.lt).toBeUndefined();
    expect(core.normDay({ d: tk, events: [], p: { ls: ['l1'], lt: -5 } }, tk).p!.lt).toBeUndefined();
  });
});
