/* The fire burns lower when the person stops doing their part (flame-low.ts). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const tk = '2026-10-20';
const now = new Date(2026, 9, 20, 9, 0).getTime();
const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-01', cleanMode: 'gentle' });
/** a lesson finished on each of these days */
const lessons = (keys: string[]): Days => Object.fromEntries(keys.map((k, i) => [k, core.normDay({ p: { ls: ['l' + (i + 1)] } }, k)]));
const opened = (d: Days, keys: string[]): Days => ({ ...d, ...Object.fromEntries(keys.map((k) => [k, core.normDay({ p: { o: true } }, k)])) });

describe('what counts as drifting', () => {
  it('one day with nothing done is a warning; two burn lower, three or more are down to embers', () => {
    const at = (last: string) => core.fireLow(lessons([last]), st, tk, now);
    expect(at('2026-10-19').step).toBe(0);
    expect(at('2026-10-18')).toMatchObject({ step: 0, idle: 1 });
    expect(at('2026-10-17')).toMatchObject({ step: 1, idle: 2, low: core.LOW_OF[1] });
    expect(at('2026-10-16')).toMatchObject({ step: 3, idle: 3, low: 1 });
    expect(at('2026-10-14')).toMatchObject({ step: 3, idle: 5, low: 1 });
    expect(at('2026-10-02')).toMatchObject({ step: 3 });
  });

  it('opening the app is not doing your part', () => {
    const d = opened(lessons(['2026-10-17']), ['2026-10-18', '2026-10-19']);
    expect(core.fireLow(d, st, tk, now).step).toBe(1);
  });

  it('a check-in, an urge ridden out, a tool or a feeling named counts', () => {
    const base = lessons(['2026-10-10']);
    const checkin = { ...base, '2026-10-19': core.normDay({ checkin: { md: 6, u: 3, s: 4, done: true, at: 1 } }, '2026-10-19') };
    expect(core.fireLow(checkin, st, tk, now).step).toBe(0);
    const rode = core.addEvent(base, '2026-10-19', 'rode', '20:00', {}, 1).days;
    expect(core.fireLow(rode, st, tk, now).step).toBe(0);
    const tool = { ...base, '2026-10-19': core.normDay({ p: { tl: ['breathe'] } }, '2026-10-19') };
    expect(core.fireLow(tool, st, tk, now).step).toBe(0);
  });

  it('a slip logged honestly is doing your part, and the fire never dims in the 72 hours after one', () => {
    const slip = core.addEvent(lessons(['2026-10-10']), '2026-10-17', 'slipped', '23:00', {}, 1).days;
    /* the slip's day was a day of honesty: two days since, but inside the 72 hours */
    expect(core.fireLow(slip, st, tk, now)).toMatchObject({ step: 0 });
    /* past the 72 hours, the days after it count */
    expect(core.fireLow(slip, st, tk, new Date(2026, 9, 21, 9, 0).getTime()).step).toBe(1);
  });

  it('today does not count against anyone until it is over, and doing something today lights it again', () => {
    const d = lessons(['2026-10-12']);
    expect(core.fireLow(d, st, tk, now)).toMatchObject({ step: 3, was: 3, warn: false });
    const lit = { ...d, [tk]: core.normDay({ p: { ls: ['l9'] } }, tk) };
    expect(core.fireLow(lit, st, tk, now)).toMatchObject({ step: 0, low: 0, was: 3, warn: false });
  });

  it('a new person is never dimmed for the days before they started', () => {
    const fresh = core.normSettings({ start: '2026-10-19', day1: '2026-10-19' });
    expect(core.fireLow({}, fresh, tk, now).step).toBe(0);
    expect(core.fireLow({}, core.normSettings({ start: tk, day1: tk }), tk, now).step).toBe(0);
  });

  it('only the glow changes: points and level are the same, burning low or not', () => {
    const d = lessons(['2026-10-12']);
    const g = core.gameCompute(d, st, {}, tk);
    expect(core.fireLow(d, st, tk, now).step).toBe(3);
    expect(core.gameCompute(d, st, {}, tk).pts).toBe(g.pts);
  });
});

