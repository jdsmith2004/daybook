/* One warm ending for each kind of moment (the UX audit of October 27, 2026): the words after a slip on a long run lead with
   what is permanent, a feeling only names a trigger when it plainly is one, and a look back on a go-ahead finds its slip, so
   the comeback can start from it. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { DayEvent, Days, Settings } from '../src/types';

const st: Settings = core.normSettings({ start: '2026-10-25', day1: '2026-11-01' });
const K = '2026-11-08'; // Day 8: the slip ends a run of 7 days (Nov 1 to 7)
const K6 = '2026-11-07'; // Day 7: a run of 6
const slip = (k: string, more: Partial<DayEvent>[] = []): Days => ({
  [k]: { ...core.normDay({ events: [{ id: 's1', time: '22:00', outcome: 'slipped' }, ...more] }, k), u: 1 },
});

describe('a slip after a long run', () => {
  it('knows the run it came after', () => {
    expect(core.rkRunBefore(slip(K), st, K, K)).toBe(7);
    expect(core.rkRunBefore(slip(K6), st, K6, K6)).toBe(6);
    /* nothing counted yet, or not counting days */
    expect(core.rkRunBefore(slip('2026-10-28'), st, '2026-10-28', '2026-10-28')).toBe(0);
    expect(core.rkRunBefore(slip(K), { ...st, cleanMode: 'step' }, K, K)).toBe(0);
  });

  it('is never "down to embers" when the run was long', () => {
    expect(core.rkHoldWords(false, false, 39).p).toBe('Your 39 days built a fire that holds its heat. Press and hold to breathe it back up.');
    expect(core.rkHoldWords(false, false, 6).p).toMatch(/down to embers/);
    expect(core.rkHoldWords(false, false).p).toMatch(/down to embers/);
  });

  it('leads with what is permanent, in the words of the mode, and never says a run can be saved or lost', () => {
    const days = slip(K);
    expect(core.rkLitLine(days, st, {}, K, K)).toBe('Your 7 days are on your record, and everything you earned is still yours.');
    const g = { ...st, cleanMode: 'gentle' as const };
    expect(core.rkRunBefore(days, g, K, K)).toBe(7);
    expect(core.rkLitLine(days, g, {}, K, K)).toBe('Your 7 days still count, and everything you earned is still yours.');
    expect([core.rkLitLine(days, st, {}, K, K), core.rkLitLine(days, g, {}, K, K)].join(' ')).not.toMatch(/for now|saved?\b|down to embers|start fresh/i);
  });
});

describe('a feeling names a trigger only when it plainly is one', () => {
  it('lonely, bored, tired; fear and anger as stress; never shame or a low mood', () => {
    expect(core.feelTrigOf('lonely')).toBe('lonely');
    expect(core.feelTrigOf('bored')).toBe('bored');
    expect(core.feelTrigOf('tired')).toBe('tired');
    expect(core.feelTrigOf('fear')).toBe('stress');
    expect(core.feelTrigOf('anger')).toBe('stress');
    expect(core.feelTrigOf('shame')).toBeNull();
    expect(core.feelTrigOf(core.famOfWord('Ashamed'))).toBeNull();
    expect(core.feelTrigOf('low')).toBeNull();
    expect(core.feelTrigOf(null)).toBeNull();
  });
});

describe('a look back on a go-ahead finds its slip', () => {
  const k = '2026-11-10';
  const t = new Date(2026, 10, 10, 22, 30).getTime();
  it('the slip written by the look back, or the one already logged after the talk-through', () => {
    const talk = { ...core.newTalk(t), p: 'open' as const };
    let days: Days = core.saveTalk({}, k, talk);
    /* an earlier slip that day, before the talk-through, is not the one */
    days = core.addEvent(days, k, 'slipped', '20:00').days;
    expect(core.slipAfterTalk(days, k, t, k)).toBeNull();
    const back = core.lookBack(days, talk.id, { went: true, f: [], g: 3, c: [], fx: [], cx: [] }, '2026-11-11', t + 3600000);
    const found = core.slipAfterTalk(back, k, t, '2026-11-11');
    expect(found?.k).toBe(k);
    expect(back[k].events.find((e) => e.id === found!.id)?.note).toMatch(/eyes open/);
    /* logged by the person the next day: that one */
    const own = core.addEvent(days, '2026-11-11', 'slipped', '00:40');
    expect(core.slipAfterTalk(own.days, k, t, '2026-11-11')).toEqual({ k: '2026-11-11', id: own.id });
  });
});
