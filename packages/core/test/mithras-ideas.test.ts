/* Three ideas from Mithras: my line (the person's own rule for what counts, shown where a slip is logged), the feelings
   before a slip against days it held (Pattern), and "If the urge were a thing" in SOS (once a ride, never in practice). */
import { describe, expect, it } from 'vitest';
import { addDays, normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { FEEL_SLIP_MIN, patFeelSlip } from '../src/pattern-cards';
import { MY_LINE_LEN, myLineOf, playbookText, setMyLine } from '../src/plan';
import { OBJECT_PASS_MAX, RIDE_FIRST, RIDE_OBJECT, rideNext, URGE_OBJECTS } from '../src/ride';
import { normSettingsLoaded } from '../src/settings-norm';
import { newUrge } from '../src/sos';
import { evProps } from '../src/events';
import type { DayKey, Days } from '../src/types';

const TK = '2026-11-01';
const st = normSettings({ start: '2026-01-01', day1: '2026-01-01' });

describe('my line', () => {
  it('is saved trimmed, kept short, and read back', () => {
    expect(myLineOf(st)).toBe('');
    const a = setMyLine(st, '  A slip is watching it on purpose.  ');
    expect(myLineOf(a)).toBe('A slip is watching it on purpose.');
    expect(myLineOf(setMyLine(st, 'x'.repeat(500))).length).toBe(MY_LINE_LEN);
  });
  it('loads from storage or sync as a string, or not at all', () => {
    expect(normSettingsLoaded({ ...st, myLine: ' Mine ' }).myLine).toBe('Mine');
    expect('myLine' in normSettingsLoaded({ ...st, myLine: 42 })).toBe(false);
    expect('myLine' in normSettingsLoaded({ ...st, myLine: '   ' })).toBe(false);
    expect('myLine' in normSettingsLoaded(st)).toBe(false);
  });
  it('is in the playbook text', () => {
    const t = playbookText(setMyLine(st, 'Mine.'), new Set(), [], () => 0, []);
    expect(t).toContain('My line\nMine.');
  });
});

const blank = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} };
const at = (k: DayKey, hh: number) => new Date(k + 'T' + String(hh).padStart(2, '0') + ':00:00').getTime();
/** feelings named on a day, at the given hours */
const named = (d: Days, k: DayKey, list: [string, number][]): Days => ({
  ...d,
  [k]: { ...(d[k] || { events: [] }), p: { ...blank, fe: list.map(([w, h]) => [w, at(k, h)] as [string, number]) } } as Days[string],
});
const base = (): Days => ({ '2026-01-01': { events: [], u: 1 } as unknown as Days[string] });

describe('the feelings before a slip', () => {
  /* five slip days: lonely and tired at 20:00, a slip at 22:00, then ashamed at 23:00 (after, so not counted) */
  const build = (heldDays = 6) => {
    let d = base();
    for (let i = 1; i <= 5; i++) {
      const k = addDays(TK, -i * 3);
      d = named(d, k, [
        [i % 2 ? 'Lonely' : 'Tired', 20],
        ['Lonely', 21],
        ['Ashamed', 23],
      ]);
      d = addEvent(d, k, 'slipped', '22:00', { trigger: null }, 1).days;
    }
    for (let i = 1; i <= heldDays; i++) d = named(d, addDays(TK, -i * 3 - 1), [['Calm', 12]]);
    return d;
  };
  it('names what comes before a slip and what is felt on days it held', () => {
    const f = patFeelSlip(undefined, build(), TK)!;
    expect(f.slipN).toBe(10);
    expect(f.before.map((x) => x.w)).toEqual(['Lonely', 'Tired']);
    expect(f.before.some((x) => x.w === 'Ashamed')).toBe(false);
    expect(f.held).toEqual(['Calm']);
    expect(f.line).toBe('Before a slip, you most often felt lonely and tired. On days it held: calm. Those are the ones to watch for.');
  });
  it('waits for enough on each side', () => {
    expect(patFeelSlip(undefined, build(FEEL_SLIP_MIN - 1), TK)).toBeNull();
    expect(patFeelSlip(undefined, base(), TK)).toBeNull();
  });
  it('counts the slip’s own feeling before it', () => {
    let d = base();
    for (let i = 1; i <= 5; i++) d = addEvent(d, addDays(TK, -i * 2), 'slipped', '22:00', { trigger: null, fb: 'Bored' }, 1).days;
    for (let i = 1; i <= 5; i++) d = named(d, addDays(TK, -i * 2 - 1), [['Calm', 12]]);
    expect(patFeelSlip(undefined, d, TK)!.before[0]).toMatchObject({ w: 'Bored', slip: 5, held: 0 });
  });
});

describe('If the urge were a thing', () => {
  const mem = {};
  const ur = newUrge(Date.now(), 0);
  const can = { words: false, object: true };
  it('comes once, after the first move that follows the breath', () => {
    expect(rideNext(ur, {}, st, TK, Date.now(), mem, can, [])).toBe(RIDE_FIRST);
    const two = rideNext(ur, {}, st, TK, Date.now(), mem, can, ['breathe']);
    expect(two).not.toBe(RIDE_OBJECT);
    expect(rideNext(ur, {}, st, TK, Date.now(), mem, can, ['breathe', two])).toBe(RIDE_OBJECT);
    expect(rideNext(ur, {}, st, TK, Date.now(), mem, can, ['breathe', two, RIDE_OBJECT, 'stack'])).not.toBe(RIDE_OBJECT);
  });
  it('never in a practice ride, and not once passed over enough', () => {
    expect(rideNext(ur, {}, st, TK, Date.now(), mem, { words: false }, ['breathe', 'move'])).not.toBe(RIDE_OBJECT);
    expect(rideNext(ur, {}, st, TK, Date.now(), { pass: { object: OBJECT_PASS_MAX } }, can, ['breathe', 'move'])).not.toBe(RIDE_OBJECT);
  });
  it('is only things to tap, and its event value is on the list', () => {
    expect(URGE_OBJECTS.length).toBeGreaterThanOrEqual(4);
    expect(URGE_OBJECTS.map((x) => x[1])).toContain('A tight knot');
    expect(evProps({ tool: 'object' }).tool).toBe('object');
  });
});
