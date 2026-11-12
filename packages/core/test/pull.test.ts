/* The app that pulls you in (Screen Time): the saved choices, the hard hours as Apple schedules, the quiet after a slip, the
   words, and which note goes for which threshold. */
import { describe, expect, it } from 'vitest';
import { addEvent } from '../src/mutate';
import { defaultSettings } from '../src/legacy/core.js';
import {
  normPull,
  PULL_DEFAULTS,
  pullBridge,
  pullDownEvent,
  pullDrift,
  pullLine,
  pullNoteFor,
  pullCounts,
  pullDownsFill,
  pullNudges,
  PULL_COUNT_GAP,
  pullPauseWords,
  pullPlanLine,
  pullQuietUntil,
  pullShield,
  pullWindows,
} from '../src/pull';
import { lowWords, partDone } from '../src/flame-low';
import type { Days, Settings } from '../src/types';

const st = { ...defaultSettings('2026-10-01'), rollover: 4 } as Settings;
const at = (s: string) => new Date(s).getTime();
const slip = (days: Days, k: string, time: string) => addEvent(days, k, 'slipped', time, {}, 1).days;
/* five weekday slips late at night: the hard hours are 11 PM to 1 AM on weekdays (2026-10-12 is a Monday) */
const late = () => {
  let d: Days = {};
  for (const k of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']) d = slip(d, k, '23:20');
  return d;
};

describe('the choices', () => {
  it('reads anything safely, and the pause is never on by default', () => {
    expect(normPull(null)).toEqual(PULL_DEFAULTS);
    expect(normPull({ on: true, long: 7, wait: 30, open: 4, pause: 'yes', asked: 'x' })).toEqual({ ...PULL_DEFAULTS, on: true, wait: 30 });
    expect(PULL_DEFAULTS.pause).toBe(false);
  });
});

describe('the line in Settings', () => {
  it('says what it does now, plainly', () => {
    expect(pullLine(PULL_DEFAULTS)).toBe('Off · a note when an app has you too long');
    expect(pullLine({ ...PULL_DEFAULTS, on: true })).toBe('A note after 2 hours · notes in hard hours');
    expect(pullLine({ ...PULL_DEFAULTS, on: true, long: 1, pause: true })).toBe('A note after 1 hour · a pause in hard hours');
    expect(pullLine({ ...PULL_DEFAULTS, on: true, long: 0, hard: true })).toBe('Notes in hard hours');
    expect(pullLine({ ...PULL_DEFAULTS, on: true, long: 0, hard: false })).toBe('On · every note off');
  });
});

describe('the hard hours as schedules', () => {
  it('is empty until the log finds them', () => {
    expect(pullWindows({}, st, '2026-10-12')).toEqual([]);
  });
  it('gives each weekday its window, with when the pause ends', () => {
    const w = pullWindows(late(), st, '2026-10-12');
    /* weekends fall back to all days, so every day has one */
    expect(w.map((x) => x.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(w[1]).toEqual({ weekday: 2, start: 23, until: '1 AM' });
  });
  it('puts a window after midnight on the next calendar day', () => {
    let d: Days = {};
    for (const k of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']) d = slip(d, k, '01:10');
    /* each log day's 1 AM is the next calendar morning, so Saturday's is Sunday's (weekday 1) */
    const w = pullWindows(d, st, '2026-10-12');
    expect(w.map((x) => x.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(w.every((x) => x.start === 1 && x.until === '3 AM')).toBe(true);
  });
});

describe('the quiet after a slip', () => {
  it('runs to the first 8 AM at least three hours later', () => {
    const d = slip({}, '2026-10-12', '23:30');
    expect(pullQuietUntil(d, st, at('2026-10-12T23:40'))).toBe(at('2026-10-13T08:00'));
    expect(pullQuietUntil(d, st, at('2026-10-13T08:01'))).toBeNull();
  });
  it('after a morning slip, holds through the night', () => {
    const d = slip({}, '2026-10-12', '07:00');
    expect(pullQuietUntil(d, st, at('2026-10-12T22:00'))).toBe(at('2026-10-13T08:00'));
  });
  it('is none with no slip', () => {
    expect(pullQuietUntil({}, st, at('2026-10-12T22:00'))).toBeNull();
  });
});

describe('the words', () => {
  const all = () => {
    const n = pullNudges({ lessonUrl: '/lesson/l4', long: 2 });
    const p = [true, false].map((quiet) => pullPauseWords({ quiet, open: 3, plan: null }));
    const s = [true, false].map((quiet) => pullShield({ until: '1 AM', plan: null, quiet }));
    return [...Object.values(n).flatMap((x) => [x.t, x.b, x.bDowns ?? '']), ...p.flatMap((x) => Object.values(x)), ...s.flatMap((x) => Object.values(x))];
  };
  it('has no contractions, and never names the habit or an app on a locked screen', () => {
    for (const w of all()) {
      expect(w).not.toMatch(/\b\w+'(t|s|re|ll|ve|m|d)\b/);
      expect(w).not.toMatch(/porn|instagram|tiktok|addict/i);
    }
  });
  it('carries the stakes, except in the quiet after a slip', () => {
    const n = pullNudges({ lessonUrl: '/', long: 2 });
    expect(n.hard1.b).toMatch(/dimming your fire/);
    expect(n.long.b).toMatch(/dimming your fire/);
    expect(n.quiet.b).not.toMatch(/dimming|choice/);
    expect(pullPauseWords({ quiet: true, open: 3, plan: null }).line).not.toMatch(/fire|choice/);
  });
  it('says the put-downs as the next choice, never as who the person is', () => {
    const n = pullNudges({ lessonUrl: '/', long: 2 });
    expect(n.hard1.b).not.toMatch(/gets you/);
    expect(pullDownsFill(n.hard1.bDowns!, 6)).toBe(
      'You have put it down 6 times. You are dimming your fire now. Make it 7: stand up and walk to another room.',
    );
    expect(pullDownsFill(pullShield({ until: '1 AM', plan: null, quiet: false }).subDowns, 1)).toBe('You have put it down once. Close it, and that makes 2.');
    expect(pullPauseWords({ quiet: false, open: 3, plan: null, downs: 7 }).thanks).toBe('That makes 7. One more win in your log.');
    expect(pullPauseWords({ quiet: true, open: 3, plan: null, downs: 7 }).thanks).not.toMatch(/7/);
  });
  it('counts a put-down at most once in ten minutes', () => {
    const t = at('2026-10-12T22:00');
    expect(pullCounts(0, t)).toBe(true);
    expect(pullCounts(t, t + 9 * 60000)).toBe(false);
    expect(pullCounts(t, t + PULL_COUNT_GAP * 60000)).toBe(true);
  });
  it('counts the hours and the minutes it says', () => {
    expect(pullNudges({ lessonUrl: '/', long: 1 }).long.t).toBe('🔥 An hour in');
    expect(pullNudges({ lessonUrl: '/', long: 3 }).hard2Pause.b).toMatch(/In 10 minutes/);
    expect(pullPauseWords({ quiet: false, open: 5, plan: null }).open).toBe('Open it for 5 minutes');
  });
  it('quotes the person own plan', () => {
    const s = { ...st, plan: [{ when: 'I catch myself scrolling with no plan', then: 'Put the phone down and stand up.' }] } as Settings;
    expect(pullPlanLine(s)).toBe('Your plan: “Put the phone down and stand up.”');
    expect(pullShield({ until: '1 AM', plan: pullPlanLine(s), quiet: false }).sub).toMatch(/Your plan: “Put the phone down/);
    expect(pullPlanLine({ ...st, plan: [{ when: 'I am bored or idle', then: 'Walk.' }] } as Settings)).toBeNull();
  });
});

describe('which note goes', () => {
  const b = (o: Partial<ReturnType<typeof normPull>> = {}, days: Days = {}, now = at('2026-10-12T22:00')) =>
    pullBridge(days, st, { ...normPull({ on: true }), ...o }, now);
  const now = at('2026-10-12T23:15');
  it('long use: the lesson unless it was opened and done', () => {
    expect(pullNoteFor(b(), 'long', now, false)).toBe('long');
    expect(pullNoteFor({ ...b(), lessonDone: true }, 'long', now, true)).toBe('longDone');
    expect(pullNoteFor({ ...b(), lessonDone: true }, 'long', now, false)).toBe('long');
    expect(pullNoteFor(b({ long: 0 }), 'long', now, false)).toBeNull();
  });
  it('the hard hours: two notes, the second says the pause is coming when it is on', () => {
    expect(pullNoteFor(b(), 1, now, true)).toBe('hard1');
    expect(pullNoteFor(b(), 2, now, true)).toBe('hard2');
    expect(pullNoteFor(b({ pause: true }), 2, now, true)).toBe('hard2Pause');
    expect(pullNoteFor(b(), 3, now, true)).toBeNull();
    expect(pullNoteFor(b({ hard: false }), 1, now, true)).toBeNull();
  });
  it('after a slip: no stakes, one note to SOS, and long use is quiet', () => {
    const d = slip({}, '2026-10-12', '21:30');
    const q = b({ pause: true }, d);
    expect(pullNoteFor(q, 1, now, true)).toBe('quiet');
    expect(pullNoteFor(q, 2, now, true)).toBeNull();
    expect(pullNoteFor(q, 'long', now, true)).toBeNull();
    expect(q.notes.quiet.url).toBe('/sos');
  });
});

describe('the notes ignored', () => {
  const k = '2026-10-12';
  const night = at('2026-10-12T23:40:00');
  const f0 = { step: 0, low: 0, idle: 0, was: 0, warn: false } as const;
  it('burns one step lower that night and the next day, until the part is done', () => {
    expect(pullDrift(f0, night, {}, st, k, night + 60_000)).toMatchObject({ step: 1, pull: true });
    expect(pullDrift(f0, night, {}, st, '2026-10-13', at('2026-10-13T12:00:00'))).toMatchObject({ step: 1 });
    expect(pullDrift(f0, night, {}, st, '2026-10-14', at('2026-10-14T12:00:00'))).toEqual(f0);
    const done: Days = { '2026-10-13': { p: { ls: ['l1'] } } } as unknown as Days;
    expect(pullDrift(f0, night, done, st, '2026-10-13', at('2026-10-13T12:00:00'))).toEqual(f0);
  });
  it('never in the hours after a slip, and never deeper than it already burns', () => {
    expect(pullDrift(f0, night, slip({}, k, '22:00'), st, k, night + 60_000)).toEqual(f0);
    const lower = { step: 3, low: 1, idle: 4, was: 3, warn: false } as const;
    expect(pullDrift(lower, night, {}, st, k, night + 60_000)).toEqual(lower);
    expect(pullDrift(f0, null, {}, st, k, night)).toEqual(f0);
  });
  it('says why in plain words', () => {
    expect(lowWords(pullDrift(f0, night, {}, st, k, night + 60_000))?.p).toBe('You stayed on it through your hard hours.');
  });
});

describe('Put it down', () => {
  it('logs an urge ridden out on the log day, after scrolling, by leaving the room', () => {
    const now = at('2026-10-14T01:30:00');
    const e = pullDownEvent({}, st, now)!;
    expect(e).toEqual({ key: '2026-10-13', time: '01:30', fields: { trigger: 'scroll', did: ['left'] } });
    const r = addEvent({}, e.key, 'rode', e.time, e.fields);
    expect(partDone(r.days, st, e.key)).toBe(true);
  });
  it('logs nothing again within the hour, or after an urge just ridden out elsewhere', () => {
    const now = at('2026-10-13T22:00:00');
    const e = pullDownEvent({}, st, now)!;
    const days = addEvent({}, e.key, 'rode', e.time, e.fields).days;
    expect(pullDownEvent(days, st, now + 30 * 60000)).toBeNull();
    expect(pullDownEvent(days, st, now + 61 * 60000)).not.toBeNull();
  });
  it('a slip in the hour does not stop it', () => {
    const now = at('2026-10-13T22:00:00');
    const days = addEvent({}, '2026-10-13', 'slipped', '21:40').days;
    expect(pullDownEvent(days, st, now)).not.toBeNull();
  });
});
