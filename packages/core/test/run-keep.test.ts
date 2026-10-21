/* Keep the run going, or start fresh: the question a slip asks when it ends a run of RUN_ASK days or more, both answers,
   changing the answer while the run can still be saved, and the answer surviving clean-up, backups and sync. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { DayEvent, Days, Settings } from '../src/types';

const st: Settings = core.normSettings({ start: '2026-10-25', day1: '2026-11-01' });
const K = '2026-11-08'; // Day 8: the slip ends a run of 7 days (Nov 1 to 7)
const K6 = '2026-11-07'; // Day 7: a run of 6

type Ev = Partial<DayEvent>;
/** a slip on day k; done: the quest finished (one small thing, screens off that night, the sunrise check the next morning) */
function slip(k: string, o: { done?: boolean; keep?: boolean; id?: string; more?: Ev[] } = {}): Days {
  const ev: Ev = { id: o.id || 's1', time: '22:00', outcome: 'slipped', recovered: !!o.done, ...(o.keep == null ? {} : { keep: o.keep }) };
  if (o.done) ev.rk = { at: core.addDays(k, 1), pl: '' };
  return { [k]: { ...core.normDay({ events: [ev, ...(o.more || [])], checkin: o.done ? { so: 'Y' } : null }, k), u: 1 } };
}
const L = (days: Days, tk: string) => core.runLedger(days, st, tk);

describe('the question', () => {
  it('is asked when a slip ends a run of 7 days, and not 6', () => {
    expect(core.RUN_ASK).toBe(7);
    const a = core.rkAsk(slip(K), st, K, K);
    expect(a).toEqual({ k: K, run: 7, deep: false, evId: 's1', keep: null, until: 'Wednesday', open: true, saved: false });
    expect(core.rkAsk(slip(K6), st, K6, K6)).toBeNull();
  });

  it('is not asked in step down, or in gentle counting when the day still counts', () => {
    expect(core.rkAsk(slip(K), { ...st, cleanMode: 'step' }, K, K)).toBeNull();
    const gentle = { ...st, cleanMode: 'gentle' as const };
    expect(core.rkAsk(slip(K), gentle, K, K)).toBeNull();
    const two = slip(K, { more: [{ id: 's2', time: '23:00', outcome: 'slipped' }] });
    expect(core.rkAsk(two, gentle, K, K)?.run).toBe(7);
  });

  it('is asked of the first slip in 7 days only: a second slip that week cannot be kept', () => {
    const k2 = core.addDays(K, 3);
    const days = { ...slip(K, { keep: true }), ...slip(k2, { id: 's2' }) };
    expect(core.rkFullDays(days)).toEqual({ [K]: 1 });
    expect(core.rkAsk(days, st, k2, k2)).toBeNull();
    /* the second slip ends the run either way; the first one's quest can still be finished for its badge */
    expect(L(days, k2).cur).toBe(0);
    expect(L(days, k2).kind[K]).toBe('open');
  });

  it('stops asking when the window closes unanswered, and still says an answer after it', () => {
    const after = core.addDays(K, core.RK_DAYS + 1);
    expect(core.rkAsk(slip(K), st, core.addDays(K, core.RK_DAYS), K)?.open).toBe(true);
    expect(core.rkAsk(slip(K), st, after, K)).toBeNull();
    expect(core.rkAsk(slip(K, { keep: false }), st, after, K)).toMatchObject({ keep: false, open: false });
  });
});

describe('the run', () => {
  it('keep: the quest saves it, and the run goes on', () => {
    const tk = core.addDays(K, 2);
    const l = L(slip(K, { keep: true, done: true }), tk);
    expect(l.kind[K]).toBe('saved');
    expect(l.cur).toBe(10);
    expect(l.saves).toBe(1);
  });

  it('start fresh: the run ends on the slip day, and the longest run stays', () => {
    const tk = core.addDays(K, 2);
    const l = L(slip(K, { keep: false, done: true }), tk);
    expect(l.kind[K]).toBeUndefined();
    expect(l.open).toBeNull();
    expect(l.cur).toBe(2);
    expect(l.longest).toBe(7);
  });

  it('no answer yet: the run waits for the quest, as before', () => {
    const days = slip(K);
    expect(L(days, K).open).toEqual({ k: K, run: 7, deep: false });
    expect(L(days, core.addDays(K, core.RK_DAYS)).kind[K]).toBe('open');
    expect(L(days, core.addDays(K, core.RK_DAYS + 1)).kind[K]).toBeUndefined();
    expect(L(slip(K, { done: true }), core.addDays(K, 1)).kind[K]).toBe('saved');
  });

  it('a run under 7 days ends at the slip, even with the quest done', () => {
    const l = L(slip(K6, { done: true }), core.addDays(K6, 2));
    expect(l.kind[K6]).toBeUndefined();
    expect(l.open).toBeNull();
    expect([l.cur, l.longest]).toEqual([2, 6]);
  });

  it('a short run saved before the rule came in stays saved', () => {
    const old = core.normSettings({ start: '2026-10-01', day1: '2026-10-08' });
    const k = '2026-10-12'; // a run of 4, before RUN_ASK_FROM
    expect(k < core.RUN_ASK_FROM).toBe(true);
    const l = core.runLedger(slip(k, { done: true }), old, '2026-11-01');
    expect(l.kind[k]).toBe('saved');
    expect(l.cur).toBe(25);
  });
});

