/* The month calendar in Pattern, and the summary of one day. */
import { describe, expect, it } from 'vitest';
import { blankP, normDay, normSettings } from '../src/legacy/core.js';
import { calMonth, calNeighbors, daySummary } from '../src/calendar';
import { addEvent } from '../src/mutate';
import { newTalk } from '../src/talk';
import type { Days } from '../src/types';

const st = normSettings({ start: '2026-09-20', day1: '2026-09-27' });
const TK = '2026-10-18';
function log(): Days {
  let d: Days = {};
  d = addEvent(d, '2026-10-02', 'slipped', '22:10', { trigger: 'stress' }, 1).days;
  d = addEvent(d, '2026-10-02', 'slipped', '23:30', {}, 1).days;
  d = addEvent(d, '2026-10-05', 'rode', '21:00', { trigger: 'bored', did: ['move'], m: 6, tr: [['breathe', 'p']], note: 'Walked it off' }, 1).days;
  d['2026-10-05'] = {
    ...d['2026-10-05'],
    checkin: { m: 6, c: 5, e: 7, s: 3, h: 7.5, so: 'Y', ro: 'N', n: 'Good day.', done: true, at: 1 },
    p: { ...normDay({}, '2026-10-05').p!, tl: ['breathe'], ls: ['l2'], po: '22:40', hw: 21 },
  };
  d = addEvent(d, '2026-09-22', 'rode', '20:00', {}, 1).days;
  return d;
}

describe('the month calendar', () => {
  const d = log();
  it('colors each day by how it went, and knows the days to come', () => {
    const m = calMonth(d, st, TK);
    expect(m.ym).toBe('2026-10');
    expect(m.title).toBe('October 2026');
    expect(m.lead).toBe(4);
    expect(m.days).toHaveLength(31);
    const k = (n: number) => m.days[n - 1].kind;
    expect([k(1), k(2), k(5), k(18), k(19)]).toEqual(['ok', 'slip', 'ok', 'ok', 'ahead']);
    expect(m.days[1].slips).toBe(2);
    expect(m.days[17].today).toBe(true);
    expect(m.sum).toEqual({ noSlip: 17, slips: 2, rode: 1, logged: 2 });
  });
  it('goes back to where the log starts, and no further than today', () => {
    expect(calMonth(d, st, TK).prev).toBe('2026-09');
    expect(calMonth(d, st, TK).next).toBeNull();
    const sep = calMonth(d, st, TK, '2026-09');
    expect(sep.prev).toBeNull();
    expect(sep.next).toBe('2026-10');
    expect(sep.days.slice(18, 23).map((x) => x.kind)).toEqual(['before', 'none', 'none', 'logged', 'none']);
    expect(calMonth(d, st, TK, '2025-01').ym).toBe('2026-09');
    expect(calMonth(d, st, TK, '2030-01').ym).toBe('2026-10');
  });
  it('a slip is a slip on the gentle count too: it takes that day off', () => {
    let g = addEvent({}, '2026-10-10', 'slipped', '22:00', {}, 1).days;
    g = addEvent(g, '2026-10-11', 'slipped', '22:00', {}, 1).days;
    g = addEvent(g, '2026-10-11', 'slipped', '23:00', {}, 1).days;
    const gm = calMonth(g, { ...st, cleanMode: 'gentle' }, TK);
    expect([gm.days[9].kind, gm.days[10].kind]).toEqual(['slip', 'slip']);
  });
});

describe('one day, at a glance', () => {
  const d = log();
  it('says how it went, what happened, the check-in, and the rest of the day', () => {
    const x = daySummary(d, st, '2026-10-05', TK);
    expect(x.head).toBe('No slip');
    expect(x.rode).toBe(1);
    expect(x.events[0]).toMatchObject({ time: '9:00 PM', what: 'Rode it out', note: 'Walked it off' });
    expect(x.events[0].meta).toMatch(/Bored/);
    expect(x.events[0].sos.join(' ')).toMatch(/Breathe/);
    expect(x.ci).toMatchObject({ m: 6, h: 7.5, so: 'Y', n: 'Good day.' });
    expect(x.more.map((m) => m.t)).toEqual(['Tools: Breathe', 'Read: Urges are waves', 'Held your hard hours', 'Phone away at night']);
    expect(x.pts).toBeGreaterThan(0);
  });
  it('reads a plan made ahead of the hard hours as a plan', () => {
    const k = '2026-10-06';
    const base = blankP();
    const talk = (id: string, pr?: 1) => ({ ...newTalk(1), id, p: 'change' as const, ...(pr ? { pr } : {}) });
    const one = { ...d, [k]: { ...normDay({}, k), p: { ...base, tt: [talk('a', 1)] } } };
    expect(daySummary(one, st, k, TK).more.map((m) => m.t)).toEqual(['Made a plan for the hard hours']);
    const both = { ...d, [k]: { ...normDay({}, k), p: { ...base, tt: [talk('a', 1), talk('b')] } } };
    expect(daySummary(both, st, k, TK).more.map((m) => m.t)).toEqual(['Talked it through first', 'Made a plan for the hard hours']);
  });
  it('is kind about slips, and plain about empty days', () => {
    expect(daySummary(d, st, '2026-10-02', TK).head).toBe('2 slips, logged honestly');
    expect(daySummary(d, st, TK, TK).head).toBe('No slip so far');
    expect(daySummary(d, st, '2026-09-21', TK).head).toBe('Nothing logged');
  });
  it('steps to the day before and after, inside the log', () => {
    expect(calNeighbors(d, st, TK, TK)).toEqual({ prev: '2026-10-17', next: null });
    expect(calNeighbors(d, st, '2026-09-20', TK)).toEqual({ prev: null, next: '2026-09-21' });
  });
});
