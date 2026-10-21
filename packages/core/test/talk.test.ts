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
  talkAgo,
  talkHeld,
  talkHeldTag,
  talkLookAt,
  talkReading,
  talkUntilLine,
  type Talk,
  type TalkSign,
} from '../src/talk';
import { addEvent } from '../src/mutate';
import { lookBack, saveTalk, talkDueNow } from '../src/talk-log';
import type { Days, Settings } from '../src/types';

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
    expect(talkDue(wait, T0 + 37 * 3600000)).toBeNull();
    const change = saveTalk({}, k, base({ p: 'change', m: ['walk'], mo: 'evening', at: at('2026-10-17T20:00:00') }), T0);
    expect(talkDue(change, T0)!.due).toBe('plan');
    /* past the moment, the plan stays on Today; the look back waits for the morning */
    expect(talkDue(change, at('2026-10-17T21:00:00'))!.due).toBe('plan');
    expect(talkDue(change, at('2026-10-18T06:00:00'))!.due).toBe('look');
    expect(talkDue(change, at('2026-10-19T05:59:00'))!.due).toBe('look');
    expect(talkDue(change, at('2026-10-19T06:00:00'))).toBeNull();
    const now = saveTalk({}, k, base({ p: 'change', m: ['walk'], mo: 'now', at: null }), T0);
    expect(talkDue(now, T0 + 61 * 60000)!.due).toBe('plan');
    expect(talkDue(now, at('2026-10-18T06:00:00'))!.due).toBe('look');
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

describe('the reading, kept short', () => {
  it('shows the best fit and curiosity in full the first time, and the rest as one line each', () => {
    const r = talkReading(['care', 'anyway'], []);
    expect(r.fresh.map((c) => c.k)).toEqual(['cliff', 'lens']);
    expect(r.known.map((c) => c.k)).toEqual(['chain', 'gap', 'permit', 'scale']);
  });
  it('picks the unread card that fits the most, the earlier one on a tie', () => {
    expect(talkReading(['plan', 'owed'], []).fresh.map((c) => c.k)).toEqual(['gap', 'lens']);
    expect(talkReading(['plan'], []).fresh.map((c) => c.k)).toEqual(['chain', 'lens']);
    expect(talkReading(['care', 'anyway'], ['cliff']).fresh.map((c) => c.k)).toEqual(['chain', 'lens']);
  });
  it('shows curiosity in full only until it has been read', () => {
    const r = talkReading(['replay'], ['lens']);
    expect(r.fresh.map((c) => c.k)).toEqual(['loop']);
    expect(r.known.map((c) => c.k)).toEqual(['lens']);
  });
  it('shows no card in full when every one that fits has been read', () => {
    const r = talkReading(['care'], ['cliff', 'scale', 'lens']);
    expect(r.fresh).toEqual([]);
    expect(r.known.map((c) => c.k)).toEqual(['cliff', 'scale', 'lens']);
  });
  it('never shows more than two in full, and loses none', () => {
    const signs: TalkSign[] = ['plan', 'owed', 'care', 'anyway', 'replay'];
    const r = talkReading(signs, []);
    expect(r.fresh.length).toBe(2);
    expect(r.fresh.concat(r.known).length).toBe(talkCards(signs).length);
  });
});

describe('moves that held before', () => {
  const plan = (id: string, m: Talk['m'], went: boolean | null, i: number): [Talk, boolean | null] => [
    { ...base({ p: 'change', m, mo: 'now', at: null }), id, t: T0 + i * 1000 },
    went,
  ];
  const seed = (list: [Talk, boolean | null][]) => {
    let days: Days = {};
    for (const [t, went] of list) {
      days = saveTalk(days, k, t, T0);
      if (went != null) days = lookBack(days, t.id, { went, f: [], g: null, c: [] }, k, T0 + 9000);
    }
    return days;
  };
  it('counts each move in a change plan that was looked back on, and how often it held', () => {
    const days = seed([
      plan('a', ['walk', 'away'], false, 0),
      plan('b', ['walk'], false, 1),
      plan('c', ['walk', 'breathe'], true, 2),
      plan('d', ['shower'], null, 3),
    ]);
    expect(talkHeld(days)).toEqual({ walk: { held: 2, n: 3 }, away: { held: 1, n: 1 }, breathe: { held: 0, n: 1 } });
  });
  it('leaves out other paths and plans not looked back on', () => {
    let days = saveTalk({}, k, base({ id: 'o', p: 'open' }), T0);
    days = lookBack(days, 'o', { went: false, f: [], g: null, c: [] }, k, T0 + 1);
    expect(talkHeld(days)).toEqual({});
  });
  it('offers the moves that held first, the most held first, then the rest in their usual order', () => {
    const held = { walk: { held: 2, n: 3 }, away: { held: 3, n: 4 }, breathe: { held: 0, n: 2 } };
    expect(talkMoves('relief', held)).toEqual(['away', 'walk', 'shower', 'breathe', 'write', 'block']);
    expect(talkMoves('relief', { write: { held: 1, n: 1 }, shower: { held: 1, n: 2 } })).toEqual(['write', 'shower', 'walk', 'breathe', 'away', 'block']);
    expect(talkMoves('relief')).toEqual(['walk', 'shower', 'breathe', 'write', 'away', 'block']);
  });
  it('never offers a move for another need just because it held', () => {
    expect(talkMoves('rest', { walk: { held: 4, n: 4 } })).toEqual(['bed', 'nap', 'shower', 'away', 'block']);
  });
  it('tags a move that held, and says nothing about one that did not', () => {
    const held = { walk: { held: 3, n: 4 }, away: { held: 1, n: 1 }, breathe: { held: 0, n: 2 } };
    expect(talkHeldTag(held, 'walk')).toBe('Held 3 of 4 times');
    expect(talkHeldTag(held, 'away')).toBe('Held last time');
    expect(talkHeldTag(held, 'breathe')).toBe('');
    expect(talkHeldTag(held, 'nap')).toBe('');
  });
});

