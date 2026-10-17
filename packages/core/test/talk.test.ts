/* Talk it through: the cards for what was picked, the words said back, the plan line, saving, Today's card and looking back. */
import { describe, expect, it } from 'vitest';
import { normDay } from '../src/legacy/core.js';
import {
  newTalk,
  normTalk,
  TALK_CARDS,
  TALK_SRC,
  talkById,
  talkCards,
  talkClock,
  talkDue,
  talkEvidence,
  talkEvidenceLine,
  talkMomentsNow,
  talkMomentTime,
  talkMoves,
  talkMoveWords,
  talkNeedWord,
  TALK_OWN_LEN,
  talkPlanLine,
  talkReflect,
  talkTypedWhys,
  talkWaitTime,
  talkWhys,
  type Talk,
} from '../src/talk';
import { lookBack, saveTalk } from '../src/talk-log';
import type { Days } from '../src/types';

const at = (s: string) => new Date(s).getTime();
const T0 = at('2026-10-17T15:00:00');
const k = '2026-10-17';
const base = (o: Partial<Talk> = {}): Talk => ({ ...newTalk(T0), s: ['plan', 'owed'], n: 'relief', w: 6, ...o });

describe('the cards', () => {
  it('every card cites a source that exists', () => {
    for (const c of TALK_CARDS) for (const s of c.src) expect(TALK_SRC[s], c.k + ' ' + s).toBeTruthy();
  });
  it('shows the cards for what was picked, and always ends with curiosity', () => {
    expect(talkCards(['replay']).map((c) => c.k)).toEqual(['loop', 'lens']);
    expect(talkCards(['plan', 'owed']).map((c) => c.k)).toEqual(['chain', 'gap', 'permit', 'lens']);
    expect(talkCards(['care']).map((c) => c.k)).toEqual(['cliff', 'scale', 'lens']);
    expect(talkCards([]).map((c) => c.k)).toEqual(['lens']);
  });
  it('uses plain words, with no contractions', () => {
    for (const c of TALK_CARDS) expect(c.title + c.body + c.short).not.toMatch(/\b\w+'(t|s|re|ve|ll|d)\b/);
  });
});

describe('talking it through', () => {
  it('says the number back without judging it', () => {
    expect(talkReflect(0)).toMatch(/^You said 0\. Thank you/);
    expect(talkReflect(2)).toMatch(/^You said 2, not 0\./);
    expect(talkReflect(5)).toMatch(/Both are real/);
    expect(talkReflect(9)).toMatch(/Most of you/);
  });
  it('offers your own reasons first, once each', () => {
    expect(talkWhys(['My kids', ' ', 'The people I love'])).toEqual([
      'My kids',
      'The people I love',
      'Sleeping well tonight',
      'Waking up proud',
      'My time',
      'My focus tomorrow',
      'Keeping my word to myself',
    ]);
  });
  it('brings back reasons typed in earlier talk-throughs, and not the common ones', () => {
    let days: Days = {};
    days = saveTalk(days, k, base({ id: 'a', why: ['Waking up proud', 'Being there for my kids'] }), T0);
    expect(talkTypedWhys(days)).toEqual(['Being there for my kids']);
    expect(talkWhys([], talkTypedWhys(days))[0]).toBe('Being there for my kids');
  });
  it('takes a need in your own words when none of the list fits', () => {
    expect(talkNeedWord(null, 'control')).toBe('control');
    expect(talkNeedWord('rest', 'control')).toBe('rest');
    expect(talkNeedWord(null)).toBe('it');
  });
  it('offers moves for the need, then the two that break the earliest links', () => {
    expect(talkMoves('close')).toEqual(['text', 'call', 'people', 'away', 'block']);
  });
});

describe('times', () => {
  it('leaves out moments already past, and keeps "now" and "in an hour"', () => {
    expect(talkMomentsNow(at('2026-10-17T19:00:00')).map((m) => m[0])).toEqual(['now', 'soon', 'evening', 'late']);
    expect(talkMomentTime('evening', T0)).toBe(at('2026-10-17T20:00:00'));
    expect(talkMomentTime('soon', T0)).toBe(at('2026-10-17T16:00:00'));
    expect(talkMomentTime('now', T0)).toBeNull();
  });
  it('decides later in minutes, or tomorrow at 8', () => {
    expect(talkWaitTime('60', T0)).toBe(at('2026-10-17T16:00:00'));
    expect(talkWaitTime('morning', T0)).toBe(at('2026-10-18T08:00:00'));
    expect(talkClock(at('2026-10-17T20:30:00'))).toBe('8:30 PM');
  });
  it('reads the change plan as one line', () => {
    expect(talkPlanLine({ n: 'relief', m: ['walk', 'away'], mo: 'evening' })).toBe(
      'This evening, when I want relief, I will walk it off and put the device out of reach.',
    );
    expect(talkPlanLine({ n: null, m: [], mo: 'now' })).toBe('Right now, when I want it, I will do what I planned.');
  });
});

describe('the record', () => {
  it('cleans what is saved, and keeps it in a saved day', () => {
    const x = normTalk({ ...base(), s: ['plan', 'nope'], w: 11, why: [' Sleep ', 3], m: ['walk', 'x'], a: { went: 'yes' } })!;
    expect(x.s).toEqual(['plan']);
    expect(x.w).toBeNull();
    expect(x.why).toEqual(['Sleep']);
    expect(x.m).toEqual(['walk']);
    expect(x.a).toBeNull();
    expect(normTalk({ id: 'x' })).toBeNull();
    const d = normDay({ d: k, events: [], p: { c: 1, tt: [base()] } }, k);
    expect(d.p!.tt).toEqual([base()]);
    expect('tt' in normDay({ d: k, events: [], p: { c: 1 } }, k).p!).toBe(false);
  });
  it('keeps answers in your own words, short and once each, and only when there are some', () => {
    const long = 'x'.repeat(90);
    const x = normTalk({
      ...base({ n: null }),
      nx: '  feeling   in control ',
      mx: ['Play guitar', 'play guitar', long, 'Read', 'Call Sam', 4],
      a: { went: true, t: T0, f: [], g: 3, c: ['time'], fx: ['Numb'], cx: [] },
    })!;
    expect(x.nx).toBe('feeling in control');
    expect(x.mx).toEqual(['Play guitar', 'x'.repeat(TALK_OWN_LEN), 'Read']);
    expect(x.a!.fx).toEqual(['Numb']);
    expect('cx' in x.a!).toBe(false);
    expect('nx' in normTalk({ ...base(), nx: 'control' })!).toBe(false);
    expect('mx' in normTalk(base())!).toBe(false);
  });
  it('reads your own moves in the plan line', () => {
    expect(talkPlanLine({ n: null, nx: 'control', m: ['away'], mx: ['Play guitar.'], mo: 'evening' })).toBe(
      'This evening, when I want control, I will put the device out of reach and play guitar.',
    );
    expect(talkMoveWords({ m: ['walk'], mx: ['Play guitar'] })).toEqual(['Walk it off', 'Play guitar']);
  });
  it('a new talk-through is a calm move; changing it is not', () => {
    let days: Days = saveTalk({}, k, base(), T0);
    expect(days[k]!.p!.c).toBe(1);
    days = saveTalk(days, k, base({ p: 'wait', mo: '60', at: T0 + 3600000 }), T0 + 1);
    expect(days[k]!.p!.c).toBe(1);
    expect(days[k]!.p!.tt).toHaveLength(1);
    expect(talkById(days, base().id)!.talk.p).toBe('wait');
  });
});

describe('Today and looking back', () => {
  it('knows what is due', () => {
    const wait = saveTalk({}, k, base({ p: 'wait', at: T0 + 3600000 }), T0);
    expect(talkDue(wait, T0 + 60000)!.due).toBe('waiting');
    expect(talkDue(wait, T0 + 2 * 3600000)!.due).toBe('decide');
    const change = saveTalk({}, k, base({ p: 'change', m: ['walk'], mo: 'evening', at: at('2026-10-17T20:00:00') }), T0);
    expect(talkDue(change, T0)!.due).toBe('plan');
    expect(talkDue(change, at('2026-10-17T21:00:00'))!.due).toBe('look');
    expect(talkDue(change, T0 + 37 * 3600000)).toBeNull();
    const now = saveTalk({}, k, base({ p: 'change', m: ['walk'], mo: 'now', at: null }), T0);
    expect(talkDue(now, T0 + 30 * 60000)!.due).toBe('plan');
    expect(talkDue(now, T0 + 61 * 60000)!.due).toBe('look');
    expect(talkDue(saveTalk({}, k, base(), T0), T0)).toBeNull();
  });
  it('choosing something else is a calm move, and nothing is logged', () => {
    const days = lookBack(saveTalk({}, k, base({ p: 'change', m: ['walk'] }), T0), base().id, { went: false, f: [], g: null, c: [] }, k, T0 + 3600000);
    expect(days[k]!.p!.c).toBe(2);
    expect(days[k]!.events).toHaveLength(0);
    expect(talkDue(days, T0 + 3600000)).toBeNull();
  });
  it('going ahead is logged once, honestly, and kept as evidence', () => {
    let days = saveTalk({}, k, base({ p: 'open', e: 8 }), T0);
    days = lookBack(days, base().id, { went: true, f: ['flat'], g: 4, c: ['sleep'] }, k, at('2026-10-17T22:00:00'));
    expect(days[k]!.events.map((e) => e.outcome)).toEqual(['slipped']);
    expect(days[k]!.p!.c).toBe(1);
    expect(lookBack(days, base().id, { went: true, f: [], g: 1, c: [] }, k, at('2026-10-17T23:00:00'))).toBe(days);
    const ev = talkEvidence(days);
    expect(ev).toMatchObject({ expected: 8, gave: 4, went: 1, chose: 0 });
    expect(talkEvidenceLine(ev)).toBe('You expected 8. It gave 4. That gap is wanting and liking coming apart.');
  });
  it('does not log twice when the slip is in the log already', () => {
    let days = saveTalk({}, k, base({ p: 'open', e: 7 }), T0);
    days[k] = { ...days[k]!, events: [{ id: 'e1', time: '21:30', outcome: 'slipped', trigger: null, paused: null, did: null, recovered: false, note: '' }] };
    days = lookBack(days, base().id, { went: true, f: [], g: 5, c: [] }, k, at('2026-10-17T22:00:00'));
    expect(days[k]!.events).toHaveLength(1);
  });
  it('sums the gap across times', () => {
    let days: Days = {};
    for (const [i, e, g] of [
      [0, 8, 4],
      [1, 7, 3],
      [2, 9, 3],
    ] as const) {
      const t = { ...base({ p: 'open', e }), id: 't' + i, t: T0 + i * 1000 };
      days = lookBack(saveTalk(days, k, t, T0), t.id, { went: true, f: [], g, c: [] }, k, T0 + 9000);
    }
    expect(talkEvidenceLine(talkEvidence(days))).toBe('Across 3 times, you expected 8 on average, and it gave 3.3. Your own numbers are showing the gap.');
  });
});