describe('changing the answer', () => {
  it('sets it, changes it, and going back to keep reopens the wait', () => {
    let days = slip(K);
    days = core.rkKeep(days, st, K, K, 's1', false, 10)!;
    expect(days[K].events[0].keep).toBe(false);
    expect(days[K].u).toBeGreaterThan(1);
    expect(L(days, K).open).toBeNull();
    days = core.rkKeep(days, st, core.addDays(K, 1), K, 's1', true, 20)!;
    expect(days[K].events[0].keep).toBe(true);
    expect(L(days, core.addDays(K, 1)).open).toEqual({ k: K, run: 7, deep: false });
  });

  it('cannot change once the window closed, or for a slip that does not ask', () => {
    expect(core.rkKeep(slip(K), st, core.addDays(K, core.RK_DAYS + 1), K, 's1', false, 10)).toBeNull();
    expect(core.rkKeep(slip(K, { keep: false }), st, core.addDays(K, core.RK_DAYS + 1), K, 's1', true, 10)).toBeNull();
    expect(core.rkKeep(slip(K6), st, K6, K6, 's1', true, 10)).toBeNull();
    expect(core.rkKeep(slip(K), st, K, K, 'nope', true, 10)).toBeNull();
  });

  it('a run already saved stays saved', () => {
    const days = slip(K, { keep: true, done: true });
    const tk = core.addDays(K, 1);
    expect(core.rkAsk(days, st, tk, K)).toMatchObject({ saved: true, open: false, keep: true });
    expect(core.rkKeep(days, st, tk, K, 's1', false, 10)).toBeNull();
    expect(L(days, tk).kind[K]).toBe('saved');
  });

  it('Today asks of the latest slip, while it can still change', () => {
    const fresh = slip(K, { keep: false });
    for (let i = 0; i <= core.RK_DAYS; i++) expect(core.rkAskNow(fresh, st, core.addDays(K, i))).toMatchObject({ k: K, keep: false, open: true });
    expect(core.rkAskNow(fresh, st, core.addDays(K, core.RK_DAYS + 1))).toBeNull();
    expect(core.rkAskNow(slip(K, { keep: true, done: true }), st, core.addDays(K, 1))).toBeNull();
    expect(core.rkAskNow(slip(K6), st, K6)).toBeNull();
    expect(core.rkAskNow(slip(K), st, core.addDays(K, -1))).toBeNull();
    /* a second slip that week ended the run: nothing is left to choose */
    const two = { ...slip(K, { keep: true }), ...slip(core.addDays(K, 2), { id: 's2' }) };
    expect(core.rkAskNow(two, st, core.addDays(K, 2))).toBeNull();
  });

  it('keeps the answer on one slip of the day', () => {
    const days = slip(K, { more: [{ id: 's2', time: '23:00', outcome: 'slipped', keep: true }] });
    const next = core.rkKeep(days, st, K, K, 's1', false, 10)!;
    expect(next[K].events.map((e) => e.keep)).toEqual([false, undefined]);
    expect(core.rkKeepOf(next[K])).toBe(false);
  });
});