describe('looking back on a change plan the next morning', () => {
  it('opens at the later of the next morning and two hours after the moment', () => {
    expect(talkLookAt({ t: T0, at: at('2026-10-17T23:00:00') })).toBe(at('2026-10-18T06:00:00'));
    expect(talkLookAt({ t: T0, at: null })).toBe(at('2026-10-18T06:00:00'));
    expect(talkLookAt({ t: at('2026-10-18T05:00:00'), at: null })).toBe(at('2026-10-18T07:00:00'));
    expect(talkLookAt({ t: at('2026-10-18T01:00:00'), at: null })).toBe(at('2026-10-18T06:00:00'));
    expect(talkLookAt({ t: at('2026-10-18T06:00:00'), at: null })).toBe(at('2026-10-19T06:00:00'));
  });
  it('waits for the hard hours to end', () => {
    const hard: [number, number][] = [[at('2026-10-18T05:00:00'), at('2026-10-18T07:00:00')]];
    expect(talkLookAt({ t: T0, at: at('2026-10-17T23:00:00') }, hard)).toBe(at('2026-10-18T07:00:00'));
  });
  it('is never offered inside the hard hours', () => {
    const days = saveTalk({}, k, base({ p: 'change', m: ['bed'], mo: 'late', at: at('2026-10-17T23:00:00') }), T0);
    const hard: [number, number][] = [[at('2026-10-18T21:00:00'), at('2026-10-18T23:00:00')]];
    expect(talkDue(days, at('2026-10-18T20:59:00'), hard)!.due).toBe('look');
    expect(talkDue(days, at('2026-10-18T21:20:00'), hard)).toBeNull();
    expect(talkDue(days, at('2026-10-18T23:00:00'), hard)!.due).toBe('look');
  });
  it('reads the hard hours from the log', () => {
    const st = { rollover: 4 } as Settings;
    let days = addEvent({}, '2026-10-05', 'slipped', '06:10', {}, 1).days;
    days = addEvent(days, '2026-10-07', 'slipped', '06:40', {}, 1).days;
    days = saveTalk(days, k, base({ p: 'change', m: ['bed'], mo: 'late', at: at('2026-10-17T23:00:00') }), T0);
    expect(talkDueNow(days, st, '2026-10-18', at('2026-10-18T06:30:00'))!.due).toBe('plan');
    expect(talkDueNow(days, st, '2026-10-18', at('2026-10-18T08:00:00'))!.due).toBe('look');
    expect(talkDueNow(days, null, '2026-10-18', at('2026-10-18T06:30:00'))!.due).toBe('look');
  });
});

