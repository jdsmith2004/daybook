/* WP4 (November 12, 2026): two phones on one day keep both play records, and "Use my account's log here" keeps what this
   phone earned. */
import { describe, expect, it } from 'vitest';
import * as core from '../src';
import type { Day, Play, Settings } from '../src/types';

const play = (o: Partial<Play>): Play => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {}, ...o });
const day = (p: Play | null, u: number, checkin: Day['checkin'] = null): Day => ({ d: '2026-10-10', events: [], checkin, p, u });
const ci = (o: Partial<NonNullable<Day['checkin']>>): NonNullable<Day['checkin']> => ({
  m: null,
  c: null,
  e: null,
  s: null,
  h: null,
  so: null,
  ro: null,
  n: '',
  done: false,
  at: 0,
  ...o,
});

describe('mergeDay joins the play record field by field', () => {
  it('keeps a lesson, a tool, ticks and talks from each phone', () => {
    const a = day(play({ ls: ['l1'], tl: ['breathe'], w: [0], c: 2, fe: [['Tired', 5]] }), 100);
    const b = day(play({ ls: ['l2'], tl: ['move'], w: [2], c: 1, r: true, po: '22:00', fe: [['Calm', 9]] }), 200);
    const j = core.mergeDay(a, b)!;
    expect([...j.p!.ls].sort()).toEqual(['l1', 'l2']);
    expect([...j.p!.tl].sort()).toEqual(['breathe', 'move']);
    expect(j.p!.w).toEqual([0, 2]);
    expect(j.p!.c).toBe(2);
    expect(j.p!.r).toBe(true);
    expect(j.p!.po).toBe('22:00');
    expect(j.p!.fe).toEqual([
      ['Tired', 5],
      ['Calm', 9],
    ]);
    expect(core.mergeDay(b, a)!.p).toEqual(j.p);
  });
  it('the morning set and the day feel come from the later answer, whichever copy is newer', () => {
    const a = day(play({ ms: { at: 900, f: 3 }, df: [4, 900] }), 100);
    const b = day(play({ ms: { at: 500, f: 1 }, df: [2, 500] }), 200);
    const j = core.mergeDay(a, b)!;
    expect(j.p!.ms).toEqual({ at: 900, f: 3 });
    expect(j.p!.df).toEqual([4, 900]);
  });
  it('keeps the check-in answered on either phone', () => {
    const a = day(null, 100, ci({ md: 7, at: 100, done: true }));
    const b = day(null, 200, ci({ s: 3, at: 200 }));
    const j = core.mergeDay(a, b)!;
    expect(j.checkin).toMatchObject({ md: 7, s: 3, done: true });
  });
});

describe('accountHere keeps what this phone earned on the account’s settings', () => {
  const st = (o: Partial<Settings>, u: number): Settings =>
    ({ ...core.normSettings({ start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00' }), ...o, u }) as Settings;
  it('graduation, badges, points, lessons practiced, the count day and set-once marks stay', () => {
    const theirs = st({ goal: 'Theirs', countFrom: '2026-10-20' }, 100);
    const mine = st(
      {
        goal: 'Mine',
        gradAt: '2026-11-01',
        countFrom: '2026-10-05',
        widget: '2026-10-09',
        seen: { badges: ['b1'], quests: [], level: 4, full: null, lad: core.LADDER_V, pts: 120 },
        learn: { ...core.normSettings({}).learn, prac: { l3: 1 } },
      },
      300,
    );
    const out = core.accountHere(theirs, mine)!;
    expect(out.goal).toBe('Theirs');
    expect(out.gradAt).toBe('2026-11-01');
    expect(out.countFrom).toBe('2026-10-05');
    expect(out.widget).toBe('2026-10-09');
    expect(out.seen).toMatchObject({ badges: ['b1'], level: 4, pts: 120 });
    expect(out.learn.prac.l3).toBe(1);
    expect(out.u).toBe(301);
  });
  it('gives back null when there is nothing to keep', () => {
    const theirs = st({ goal: 'Theirs' }, 100);
    expect(core.accountHere(theirs, st({ goal: 'Mine' }, 50))).toBeNull();
    expect(core.accountHere(theirs, null)).toBeNull();
  });
});
