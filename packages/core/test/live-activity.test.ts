/* Live Activities: the hard hours and the night (live-activity.ts). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const tk = '2026-10-20';
const at = (h: number, m = 0, d = 20) => new Date(2026, 9, d, h, m).getTime();
const st = core.normSettings({ start: '2026-09-01', day1: '2026-09-01', cleanMode: 'gentle', screensOff: '23:00', rollover: 4 });
/* urges ridden out between 8 and 10 PM on many weekdays: hard hours 8 to 10 PM */
let hard: Days = {};
for (const k of ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])
  hard = core.addEvent(hard, k, 'rode', '20:30', {}, 1).days;

describe('the hard hours', () => {
  it('show from two hours before to their end, named, counting down to their start and then through them', () => {
    expect(core.riskWindow(hard, st, tk)?.start).toBe(20);
    expect(core.livePlan(hard, st, tk, at(17))).toBeNull();
    const p = core.livePlan(hard, st, tk, at(18, 40))!;
    expect(p).toMatchObject({ kind: 'hard', to: at(22), stale: at(20), mood: 'now' });
    expect(p.face).toMatchObject({ head: 'Hard hours: 8 to 10 PM', note: 'until they start', clock: { b: at(20), down: true }, sos: true });
    /* at 8 PM iPhone turns it, with the app shut, to what is left of them */
    expect(p.later).toMatchObject({ note: 'left to hold on', clock: { a: at(20), b: at(22), down: true }, sos: true });
    const d = core.livePlan(hard, st, tk, at(21, 30))!;
    expect(d.face).toEqual(p.later);
    expect(d).toMatchObject({ stale: at(22), later: { big: 'Over', go: '/' } });
  });

  it('a tap goes where the button says: the plan, or making one, and never SOS by surprise', () => {
    const none = core.livePlan(hard, { ...st, plan: [] }, tk, at(18, 40))!;
    expect(none).toMatchObject({ url: '/trail', face: { act: 'Make your plan', go: '/trail' } });
    const mine = core.livePlan(hard, { ...st, plan: [{ when: 'when I am in bed', then: 'phone in the kitchen' }] }, tk, at(18, 40))!;
    expect(mine).toMatchObject({ url: '/plan/urge', face: { act: 'Open your plan', go: '/plan/urge' } });
    /* the typed plan never reaches the Lock Screen */
    expect(core.liveWordsOf(mine).join(' ')).not.toMatch(/kitchen|bed/);
  });
});

describe('the night', () => {
  it('winds down from 30 minutes before screens off, then counts the time past it', () => {
    expect(core.livePlan({}, st, tk, at(22, 20))).toBeNull();
    const w = core.livePlan({}, st, tk, at(22, 40))!;
    expect(w).toMatchObject({ kind: 'night', mood: 'now', url: '/night', stale: at(23), to: at(24) });
    expect(w.face).toMatchObject({ head: 'Wind down', note: 'until screens off at 11:00 PM', act: 'Start Good night', clock: { b: at(23), down: true } });
    expect(w.later).toMatchObject({ head: 'Screens off: 11:00 PM', act: 'Say good night', go: '/night', clock: { a: at(23), down: false } });
    expect(core.livePlan({}, st, tk, at(23, 30))!.face).toEqual(w.later);
    expect(core.livePlan({}, st, tk, at(0, 30, 21))).toBeNull();
  });

  it('after Good night the flame rests, with SOS one named tap away, and greets the morning', () => {
    const bed = { [tk]: core.normDay({ p: { po: '22:50' } }, tk) };
    const p = core.livePlan(bed, st, tk, at(22, 55))!;
    expect(p).toMatchObject({ kind: 'night', mood: 'asleep', to: at(4, 0, 21), stale: at(4, 0, 21), url: '/sos' });
    expect(p.face).toMatchObject({ head: 'Good night', note: 'resting since 10:50 PM', act: 'SOS if it gets hard', go: '/sos', clock: { a: at(22, 50) } });
    expect(p.later).toMatchObject({ head: 'The night is done', big: 'Good morning', act: 'Start your morning', go: '/morning' });
  });

  it('gives way to the hard hours when both fall at once', () => {
    const late = { ...st, screensOff: '21:00' };
    expect(core.livePlan(hard, late, tk, at(20, 30))?.kind).toBe('hard');
  });
});