describe('going ahead with eyes open, even with no look back', () => {
  const open = (o: Partial<Talk> = {}) => base({ p: 'open', e: 8, at: T0 + 3600000, ...o });
  it('keeps asking for three days, then lets it go and writes nothing', () => {
    const days = saveTalk({}, k, open(), T0);
    expect(talkDue(days, T0)!.due).toBe('look');
    expect(talkDue(days, T0 + 40 * 3600000)!.due).toBe('look');
    expect(talkDue(days, T0 + 71 * 3600000)!.talk.id).toBe(open().id);
    expect(talkDue(days, T0 + 72 * 3600000)).toBeNull();
    expect(Object.values(days).flatMap((d) => d!.events)).toEqual([]);
  });
  it('a pending go-ahead from an old record (saved before this) is asked about the same way', () => {
    const old = { id: 'told', t: T0, s: ['care'], n: 'rest', w: 0, why: [], p: 'open', m: [], mo: null, at: T0 + 3600000, b: [], f: [], e: 7, a: null };
    const d = normDay({ d: k, events: [], p: { c: 1, tt: [old] } }, k);
    expect(talkDue({ [k]: d }, T0 + 50 * 3600000)!.due).toBe('look');
    const thin = normTalk({ id: 'tthin', t: T0, p: 'open' })!;
    expect(thin).toMatchObject({ s: [], m: [], b: [], f: [], e: null, a: null, at: null });
    expect(talkDue(saveTalk({}, k, thin, T0), T0 + 3600000)!.due).toBe('look');
  });
  it('a newer plan comes first, and the go-ahead is asked about again once that is done', () => {
    let days = saveTalk({}, k, open(), T0);
    const later = { ...base({ p: 'change', m: ['walk'], mo: 'now', at: null }), id: 'tlater', t: T0 + 3600000 };
    days = saveTalk(days, k, later, T0 + 3600000);
    expect(talkDue(days, T0 + 2 * 3600000)!.talk.id).toBe('tlater');
    days = lookBack(days, 'tlater', { went: false, f: [], g: null, c: [] }, k, T0 + 3 * 3600000);
    expect(talkDue(days, T0 + 4 * 3600000)!.talk.id).toBe(open().id);
  });
  it('the next morning, a yes goes on the day it happened, with no time, and only once', () => {
    let days = saveTalk({}, k, open(), T0);
    days = lookBack(days, open().id, { went: true, f: ['flat'], g: 3, c: ['sleep'] }, '2026-10-18', at('2026-10-18T08:00:00'));
    expect(days[k]!.events).toMatchObject([{ outcome: 'slipped', time: null, note: 'Talked it through first, and went ahead with eyes open.' }]);
    expect(days['2026-10-18']).toBeUndefined();
    expect(talkDue(days, at('2026-10-18T08:01:00'))).toBeNull();
    expect(talkEvidence(days)).toMatchObject({ expected: 8, gave: 3, went: 1 });
    expect(lookBack(days, open().id, { went: true, f: [], g: 1, c: [] }, '2026-10-18', at('2026-10-18T09:00:00'))).toBe(days);
  });
  it('the same log day, a yes goes on today at the time it is now, as before', () => {
    const days = lookBack(saveTalk({}, k, open(), T0), open().id, { went: true, f: [], g: 4, c: [] }, k, at('2026-10-17T21:15:00'));
    expect(days[k]!.events).toMatchObject([{ outcome: 'slipped', time: '21:15' }]);
  });
  it('a slip already logged after the talk-through, on any day since, is not logged again', () => {
    let days = saveTalk({}, k, open(), T0);
    days = addEvent(days, '2026-10-18', 'slipped', '00:30', {}, T0).days;
    days = lookBack(days, open().id, { went: true, f: [], g: 4, c: [] }, '2026-10-19', at('2026-10-19T08:00:00'));
    expect(Object.values(days).flatMap((d) => d!.events)).toHaveLength(1);
    let before = addEvent({}, k, 'slipped', '09:00', {}, T0).days;
    before = saveTalk(before, k, open(), T0);
    before = lookBack(before, open().id, { went: true, f: [], g: 4, c: [] }, '2026-10-18', at('2026-10-18T08:00:00'));
    expect(before[k]!.events.map((e) => e.time)).toEqual(['09:00', null]);
  });
  it('a no is a calm move and logs nothing, and nothing earned is taken away either way', () => {
    let days = saveTalk({}, k, open(), T0);
    expect(days[k]!.p!.c).toBe(1);
    days = lookBack(days, open().id, { went: false, f: [], g: null, c: [] }, '2026-10-19', at('2026-10-19T08:00:00'));
    expect(days[k]!.p!.c).toBe(2);
    expect(days[k]!.events).toEqual([]);
    let went = saveTalk({}, k, open(), T0);
    went = lookBack(went, open().id, { went: true, f: [], g: 2, c: [] }, '2026-10-18', at('2026-10-18T08:00:00'));
    expect(went[k]!.p!.c).toBe(1);
  });
  it('saving the go-ahead again as it is filled in counts once, and keeps it waiting', () => {
    let days = saveTalk({}, k, open({ e: null }), T0);
    days = saveTalk(days, k, open({ b: ['chest'], f: ['tight'], e: 6 }), T0 + 60000);
    expect(days[k]!.p!.c).toBe(1);
    expect(talkDue(days, T0 + 120000)).toMatchObject({ due: 'look', talk: { e: 6, b: ['chest'] } });
  });
});

describe('the words', () => {
  it('says when a talk-through was, from today', () => {
    expect(talkAgo(k, k, T0)).toBe('');
    expect(talkAgo(k, '2026-10-18', at('2026-10-17T21:00:00'))).toBe('last night');
    expect(talkAgo(k, '2026-10-18', at('2026-10-18T01:30:00'))).toBe('last night');
    expect(talkAgo(k, '2026-10-18', T0)).toBe('yesterday');
    expect(talkAgo(k, '2026-10-19', T0)).toBe('on Saturday');
  });
  it('lowers only the first letter of the move until then', () => {
    expect(talkUntilLine({ m: ['treat'] })).toBe('Until then: a real treat: food I love, a game, a show.');
    expect(talkUntilLine({ m: [], mx: ['I will play guitar.'] })).toBe('Until then: I will play guitar.');
    expect(talkUntilLine({ m: [], mx: ['Call Sam'] })).toBe('Until then: call Sam.');
    expect(talkUntilLine({ m: [] })).toBe('Until then: something kind for yourself.');
  });
});
