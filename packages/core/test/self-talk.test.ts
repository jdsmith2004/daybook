/* Self Talk, the SOS move of November 15, 2026: the lines it says, and its place in the ride (last, by the owner's choice). */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Settings } from '../src/types';

const tk = '2026-11-15';
const withA = (a: Record<string, unknown>): Settings => core.normSettings({ onb: { a } } as unknown as Partial<Settings>);
const plain = core.normSettings({});
const faith = withA({ faith: 'big' });
/** a fixed run of random numbers */
const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe('Self Talk in the ride', () => {
  const now = new Date('2026-11-15T15:00:00').getTime();
  const ride = (n: number, can: core.RideCan, mem: core.UrMem = {}) => {
    const sc = core.newUrge(now, 0);
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(core.rideNext(sc, {}, plain, tk, now, mem, can, out));
    return out;
  };
  it('Self Talk comes last of all the moves to start with, and still comes', () => {
    const r = ride(24, { words: true });
    expect(r).toContain('selftalk');
    const first = (id: string) => r.indexOf(id);
    core.RIDE_MOVES.filter((id) => id !== 'selftalk').forEach((id) => expect(first(id)).toBeLessThan(first('selftalk')));
  });
  it('passed over often, Self Talk comes later and still comes', () => {
    let m: core.UrMem = {};
    for (let i = 0; i < 3; i++) m = core.ridePassed(core.rideFade(m), 'selftalk', 1000);
    expect(core.rideOften(m, 'selftalk')).toBe(true);
    expect(ride(30, { words: true }, m)).toContain('selftalk');
  });
  it('has a line on why it works, and a lesson', () => {
    const s = core.rideScience('selftalk');
    expect(s!.t).toBeTruthy();
    expect(s!.lesson).toBeTruthy();
  });
});

describe('Self Talk', () => {
  it('says three lines: the proof, who you are becoming, the next step', () => {
    const l = core.selfTalk(plain, null, 0, seq(0.1, 0.9, 0.3, 0.6));
    expect(l).toHaveLength(3);
    l.forEach((x) => expect(x).toMatch(/^[A-Z]/));
  });

  it('speaks to the person by name when Daybook has it, and as "you" when it does not', () => {
    core.selfTalk(plain, 'jeff', 0, seq(0.2)).forEach((x) => expect(x.startsWith('Jeff, ')).toBe(true));
    core.selfTalk(plain, null, 0, seq(0.2)).forEach((x) => expect(x).not.toMatch(/,\s*you\b.*,\s*you\b/));
    expect(core.selfTalkAll(plain, null, 5).some((x) => x.startsWith('You '))).toBe(true);
    expect(core.selfTalkAll(plain, 'Jeff', 5).find((x) => /proud/.test(x))).toBe('Jeff, I am proud of you for stopping to do this. Keep going.');
    expect(core.selfTalkAll(plain, null, 5).find((x) => /proud/.test(x))).toBe('I am proud of you for stopping to do this. Keep going.');
  });

  it('takes only a real first name', () => {
    expect(core.talkName('  maría  lopez')).toBe('María');
    expect(core.talkName('Anne-Marie')).toBe('Anne-Marie');
    expect(core.talkName('')).toBeNull();
    expect(core.talkName('123')).toBeNull();
    expect(core.talkName('<b>')).toBeNull();
    expect(core.talkName(42)).toBeNull();
  });

  it('uses the person’s own count once there are two urges ridden out', () => {
    expect(core.selfTalkAll(plain, null, 7).join(' ')).toMatch(/ridden out 7 urges already/);
    for (let i = 0; i < 20; i++) expect(core.selfTalk(plain, null, 1, Math.random)[0]).not.toMatch(/ridden out 1 urges/);
  });

  it('names the habit in its own words, and porn only for porn', () => {
    expect(core.selfTalkAll(plain, null, 0).join(' ')).toMatch(/do not need porn/);
    expect(core.selfTalkAll(withA({ habit: 'alcohol' }), null, 0).join(' ')).toMatch(/do not need a drink/);
    expect(core.selfTalkAll(withA({ habit: 'gambling' }), null, 0).join(' ')).toMatch(/do not need a bet/);
    ['alcohol', 'gambling', 'other'].forEach((habit) => expect(core.selfTalkAll(withA({ habit }), null, 0).join(' ')).not.toMatch(/porn/i));
  });

  it('speaks of God only with faith on', () => {
    expect(core.selfTalkAll(plain, null, 0).join(' ')).not.toMatch(/God/);
    expect(core.selfTalkAll(faith, null, 0).join(' ')).toMatch(/God/);
    for (let i = 0; i < 30; i++) expect(core.selfTalk(plain, null, 3, Math.random).join(' ')).not.toMatch(/God/);
  });

  it('keeps the words rules: no contractions, no shame words', () => {
    const all = [...core.selfTalkAll(faith, 'Sam', 9), ...core.selfTalkAll(withA({ habit: 'gambling' }), null, 0)];
    all.forEach((x) => {
      expect(x).not.toMatch(/\b\w+['’](t|s|re|ve|ll|d|m)\b/i);
      expect(x).not.toMatch(/\b(addict|weak|failure|ashamed|dirty|should)\b/i);
    });
  });
});
