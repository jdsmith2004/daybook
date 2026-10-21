/* Breathe first, decide later: the run question comes at the end of the slip's Rekindle, and when it is closed before an answer
   the run is kept for now and the sunrise check asks the next morning. The four ways it can go: answered keep, answered fresh,
   closed and then answered at sunrise, closed and never answered. Nothing new is stored: no answer is the absent `keep`. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { DayEvent, Days, Settings } from '../src/types';

const st: Settings = core.normSettings({ start: '2026-10-25', day1: '2026-11-01' });
const K = '2026-11-08'; // Day 8: the slip ends a run of 7 days (Nov 1 to 7)
const K1 = core.addDays(K, 1); // the morning after
const L = (days: Days, tk: string) => core.runLedger(days, st, tk);

/** a slip on day K (at 10 PM), as it is saved: no answer yet unless keep is given */
function slip(o: { keep?: boolean; done?: boolean } = {}): Days {
  const ev: Partial<DayEvent> = { id: 's1', time: '22:00', outcome: 'slipped', recovered: !!o.done, ...(o.keep == null ? {} : { keep: o.keep }) };
  if (o.done) ev.rk = { at: K1, pl: '' };
  return { [K]: { ...core.normDay({ events: [ev], checkin: o.done ? { so: 'Y' } : null }, K), u: 1 } };
}
const sunSteps = (days: Days, tk = K1) => core.srSteps(days, core.rkActive(days, st, tk)!, tk, st);

describe('the question waits for the end of Rekindle', () => {
  it('is open and unanswered right after the slip, and the run is kept for now', () => {
    const days = slip();
    expect(core.rkAskOpen(days, st, K, K)).toMatchObject({ k: K, run: 7, keep: null, open: true, evId: 's1' });
    /* kept for now: the run waits for the quest exactly as a kept run does */
    expect(L(days, K).open).toEqual(L(slip({ keep: true }), K).open);
    expect(L(days, K1).cur).toBe(L(slip({ keep: true }), K1).cur);
    expect(core.rkEmbers(days, st, {}, K, K, true, false).line?.b).toBe('Your 7-day run waits for you.');
  });

  it('is not asked of a short run, or once the window closed', () => {
    const short = { '2026-11-07': core.normDay({ events: [{ id: 's1', time: '22:00', outcome: 'slipped' }] }, '2026-11-07') };
    expect(core.rkAskOpen(short, st, '2026-11-07', '2026-11-07')).toBeNull();
    expect(core.rkAskOpen(slip(), st, core.addDays(K, core.RK_DAYS + 1), K)).toBeNull();
  });
});

describe('answered at the end of Rekindle', () => {
  it('keep: nothing more to ask, the sunrise check skips the question, and the quest saves the run', () => {
    const days = core.rkKeep(slip(), st, K, K, 's1', true, 10)!;
    expect(days[K].events[0].keep).toBe(true);
    expect(core.rkAskOpen(days, st, K, K)).toBeNull();
    expect(sunSteps(days)).toEqual(['hi', 'so', 'before', 'plan']);
    const done = {
      [K]: { ...days[K], events: [{ ...days[K].events[0], recovered: true, rk: { at: K1, pl: '' } }], checkin: { ...days[K].checkin!, so: 'Y' as const } },
    };
    expect(L(done, K1).kind[K]).toBe('saved');
  });

  it('start fresh: nothing more to ask, the run ends at the slip, and the longest run stays', () => {
    const days = core.rkKeep(slip(), st, K, K, 's1', false, 10)!;
    expect(core.rkAskOpen(days, st, K, K)).toBeNull();
    expect(sunSteps(days)).toEqual(['hi', 'so', 'before', 'plan']);
    expect(L(days, K1)).toMatchObject({ cur: 1, longest: 7, open: null });
  });
});

