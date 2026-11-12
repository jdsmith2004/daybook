/* Proof where it counts: the hero's proof line, the line over an SOS's first breath, and the headline after a ride. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Outcome, Settings } from '../src/types';

const st: Settings = { ...core.normSettings({}), start: '2026-10-01', day1: '2026-10-01' };
const tk = '2026-10-21';

function log(list: [string, Outcome, string | null][]): { days: Days; ids: string[] } {
  let days: Days = {};
  const ids: string[] = [];
  list.forEach(([k, o, t], i) => {
    const r = core.addEvent(days, k, o, t, { id: 'e' + i });
    days = r.days;
    ids.push(r.id);
  });
  return { days, ids };
}

describe('heroProof', () => {
  it('is null with nothing on the record', () => {
    expect(core.heroProof({}, { ...st, day1: tk }, {}, tk)).toBeNull();
  });
  it('names urges ridden out, never a slip', () => {
    const { days } = log([
      ['2026-10-19', 'rode', '21:00'],
      ['2026-10-20', 'rode', '21:30'],
      ['2026-10-20', 'slipped', '23:00'],
    ]);
    const all = core.heroProofs(days, st, {}, tk);
    expect(all).toContain('2 urges ridden out');
    all.forEach((l) => expect(l).not.toMatch(/slip|longest|run/i));
  });
  it('turns over day by day, and holds within a day', () => {
    const { days } = log([
      ['2026-10-15', 'rode', '21:00'],
      ['2026-10-16', 'rode', '21:00'],
    ]);
    const n = core.heroProofs(days, st, {}, tk).length;
    expect(n).toBeGreaterThan(1);
    const seen = new Set([0, 1, 2, 3, 4, 5].map((i) => core.heroProof(days, st, {}, core.addDays(tk, i))));
    expect(seen.size).toBeGreaterThan(1);
    expect(core.heroProof(days, st, {}, tk)).toBe(core.heroProof(days, st, {}, tk));
  });
});

describe('sosProof', () => {
  it('shows nothing before the first urge ridden out', () => {
    const { days } = log([['2026-10-20', 'slipped', '22:00']]);
    expect(core.sosProof(days, tk)).toBeNull();
  });
  it('says how many, never days or slips', () => {
    expect(core.sosProof(log([['2026-10-20', 'rode', '22:00']]).days, tk)).toBe('You have ridden this out before.');
    const { days } = log([
      ['2026-10-18', 'rode', '22:00'],
      ['2026-10-19', 'slipped', '22:00'],
      ['2026-10-20', 'rode', '22:00'],
      ['2026-10-21', 'rode', '09:00'],
    ]);
    expect(core.sosProof(days, tk)).toBe('You have ridden this out 3 times.');
  });
});

describe('rodeHeadline', () => {
  it('the first ever', () => {
    const { days, ids } = log([['2026-10-21', 'rode', '21:00']]);
    expect(core.rodeHeadline(days, st, tk, ids[0])).toEqual({ kind: 'first', h: 'You rode it out. Now you know you can.' });
  });
  it('in the days after a slip, a comeback', () => {
    const { days, ids } = log([
      ['2026-10-10', 'rode', '12:00'],
      ['2026-10-19', 'slipped', '22:00'],
      ['2026-10-21', 'rode', '21:00'],
    ]);
    expect(core.rodeHeadline(days, st, tk, ids[2]).h).toBe('Two days after a slip, and you rode it out. That is a comeback.');
  });
  it('hours after a slip the same day, but not a slip that came after it', () => {
    const a = log([
      ['2026-10-10', 'rode', '12:00'],
      ['2026-10-21', 'slipped', '09:00'],
      ['2026-10-21', 'rode', '21:00'],
    ]);
    expect(core.rodeHeadline(a.days, st, tk, a.ids[2]).h).toMatch(/^Hours after a slip/);
    const b = log([
      ['2026-10-10', 'rode', '12:00'],
      ['2026-10-21', 'slipped', '23:00'],
      ['2026-10-21', 'rode', '21:00'],
    ]);
    expect(core.rodeHeadline(b.days, st, tk, b.ids[2]).kind).not.toBe('comeback');
  });
  it('a slip more than three days back is not a comeback', () => {
    const { days, ids } = log([
      ['2026-10-10', 'rode', '12:00'],
      ['2026-10-17', 'slipped', '22:00'],
      ['2026-10-21', 'rode', '21:00'],
    ]);
    expect(core.rodeHeadline(days, st, tk, ids[2]).kind).toBe('plain');
  });
  it('the fifth', () => {
    const { days, ids } = log([1, 2, 3, 4, 5].map((i) => ['2026-10-1' + i, 'rode', '1' + i + ':00'] as [string, Outcome, string]));
    expect(core.rodeHeadline(days, st, '2026-10-15', ids[4]).h).toBe('Five ridden out. This is who you are now.');
  });
  it('inside the usual hardest hours', () => {
    const list: [string, Outcome, string | null][] = [];
    for (let i = 1; i <= 9; i++) list.push(['2026-10-0' + i, 'rode', '22:15']);
    list.push(['2026-10-20', 'rode', '22:30']);
    list.push(['2026-10-21', 'rode', '22:40']);
    const { days, ids } = log(list);
    const w = core.riskWindow(days, st, tk);
    expect(w).not.toBeNull();
    expect(core.rodeHeadline(days, st, tk, ids[ids.length - 1])).toEqual({ kind: 'hard', h: 'In your hardest hours, you rode it out.' });
  });
});

describe('careLastAt', () => {
  it('is the later of an SOS and a talk or a walk', () => {
    expect(core.careLastAt({})).toBeNull();
    expect(core.careLastAt({ sosAt: 5 })).toBe(5);
    expect(core.careLastAt({ sosAt: 5, careAt: 9 })).toBe(9);
  });
  it('holds the tip card for the quiet hours after Talk it through', () => {
    const now = new Date('2026-10-21T14:00:00').getTime();
    const near = { now, sos: core.careLastAt({ careAt: now - 3600e3 }) };
    expect(core.tipQuiet({}, st, near)).toBe(true);
  });
});
