/* The Settings changes: the usual routine, screens-off, a new day, SOS's first tool, celebrations, and the therapist fit check.
   Each follows the legacy handler (rt-set, data-set, data-urpin, celebrate, thr, data-tname). */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const st0 = () => core.normSettings({ v: 1, start: '2026-09-01', day1: '2026-09-08', rollover: 4, screensOff: '23:00', u: 1 });

describe('settings changes', () => {
  it('turns one part of the routine on or off, and ignores a name it does not know', () => {
    const st = st0();
    const k = core.ROUTINE_KEYS[0];
    const off = core.setRoutine(st, k, false);
    expect(off.routine[k]).toBe(false);
    expect(core.setRoutine(off, k, true).routine[k]).toBe(true);
    expect(core.setRoutine(st, 'nope', true)).toBe(st);
  });
  it('moves screens-off around the clock and ignores what is not a time', () => {
    expect(core.stepClock('23:45', 15)).toBe('00:00');
    expect(core.stepClock('00:00', -15)).toBe('23:45');
    const st = st0();
    expect(core.setScreensOffTime(st, '22:30').screensOff).toBe('22:30');
    expect(core.setScreensOffTime(st, '25:99')).toBe(st);
  });
  it('sets the hour a new day starts', () => {
    expect(core.setRollover(st0(), 0).rollover).toBe(0);
  });
  it('pins a tool SOS knows, and nothing else', () => {
    const id = core.TOOLS[0].id;
    expect(core.setUrPin(st0(), id).urPin).toBe(id);
    expect(core.setUrPin(st0(), 'made-up').urPin).toBe(null);
    expect(core.setUrPin(st0(), null).urPin).toBe(null);
  });
  it('turns celebrations off and on', () => {
    expect(core.setCelebrate(st0(), false).celebrate).toBe(false);
  });
  it('names a therapist and ticks one check', () => {
    let st = core.setTherapistName(st0(), 1, 'Dr. A');
    expect(st.therapist.names[1]).toBe('Dr. A');
    st = core.toggleTherapist(st, 2, 1);
    expect(st.therapist.checks[2][1]).toBe(true);
    expect(core.toggleTherapist(st, 2, 1).therapist.checks[2][1]).toBe(false);
  });
});

it('a plan saved with the old starting words ("I\'m", "what\'s") still reads as the starting plan', () => {
  const plan = core.normSettings({}).plan.map((r) => ({ ...r }));
  plan[0].when = "I'm in bed late at night";
  plan[3] = { when: "I'm stressed or anxious", then: "Move my body (walk, pushups), then write one sentence about what's stressing me." };
  plan[1] = { when: "I'm lonely and I wrote this", then: 'My own move' };
  const st = core.normSettings({ ...st0(), plan });
  expect(st.plan[0].when).toBe('I am in bed late at night');
  expect(st.plan[3]).toEqual(core.normSettings({}).plan[3]);
  expect(st.plan[1]).toEqual({ when: "I'm lonely and I wrote this", then: 'My own move' });
});