describe('the ride', () => {
  it('says it is SOS, counts the time held on, and goes back to SOS', () => {
    const t0 = at(20, 30);
    const p = core.livePlan(hard, st, tk, at(20, 35), t0)!;
    expect(p).toMatchObject({ kind: 'ride', key: 'ride-' + t0, url: '/sos', mood: 'bright', to: t0 + core.LIVE_RIDE_MAX, stale: t0 + core.LIVE_RIDE_MAX });
    expect(p.face).toMatchObject({ head: 'SOS: riding it out', note: 'held on since 8:30 PM', act: 'Back to SOS', go: '/sos', clock: { a: t0, down: false } });
    expect(p.later).toMatchObject({ big: 'Still on?', go: '/sos' });
  });

  it('works before setup, and lets go after its limit or once SOS is closed', () => {
    const t0 = at(14);
    expect(core.livePlan({}, null, tk, at(14, 5), t0)?.kind).toBe('ride');
    expect(core.livePlan({}, null, tk, t0 + core.LIVE_RIDE_MAX, t0)).toBeNull();
    expect(core.livePlan({}, st, tk, at(14, 5), null)).toBeNull();
    /* back to the hard hours when SOS closes in them */
    expect(core.livePlan(hard, st, tk, at(21), null)?.kind).toBe('hard');
  });
});

describe('what the Live Activity is handed', () => {
  it('is flat, with both faces, and each button a Daybook link', () => {
    const p = core.liveProps(core.livePlan(hard, st, tk, at(18, 40))!);
    expect(p).toMatchObject({
      kind: 'hard',
      h: 'Hard hours: 8 to 10 PM',
      cd: 'down',
      cb: at(20),
      sos: 1,
      go: 'daybook://plan/urge',
      cd2: 'down',
      ca2: at(20),
      cb2: at(22),
    });
    for (const v of Object.values(p)) expect(['string', 'number']).toContain(typeof v);
    expect(core.liveProps(core.livePlan({}, null, tk, at(14, 5), at(14))!)).toMatchObject({ go: 'daybook://sos', cd: 'up', big2: 'Still on?', cd2: '' });
  });
});

describe('the words', () => {
  /* everything a Live Activity can put on the Lock Screen or in the Dynamic Island */
  const t0 = at(20, 30);
  const bed = { [tk]: core.normDay({ p: { po: '22:50' } }, tk) };
  const plans = [
    core.livePlan(hard, st, tk, at(20, 35), t0),
    core.livePlan(hard, st, tk, at(18, 40)),
    core.livePlan(hard, st, tk, at(21)),
    core.livePlan({}, st, tk, at(22, 40)),
    core.livePlan(bed, st, tk, at(22, 55)),
  ];
  const all = plans.flatMap((p) => core.liveWordsOf(p!)).filter(Boolean);
  it('name the tool, never the habit, the urge, a slip or a count of days, and use no contractions', () => {
    for (const w of all) expect(w).not.toMatch(/porn|habit|slip|clean|sober|addict|urge|craving|relapse|gambl|drink|alcohol|\bdays?\b|n't/i);
  });
  it('fit: a head of one line, a short note and a short button', () => {
    for (const p of plans)
      for (const f of [p!.face, p!.later]) {
        expect(f.head.length).toBeLessThanOrEqual(24);
        expect(f.note.length).toBeLessThanOrEqual(38);
        expect(f.act.length).toBeLessThanOrEqual(20);
      }
  });
});