describe('closed before an answer', () => {
  it('Today says kept for now, and the sunrise check asks the next morning', () => {
    const days = slip();
    expect(core.rkKeptForNow({ k: K, run: 7 }, K)).toEqual({
      b: 'Your 7-day run is kept for now.',
      rest: 'In the morning, your sunrise check asks whether to keep it going or start fresh. Nothing is lost by waiting.',
    });
    expect(core.rkKeptForNow({ k: K, run: 7 }, K1).rest).toBe('Your sunrise check asks whether to keep it going or start fresh. Nothing is lost by waiting.');
    expect(sunSteps(days)).toEqual(['hi', 'run', 'so', 'before', 'plan']);
    /* without the settings, the steps read as before (the golden fixtures) */
    expect(core.srSteps(days, core.rkActive(days, st, K1)!, K1)).toEqual(['hi', 'so', 'before', 'plan']);
  });

  it('then answered at sunrise: keep holds the wait, start fresh counts from the day after the slip', () => {
    const kept = core.rkKeep(slip(), st, K1, K, 's1', true, 20)!;
    expect(kept[K].events[0].keep).toBe(true);
    expect(L(kept, K1).open).toEqual({ k: K, run: 7, deep: false });
    expect(L(kept, K1).cur).toBe(8);
    const fresh = core.rkKeep(slip(), st, K1, K, 's1', false, 20)!;
    expect(L(fresh, K1)).toMatchObject({ cur: 1, longest: 7, open: null });
    expect(core.rkChoice(slip(), st, K1, core.rkAsk(slip(), st, K1, K)!).fresh).toBe(
      'A new run counts from Monday and counts only days with no slip. Your 7 days stay on record as your longest run.',
    );
  });

  it('the answer given at sunrise on one phone reaches the other, and an unanswered day stays unanswered through sync', () => {
    const rec = (d: core.Day) => core.normRecord({ id: `days/${K}`, u: d.u!, data: d })!;
    const here = slip();
    /* unanswered: no keep field is sent, and none comes back */
    const plain = core.mergeRemote({ settings: st, days: {}, reviews: {} }, {}, [rec(here[K])]);
    expect('keep' in plain.snap.days[K].events[0]).toBe(false);
    expect(core.rkAskOpen(plain.snap.days, st, K1, K)).not.toBeNull();
    /* answered on the other phone the next morning: its newer copy of the day wins here */
    const there = core.rkKeep(here, st, K1, K, 's1', false, 500)!;
    const m = core.mergeRemote({ settings: st, days: here, reviews: {} }, {}, [rec(there[K])]);
    expect(m.snap.days[K].events[0].keep).toBe(false);
    expect(core.rkAskOpen(m.snap.days, st, K1, K)).toBeNull();
  });

  it('and never answered: the run waits the whole window, the quest still saves it, and without the quest it ends with nothing else lost', () => {
    const days = slip();
    for (let i = 0; i <= core.RK_DAYS; i++) expect(L(days, core.addDays(K, i)).kind[K]).toBe('open');
    /* the quest done with no answer saves the run, as keep does */
    expect(L(slip({ done: true }), K1).kind[K]).toBe('saved');
    /* no quest: the window closes, the run ends at the slip, the longest stays, and the morning after says so once */
    const after = core.addDays(K, core.RK_DAYS + 1);
    expect(L(days, after)).toMatchObject({ longest: 7, cur: core.RK_DAYS + 1 });
    expect(core.rkEnded(days, st, after)).toMatchObject({ run: 7, why: 'clock', longest: 7 });
    expect(core.rkAskOpen(days, st, after, K)).toBeNull();
    /* points never drop because of it, and nothing was written on the slip */
    const g = (tk: string) => core.gameCompute(days, st, {}, tk).pts;
    expect(g(after)).toBeGreaterThanOrEqual(g(core.addDays(K, core.RK_DAYS)));
    expect('keep' in days[K].events[0]).toBe(false);
  });

  it('old saved slips, from before the question, load as kept for now', () => {
    const old = core.normDay({ events: [{ id: 'x', time: '21:00', outcome: 'slipped', trigger: null, recovered: false, note: '' }] }, K);
    expect(core.rkAskOpen({ [K]: old }, st, K1, K)).toMatchObject({ keep: null, open: true });
  });
});
