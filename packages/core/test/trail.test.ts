/* The trail: five places, a drill at each in three lengths, the person's own picture, key and side path, and the stretch
   that carries one battle across hours and days. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { UrMem } from '../src/sos';

const st = core.normSettings({});
const H = 3600_000;
const t0 = new Date('2026-11-03T21:00:00').getTime();

describe('the places', () => {
  it('has five places in order, each with a line, a picture and three drills', () => {
    expect(core.TRAIL_PLACES).toEqual(['drift', 'spark', 'preview', 'case', 'steps']);
    for (const id of core.TRAIL_PLACES) {
      const p = core.TRAIL[id];
      expect(p.say.length).toBeGreaterThan(3);
      expect(p.see.length).toBeGreaterThan(10);
      for (const l of ['s', 'm', 'l'] as const) expect(p.drills[l].do.length).toBeGreaterThan(5);
    }
  });

  it('counts each drill as an action the log knows', () => {
    for (const id of core.TRAIL_PLACES) expect(core.didIds([core.TRAIL[id].did])).toEqual([core.TRAIL[id].did]);
  });

  it('never asks a person to reach out to anyone (the owner, November 3, 2026)', () => {
    const words = JSON.stringify([core.TRAIL, core.TRAIL_LIGHTS, core.TRAIL_LINES]).toLowerCase();
    for (const w of ['text ', 'call ', 'message', 'reach out', 'your person', 'tell someone']) expect(words).not.toContain(w);
  });

  it('writes in the app voice: no contractions', () => {
    const words = JSON.stringify([core.TRAIL, core.TRAIL_LIGHTS, core.TRAIL_LINES, core.TRAIL_LENS]);
    expect(words).not.toMatch(/\b\w+'(t|s|re|ll|ve|d|m)\b/);
    expect(words).not.toMatch(/\b\w+’(t|re|ll|ve|m)\b/);
  });

  it('says what each place is and the thought heard there, so a person can tell where they are (the owner, November 3, 2026)', () => {
    for (const id of core.TRAIL_PLACES) {
      expect(core.TRAIL[id].means.length).toBeGreaterThan(5);
      expect(core.TRAIL[id].hear.length).toBeGreaterThan(3);
      expect(core.TRAIL[id].turn.length).toBeGreaterThan(30);
      expect(core.TRAIL[id].turn.length).toBeLessThan(130);
    }
  });

  it('has a fill for every light at every length', () => {
    expect(core.TRAIL_LIGHTS.map((x) => x.id)).toEqual(['hungry', 'angry', 'lonely', 'tired']);
    for (const x of core.TRAIL_LIGHTS) for (const l of ['s', 'm', 'l'] as const) expect(x.fill[l].length).toBeGreaterThan(10);
  });
});

describe('what it may say next', () => {
  it('shows a different line on each visit, and the night lines first late at night', () => {
    expect(core.trailLine(0, false).line).not.toBe(core.trailLine(1, false).line);
    expect(core.trailLine(core.TRAIL_LINES.length, false)).toEqual(core.trailLine(0, false));
    const late = core.trailLine(0, true);
    expect(core.TRAIL_LINES.find((x) => x.line === late.line)?.late).toBe(true);
    expect(core.trailLine(-1, false).line.length).toBeGreaterThan(0);
  });
});

describe('the person own words', () => {
  it('uses their picture of tomorrow when they wrote one', () => {
    expect(core.trailPicture({})).toMatchObject({ own: false });
    expect(core.trailPicture({ fwd: { a: [], b: [], c: 'Saturday at the lake' } })).toEqual({ t: 'Saturday at the lake', own: true });
  });

  it('locks the door with their note, a reason, or who they are becoming', () => {
    expect(core.trailKey(null).own).toBe(false);
    expect(core.trailKey({ ...st, reasons: ['', 'My kids'] })).toEqual({ t: 'My kids', own: true });
    expect(core.trailKey({ ...st, reasons: ['My kids'], note: 'Read this first' }).t).toBe('Read this first');
    expect(core.trailKey({ ...st, reasons: [], note: '', becoming: 'Someone who is clean' }).t).toBe('Someone who is clean');
  });

  it('takes the side path from their urge plan, never a blank starting line', () => {
    expect(core.trailSide(null, true).own).toBe(false);
    expect(core.trailSide({ ...st, plan: [{ when: 'bored', then: 'Something else: ______' }] }, false).own).toBe(false);
    expect(core.trailSide({ ...st, plan: [{ when: 'in bed', then: 'Get up and read in the kitchen' }] }, true)).toEqual({
      t: 'Get up and read in the kitchen',
      own: true,
    });
  });

  it('never sends a person to bed by day, even when their plan starts with the bed line (the owner, November 4, 2026)', () => {
    const plan = [
      { when: 'I am in bed late at night', then: 'Get up and leave the room for 10 minutes. Then back to bed without my phone.' },
      { when: 'I am bored or idle', then: 'Go for a walk.' },
    ];
    expect(core.trailSide({ ...st, plan }, false).t).toBe('Go for a walk.');
    expect(core.trailSide({ ...st, plan }, true).t).toContain('back to bed');
    expect(core.trailSide({ ...st, plan: plan.slice(0, 1) }, false)).toMatchObject({ own: false });
    expect(core.trailSide({ ...st, plan: plan.slice(0, 1) }, false).t).not.toMatch(/bed|sleep/i);
    const day = core.TRAIL_PLACES.map((x) => core.trailGuide(x, { side: core.trailSide({ ...st, plan }, false).t, fill: core.trailFill('tired', 'm', false) }));
    expect(JSON.stringify(day)).not.toMatch(/\bbed\b|sleep/i);
  });
});

describe('the stretch', () => {
  it('begins on the first visit and carries on across hours and days while visits keep coming', () => {
    let m: UrMem = core.trailBegin({}, t0);
    expect(core.trailStretchOf(m)).toEqual({ t0, last: t0, at: null, visits: 1, home: 0 });
    m = core.trailTouch(m, 'preview', t0 + 5 * 60000);
    m = core.trailReach(m, t0 + 6 * 60000);
    m = core.trailBegin(m, t0 + 11 * H);
    m = core.trailBegin(m, t0 + 22 * H);
    const s = core.trailStretchOf(m)!;
    expect(s.t0).toBe(t0);
    expect(s.visits).toBe(3);
    expect(s.home).toBe(1);
    expect(s.at).toBe('preview');
  });

  it('ends after half a day of quiet, and the next visit begins a new one', () => {
    const m = core.trailBegin(core.trailBegin({}, t0), t0 + 13 * H);
    expect(core.trailStretchOf(m)).toMatchObject({ t0: t0 + 13 * H, visits: 1, at: null });
    expect(core.trailOpen(core.trailStretchOf(core.trailBegin({}, t0)), t0 + 12 * H)).toBe(false);
  });

  it('treats anything odd in memory as no stretch', () => {
    expect(core.trailStretchOf({ trail: 'x' })).toBeNull();
    expect(core.trailStretchOf({ trail: { t0: 5, last: 2 } })).toBeNull();
    expect(core.trailStretchOf({ trail: { t0: 1, last: 2, at: 'nowhere', visits: -3 } })).toEqual({ t0: 1, last: 2, at: null, visits: 1, home: 0 });
  });

  it('remembers the length picked, 2 minutes until one is', () => {
    expect(core.trailLenOf({})).toBe('m');
    expect(core.trailLenOf({ trailLen: 'l' })).toBe('l');
    expect(core.trailLenOf({ trailLen: 'x' })).toBe('m');
  });
});

describe('home', () => {
  it('says time held in plain words', () => {
    expect(core.trailHeld(20_000)).toBe('less than a minute');
    expect(core.trailHeld(60000)).toBe('1 minute');
    expect(core.trailHeld(40 * 60000)).toBe('40 minutes');
    expect(core.trailHeld(2 * H)).toBe('2 hours');
    expect(core.trailHeld(2 * H + 40 * 60000)).toBe('2 hours and 40 minutes');
    expect(core.trailHeld(27 * H)).toBe('1 day and 3 hours');
  });

  it('says where they stepped off, and how long it was held once that is worth saying', () => {
    const s = core.trailStretchOf(core.trailBegin({}, t0));
    expect(core.trailHomeLine('preview', s, t0 + 2 * 60000)).toBe('You stepped off at Preview.');
    expect(core.trailHomeLine('preview', s, t0 + 2 * H + 40 * 60000)).toBe('You stepped off at Preview. 2 hours and 40 minutes held.');
    expect(core.trailHomeLine(null, null, t0)).toBe('You stepped off.');
  });
});

describe('the notes', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 3, h, m).getTime();
  const open = (t: number) => core.trailBegin({}, t);

  it('sends two at a time, an hour apart, only while a stretch is open', () => {
    const n = core.trailNotes(open(at(14)), {}, at(14));
    expect(n.map((x) => x.at)).toEqual([at(15), at(16)]);
    expect(core.trailNotes({}, {}, at(14))).toEqual([]);
    expect(core.trailNotes(open(at(1)), {}, at(14))).toEqual([]);
  });

  it('never comes at night', () => {
    expect(core.trailNotes(open(at(20, 30)), {}, at(20, 30)).map((x) => x.at)).toEqual([at(21, 30)]);
    expect(core.trailNotes(open(at(21, 30)), {}, at(21, 30))).toEqual([]);
  });

  it('rests after a slip, until the person starts again', () => {
    const days = core.addEvent({}, '2026-11-03', 'slipped', '14:30', {}).days;
    expect(core.trailNotes(open(at(14)), days, at(15))).toEqual([]);
    expect(core.trailNotes(open(at(16)), days, at(16)).length).toBe(2);
  });

  it('keeps to five a day, counting the ones already come', () => {
    let m = open(at(8));
    for (let h = 8; h < 18; h += 2) {
      const n = core.trailNotes(core.trailBegin(m, at(h)), {}, at(h));
      m = core.trailNoteKeep(core.trailBegin(m, at(h)), n, at(h));
    }
    const sent = (m.trailSent as number[]).concat((m.trailPlan as number[]).filter((t) => t <= at(18)));
    expect(sent.length).toBeLessThanOrEqual(5);
    expect(core.trailNotes(core.trailBegin(m, at(19)), {}, at(19))).toEqual([]);
  });

  it('gives the same plan when made again, so scheduling settles', () => {
    const m = open(at(14));
    const n = core.trailNotes(m, {}, at(14));
    expect(core.trailNotes(core.trailNoteKeep(m, n, at(14)), {}, at(14))).toEqual(n);
  });

  it('leaves the person be until morning, or for an hour', () => {
    const m = open(at(14));
    expect(core.trailNotes(core.trailLeave(m, at(14)), {}, at(15))).toEqual([]);
    expect(core.trailNotes(core.trailLater(m, at(14, 30)), {}, at(14, 30))[0].at).toBe(at(15, 30));
  });

  it('says nothing about what Daybook is for, and counts the hours held', () => {
    expect(core.trailNoteWords(0, 2 * H + 40 * 60000)).toBe('2 hours held. If it knocks again, the door is right here.');
    expect(core.trailNoteWords(1, 20 * 60000)).toBe('Where is it now? You know the way home.');
    for (let i = 0; i < 3; i++) expect(core.trailNoteWords(i, 3 * H)).not.toMatch(/porn|urge|craving|slip|habit/i);
  });
  it('fills the 2 minutes: eight cues of about fifteen seconds for every place, each short enough to read at a glance', () => {
    for (const id of core.TRAIL_PLACES) {
      const g = core.trailGuide(id);
      expect(g).toHaveLength(8);
      expect(core.TRAIL_GUIDE_SECS / g.length).toBe(15);
      for (const t of g) expect(t.length).toBeLessThan(100);
      for (const a of core.TRAIL_ACT[id]) expect(a).toBeLessThan(g.length);
    }
  });

  it('carries the person own words into the cues, and never asks them to reach out', () => {
    const g = core.trailGuide('case', { line: 'Just once', answer: 'Once is how it starts', key: 'My kids' });
    expect(g[0]).toContain('Just once');
    expect(g[1]).toContain('Once is how it starts.');
    expect(g[3]).toContain('My kids.');
    expect(core.trailGuide('steps', { side: 'Go for a walk' })[2]).toContain('Go for a walk.');
    const words = JSON.stringify(core.TRAIL_PLACES.map((x) => core.trailGuide(x))).toLowerCase();
    for (const w of ['text ', 'call ', 'message', 'reach out', 'tell someone']) expect(words).not.toContain(w);
    expect(words).not.toMatch(/\b\w+'(t|s|re|ll|ve|d|m)\b/);
  });

  it('says what the 2 minutes did, and never calls a loud craving a failure', () => {
    expect(core.trailAfter('high', 'low')).toEqual({ down: true, again: false, line: 'From very strong to a little. That was you.' });
    expect(core.trailAfter('mid', 'gone').down).toBe(true);
    const still = core.trailAfter('mid', 'high');
    expect(still.down).toBe(false);
    expect(still.line).not.toMatch(/fail|wrong|bad/i);
  });

  it('walks it through again while it is still strong, and puts SOS first when it is very strong (the owner, November 4, 2026)', () => {
    expect(core.trailAfter('high', 'mid')).toMatchObject({ down: true, again: true });
    expect(core.trailAfter('mid', 'mid')).toMatchObject({ down: false, again: true });
    expect(core.trailAfter('mid', 'mid').line).toContain('again');
    expect(core.trailAfter('low', 'low').again).toBe(false);
    expect(core.trailSosFirst('high')).toBe(true);
    expect(core.trailSosFirst('mid')).toBe(false);
  });

  it('says back what the person just wrote, short enough to read, and asks the mirror question with hope after it', () => {
    const own = { doing: 'Look at porn on my phone in bed', picture: 'the same videos as last time' };
    for (const id of core.TRAIL_PLACES) {
      const g = core.trailGuide(id, own).join(' ');
      expect(g).toMatch(/Look at porn on my phone in bed|the same videos as last time/);
      expect(core.trailGuide(id, { mirror: true })[core.TRAIL_MIRROR]).toBe('Look at yourself. Is this who you want to be?');
      expect(core.trailGuide(id)[core.TRAIL_MIRROR]).toContain('Picture your own face');
      expect(core.TRAIL_ACT[id].every((a) => a !== core.TRAIL_MIRROR)).toBe(true);
    }
    const long = core.trailGuide('steps', { doing: 'word '.repeat(40) })[0];
    expect(long).toContain('…');
    expect(long.length).toBeLessThan(140);
  });

  it('never tells a person to put the phone away while the guide is on it, and never sends them to bed in the morning', () => {
    for (const night of [false, true]) {
      const words = core.TRAIL_PLACES.map((x) => core.trailGuide(x, { night }).join(' '))
        .join(' ')
        .toLowerCase();
      expect(words).not.toMatch(/leave the phone|phone stays|phone goes|phone in another room|distance between you and the phone/);
    }
    expect(core.trailFill('tired', 'm', false)).not.toMatch(/bed|lie down/i);
    expect(core.trailFill('tired', 'l', false)).not.toMatch(/bed/i);
    expect(core.trailFill('tired', 'm', true)).toMatch(/bed/i);
    expect(core.trailFill('hungry', 'm', false)).toBe(core.trailFill('hungry', 'm', true));
  });
});