describe('the words', () => {
  it('are firm and plain, about the next choice', () => {
    expect(core.lowWords({ step: 0, low: 0, idle: 1, was: 0, warn: false })).toBeNull();
    expect(core.lowWords({ step: 1, low: 0.4, idle: 2, was: 1, warn: false })!.h).toBe('You are dimming your fire');
    /* it says why, and what lights it again */
    expect(core.lowWords({ step: 3, low: 1, idle: 6, was: 3, warn: false })!.p).toBe(
      'Because nothing was done for 6 days. Do one thing today, like the lesson below, and it lights again.',
    );
    for (const step of [1, 2, 3] as const) {
      const w = core.lowWords({ step, low: 1, idle: 5, was: step, warn: false })!;
      expect(w.h + w.p).not.toMatch(/n't|addict|failure|weak|lazy/i);
    }
  });

  it('the step open now on Your day says it lights the fire again, and only while it burns low', () => {
    const later = new Date(2026, 9, 20, 11, 0).getTime();
    const open = (d: Days) => core.stopTiles(d, st, tk, later).tiles.find((t) => t.state === 'now' || t.state === 'due');
    expect(open(lessons(['2026-10-12']))!.eyebrow).toBe(core.LOW_LEAD);
    expect(open(lessons(['2026-10-19']))!.eyebrow).not.toBe(core.LOW_LEAD);
  });
  it('the next step says it lights the fire again', () => {
    const d = lessons(['2026-10-12']);
    const s = { ...st, onboarded: true } as typeof st;
    const card = core.pickMoment(d, s, {}, tk, now).card;
    if (card.btn && card.k !== 'pause') expect(card.eb).toBe(core.LOW_LEAD);
  });
});

describe('the colors of a fire burning low', () => {
  it('leave a fire burning fully as it is and drain every color toward ash', () => {
    expect(core.lowHex('#FFEA55', 0)).toBe('#FFEA55');
    expect(core.lowHex('#FFEA55', 1)).toBe('#7C685C');
    expect(core.lowXml('<stop stop-color="#FFF"/><path fill="white"/>', 1)).toBe('<stop stop-color="#8F7D78"/><path fill="#8F7D78"/>');
    expect(core.lowMatrix(0)).toEqual([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
  });

  it('a fire burning low pulls its tips back toward its body, and holds the rest', () => {
    const f = core.fireOf(25);
    const op = f.ops.find((o) => o.move && !o.side)!;
    const full = core.fireMove(op, 3, 1, 0);
    const low = core.fireMove(op, 3, 1, 1);
    const tipFull = Math.min(...full.filter((_, i) => i % 2));
    const tipLow = Math.min(...low.filter((_, i) => i % 2));
    expect(tipLow).toBeGreaterThan(tipFull + 3);
    op.move!.forEach((w, j) => {
      if (j % 4 === 0 && w === 0) expect(low[j / 2 + 1]).toBe(op.pts[j / 2 + 1]);
    });
    expect(f.tip.y).toBeLessThan(f.heart.y);
  });

  it('smoke shows only while it burns low, and sputters never put it out', () => {
    for (let t = 0; t < 20; t += 0.3) {
      expect(core.smokeAt(0, t, 0, 60, 30, 1)[3]).toBe(0);
      expect(core.sputterAt(t, 1)).toBeGreaterThanOrEqual(0.15);
      expect(core.sputterAt(t, 0)).toBe(1);
    }
    expect(Math.max(...[0.5, 1, 1.5, 2].map((t) => core.smokeAt(0, t, 1, 60, 30, 1)[3]))).toBeGreaterThan(0.1);
  });
});

describe('the face of a fire burning low', () => {
  it('is sad in every form: the smile turns down and the brows lift in the middle', () => {
    let seen = 0;
    for (const level of [1, 5, 10, 19, 30, 45]) {
      const l = core.emblemLayers(level, true);
      if (!l) continue;
      const xml = l.still + l.fig;
      if (!xml.includes('M-6.5 101Q0 107.5 6.5 101')) continue;
      seen++;
      const sad = core.sadXml(xml);
      expect(sad).not.toContain('M-6.5 101Q0 107.5 6.5 101');
      expect(sad).toContain('M-6.5 105Q0 99 6.5 105');
    }
    expect(seen).toBeGreaterThan(3);
  });
});
