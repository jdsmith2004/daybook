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

describe('every look back on a slip reaches the comeback', () => {
  const k = '2026-11-10';
  const open = (t: number, e: number | null = 8) => ({ ...core.newTalk(t), p: 'open' as const, e });
  const went = { went: true, f: [], g: null, c: [] };
  const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();

  it('planned before midnight and said after it, on the same log day: one slip, and it is found', () => {
    const t = at(10, 23);
    const talk = open(t);
    const days = core.lookBack(core.saveTalk({}, k, talk, t), talk.id, went, k, at(11, 0, 30));
    expect(days[k].events.filter((e) => e.outcome === 'slipped')).toHaveLength(1);
    expect(core.slipAfterTalk(days, k, t, k)?.id).toBe(days[k].events[0].id);
  });

  it('a slip logged after midnight is the one looked back on, and no second one is written', () => {
    const t = at(10, 23);
    const talk = open(t);
    const had = core.addEvent(core.saveTalk({}, k, talk, t), k, 'slipped', '00:10');
    const days = core.lookBack(had.days, talk.id, went, k, at(11, 0, 30));
    expect(days[k].events.filter((e) => e.outcome === 'slipped')).toHaveLength(1);
    expect(core.slipAfterTalk(days, k, t, k)?.id).toBe(had.id);
  });

  it('Undo on the hold opens the look back again, with no slip left', () => {
    const t = at(10, 20);
    const talk = open(t);
    const base = core.saveTalk({}, k, talk, t);
    const days = core.lookBack(base, talk.id, went, k, at(10, 21));
    const sl = core.slipAfterTalk(days, k, t, k)!;
    const back = core.lookUndo(core.removeEvent(days, sl.k, sl.id), talk.id);
    expect(back[k].events.filter((e) => e.outcome === 'slipped')).toHaveLength(0);
    expect(core.talkById(back, talk.id)!.talk.a).toBeNull();
    expect(core.talkDue(back, at(10, 22))?.due).toBe('look');
  });

  it('a slip held through Rekindle settles the go-ahead before it, so Today does not ask again, and no points move', () => {
    const t = at(10, 20);
    const talk = open(t);
    const had = core.addEvent(core.saveTalk({}, k, talk, t), k, 'slipped', '21:00');
    expect(core.talkDue(had.days, at(10, 22))?.due).toBe('look');
    const pts0 = core.gameCompute(had.days, st, {}, k).pts;
    const days = core.settleGoAhead(had.days, k, '21:00', k, at(10, 21, 5));
    expect(core.talkDue(days, at(10, 22))).toBeNull();
    expect(days[k].events.filter((e) => e.outcome === 'slipped')).toHaveLength(1);
    expect(core.gameCompute(days, st, {}, k).pts).toBe(pts0);
  });

  it('a slip before the go-ahead, or long after it, does not settle it', () => {
    const t = at(10, 20);
    const talk = open(t);
    const had = core.addEvent(core.saveTalk({}, k, talk, t), k, 'slipped', '19:00');
    expect(core.goAheadBefore(had.days, k, '19:00', at(10, 21))).toBeNull();
    const later = core.addEvent(core.saveTalk({}, k, talk, t), '2026-11-15', 'slipped', '21:00');
    expect(core.goAheadBefore(later.days, '2026-11-15', '21:00', at(15, 21))).toBeNull();
    /* said no to already: nothing to settle */
    const no = core.lookBack(core.saveTalk({}, k, talk, t), talk.id, { ...went, went: false }, k, at(10, 21));
    expect(core.goAheadBefore(no, k, '22:00', at(10, 22))).toBeNull();
  });

  it("keeps what it really gave, said after the hold, as the person's own numbers", () => {
    const t = at(10, 20);
    const talk = open(t, 8);
    let days = core.lookBack(core.saveTalk({}, k, talk, t), talk.id, went, k, at(10, 21));
    expect(core.talkEvidence(days).rows).toEqual([]);
    expect(core.goAheadBefore(days, k, '21:00', at(10, 21))?.talk.id).toBe(talk.id);
    days = core.lookBackGave(days, talk.id, 3, at(10, 21, 2));
    expect(core.talkEvidence(days).rows).toEqual([{ e: 8, g: 3 }]);
    expect(core.talkById(days, talk.id)!.talk.a!.went).toBe(true);
    /* a slip is counted once, and the record survives a round through the log's cleaning */
    expect(days[k].events.filter((e) => e.outcome === 'slipped')).toHaveLength(1);
  });

  it('a plan made after a slip comes back with the door to its tool', () => {
    const t = at(10, 23);
    const talk = { ...core.newTalk(t), p: 'change' as const, pr: 1 as const, n: 'close' as const, m: ['sos' as const], mo: 'late', ft: 'lonely' as const };
    const days = core.saveTalk({}, k, talk, t);
    expect(core.talkPlanLine(talk)).toBe('When I feel lonely or low late at night, I will open SOS.');
    expect(core.talkPlanNow(days, st, '2026-11-11', at(11, 20, 30))).toMatchObject({ door: { go: 'sos' }, head: 'Your plan for tonight' });
    const own = { ...talk, id: 'own', m: [], mx: ['Play guitar'] };
    expect(core.talkPlanNow(core.saveTalk({}, k, own, t), st, '2026-11-11', at(11, 20, 30))?.door).toBeNull();
  });
});
