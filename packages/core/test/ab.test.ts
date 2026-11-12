/* Word tests (ab.ts): each phone always gets the same arm from its install id, about half get each, a phone with no id sees
   the old wording, and the new events and values are on the list. */
import { describe, expect, it } from 'vitest';
import { AB_ARMS, AB_TEST_IDS, abArm, rkFirstInTest, rkFirstLine } from '../src/ab';
import { EV_NAMES, evProps } from '../src/events';
import { nudgeAt, nudgeDue, nudgeLogNew } from '../src/nudges';
import { defaultSettings } from '../src/legacy/core.js';

const hex = (i: number) => (i.toString(16).padStart(8, '0') + 'a1b2c3d4e5f60718293a4b5c').slice(0, 32);

describe('the arm', () => {
  it('is the same every time for the same id', () => {
    const id = '0123456789abcdef0123456789abcdef';
    expect(abArm(id, 'rk_first')).toBe(abArm(id, 'rk_first'));
    expect(AB_ARMS).toContain(abArm(id, 'rk_first'));
  });

  it('splits phones about evenly', () => {
    let b = 0;
    for (let i = 0; i < 4000; i++) if (abArm(hex(i * 7919), 'rk_first') === 'b') b++;
    expect(b / 4000).toBeGreaterThan(0.45);
    expect(b / 4000).toBeLessThan(0.55);
  });

  it('is null with no real install id', () => {
    expect(abArm(null, 'rk_first')).toBeNull();
    expect(abArm('', 'rk_first')).toBeNull();
    expect(abArm('0'.repeat(32), 'rk_first')).toBeNull();
    expect(abArm('not-an-id', 'rk_first')).toBeNull();
  });
});

describe("Rekindle's first line", () => {
  const OLD = 'Your fire did not go out.';
  it('keeps the old line for arm a, no id, or no urge ridden out yet', () => {
    expect(rkFirstLine('a', 5)).toBe(OLD);
    expect(rkFirstLine(null, 5)).toBe(OLD);
    expect(rkFirstLine('b', 0)).toBe(OLD);
    expect(rkFirstInTest(0)).toBe(false);
  });

  it('names the person as unchanged in arm b, with their own count', () => {
    expect(rkFirstLine('b', 4)).toBe('One slip. You are still someone who rides out urges: 4 times.');
    expect(rkFirstLine('b', 1)).toBe('One slip. You are still someone who has ridden out an urge.');
    expect(rkFirstInTest(1)).toBe(true);
  });

  it('speaks without contractions or shame words', () => {
    for (const n of [0, 1, 2, 30]) for (const a of [null, ...AB_ARMS]) expect(rkFirstLine(a, n)).not.toMatch(/'|clean|addict|relapse|fail/i);
  });
});

describe('what is sent', () => {
  it('has the word test event, and takes only its tests and arms', () => {
    expect(EV_NAMES.ab).toBeTruthy();
    expect(EV_NAMES.comeback).toBeTruthy();
    expect(evProps({ test: AB_TEST_IDS[0], arm: 'b' })).toEqual({ test: 'rk_first', arm: 'b' });
    expect(evProps({ test: 'anything', arm: 'z' })).toEqual({});
  });

  it('takes the hour a reminder came, and a reminder kind before a slip, never a time', () => {
    expect(evProps({ nh: 23.4, after: 'lesson' })).toEqual({ nh: 23, after: 'lesson' });
    expect(evProps({ nh: 99, after: 'typed words' })).toEqual({ nh: 23 });
  });
});

describe('notes delivered since the last open (nudgeDue)', () => {
  const st = defaultSettings('2026-09-01');
  const log = {
    ...nudgeLogNew(),
    plan: [
      { id: 'lesson-1', k: 'lesson' as const, d: '2026-10-14', at: 1000 },
      { id: 'checkin-1', k: 'checkin' as const, d: '2026-10-14', at: 5000 },
    ],
  };
  it('lists the ones whose time has come, with when', () => {
    expect(nudgeDue(log, st, 2000, true)).toEqual([{ id: 'lesson-1', k: 'lesson', at: 1000 }]);
    expect(nudgeDue(log, st, 2000, false)).toEqual([]);
    expect(nudgeDue(log, null, 2000, true)).toEqual([]);
  });
  it('finds when a tapped note came while the log holds it', () => {
    expect(nudgeAt(log, 'checkin-1')).toBe(5000);
    expect(nudgeAt(log, 'gone')).toBeNull();
  });
});