describe('the words follow the answer', () => {
  const fresh = slip(K, { keep: false });
  const words = (days: Days, tk: string) => {
    const r = core.rkActive(days, st, tk)!;
    return [
      JSON.stringify(core.rkEmbers(days, st, {}, tk, K, true, false).line),
      JSON.stringify(core.rkQuest(days, st, tk, K, days[K].events[0], 21)),
      JSON.stringify(core.rkCard(days, st, tk, r, 21)),
      JSON.stringify(core.runChips(core.cleanView(days, st, tk, new Date(2026, 10, 8, 23).getTime()))),
    ].join(' ');
  };

  it('start fresh never promises a save, and says what was built stays', () => {
    const w = words(fresh, K);
    expect(w).not.toMatch(/run waits|run is waiting|saves it|Save your|can still be saved|Run waiting/);
    expect(core.rkEmbers(fresh, st, {}, K, K, true, false).line).toEqual({
      b: 'Your 7-day run stays your longest.',
      rest: 'Your fresh run starts tomorrow. Your points, level and badges all stay.',
    });
    expect(core.rkCard(fresh, st, K, core.rkActive(fresh, st, K)!, 21).why).toBe('You chose to start fresh. Your 7-day run stays your longest.');
    expect(core.rkHonor(fresh, st, K, K)).toMatch(/^7 days\. That is huge, and it still counts\./);
  });

  it('keep, and no answer yet, read as today', () => {
    for (const days of [slip(K), slip(K, { keep: true })]) {
      expect(words(days, K)).toContain('Your 7-day run waits for you.');
      expect(core.rkQuest(days, st, K, K, days[K].events[0], 21).h).toBe('Save your 7-day run');
    }
  });

  it('a second slip on a start-fresh day, and on the day a short run ended', () => {
    const more = [{ id: 's2', time: '23:00', outcome: 'slipped' as const }];
    expect(core.rkLightLine(slip(K, { keep: false, more }), st, K, K, 0)).toBe(
      'You chose to start fresh, so a new run starts tomorrow. Your 7 days are kept, and so are your points, level and badges.',
    );
    expect(core.rkLightLine(slip(K6, { more }), st, K6, K6, 0)).toBe(
      'A new run starts tomorrow. Your 6 days are kept, and so are your points, level and badges.',
    );
    expect(core.rkEmbers(slip(K6), st, {}, K6, K6, true, false).line).toEqual({ b: 'Your 6 days are kept.', rest: 'A new run starts tomorrow.' });
  });

  it('the morning the window closes says the fresh start once', () => {
    const tk = core.addDays(K, core.RK_DAYS + 1);
    const e = core.rkEnded(fresh, st, tk)!;
    expect(e).toMatchObject({ run: 7, why: 'fresh', longest: 7 });
    expect(e.text).toBe('You chose to start fresh. Your new run counts from Monday, and it is already 4 days. What you built stays yours.');
    expect(core.rkEnded(slip(K6), st, core.addDays(K6, core.RK_DAYS + 1))).toBeNull();
    expect(core.rkFresh(fresh, st, core.addDays(K, 2), { k: K, run: 7 }).rest).toBe(
      'Your fresh run counts from Monday, and it is already 2 days. Your points, level and badges all stay.',
    );
  });
});

describe('the answer is kept', () => {
  it('through clean-up: true and false stay, anything else is dropped, and only on a slip', () => {
    const n = (e: unknown) => core.normDay({ events: [e] }, K).events[0];
    expect(n({ id: 'a', outcome: 'slipped', keep: true }).keep).toBe(true);
    expect(n({ id: 'a', outcome: 'slipped', keep: false }).keep).toBe(false);
    expect('keep' in n({ id: 'a', outcome: 'slipped', keep: 'yes' })).toBe(false);
    expect('keep' in n({ id: 'a', outcome: 'rode', keep: true })).toBe(false);
  });

  it('through a backup and a restore', () => {
    const days = { ...slip(K, { keep: false }), ...slip('2026-11-20', { keep: true, id: 's9' }) };
    const file = JSON.stringify(core.makeBackup({ settings: st, days, reviews: {} }));
    const back = core.readBackup(file);
    expect(back.days[K].events[0].keep).toBe(false);
    expect(back.days['2026-11-20'].events[0].keep).toBe(true);
    const r = core.restoreBackup({ settings: st, days: slip(K, { keep: true }), reviews: {} }, back, 99);
    expect(r.snap.days[K].events[0].keep).toBe(false);
  });

  it('through sync: the newest edit of the day wins', () => {
    const mine = slip(K, { keep: true });
    mine[K].u = 100;
    const theirs = { ...slip(K, { keep: false })[K], u: 200 };
    const rec = (d: unknown, u: number) => core.normRecord({ id: `days/${K}`, u, data: d })!;
    expect((rec(theirs, 200).data as core.Day).events[0].keep).toBe(false);
    const snap = { settings: st, days: mine, reviews: {} };
    const m = core.mergeRemote(snap, {}, [rec(theirs, 200)]);
    expect(m.snap.days[K].events[0].keep).toBe(false);
    const older = core.mergeRemote(snap, {}, [rec({ ...theirs, u: 50 }, 50)]);
    expect(older.snap.days[K].events[0].keep).toBe(true);
  });
});
