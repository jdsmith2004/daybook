/* Replay and Self Talk, the two SOS moves of November 15, 2026: which lesson card a replay shows, and the lines Self Talk says. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-11-15';
const withA = (a: Record<string, unknown>): Settings => core.normSettings({ onb: { a } } as unknown as Partial<Settings>);
const plain = core.normSettings({});
const faith = withA({ faith: 'big' });
/** a log where these lessons were finished */
const did = (...ids: string[]): Days => ({ [tk]: { d: tk, events: [], checkin: null, p: { ls: ids }, u: 0 } }) as unknown as Days;
/** a fixed run of random numbers */
const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe('Replay: which lessons', () => {
  it('every lesson on the list exists, and its card is a Short card with its picture, for every habit it is written for', () => {
    const habits = ['porn', 'alcohol', 'gambling', 'other'];
    core.REPLAY.forEach((R) => {
      expect(core.lessonById(R.id)).toBeTruthy();
      expect(R.why.length).toBeGreaterThan(20);
      habits.forEach((habit) => {
        const st = withA({ habit, faith: 'big' });
        if (!core.lessonFor(R.id, st)) return;
        const at = core.replayCard(R, st);
        expect(at, R.id + ' for ' + habit).toBeTruthy();
        const c = at!.L.cards[at!.ci];
        expect(c.q).toBe(1);
        expect(core.cardArt(c)).toBeTruthy();
        expect(at!.L.key.length).toBeGreaterThan(0);
      });
    });
  });

  it('shows only lessons the person has finished', () => {
    expect(core.replayList({}, plain)).toEqual([]);
    expect(core.replayList(did('l2', 'l1', 'l5'), plain).map((R) => R.id)).toEqual(['l2']);
  });

  it('is offered only with two lessons or more to replay', () => {
    expect(core.replayCan(did('l2'), plain)).toBe(false);
    expect(core.replayCan(did('l2', 'l16'), plain)).toBe(true);
  });

  it('leaves the faith lessons out unless faith is on', () => {
    expect(core.replayList(did('g8', 'g3', 'l2'), plain).map((R) => R.id)).toEqual(['l2']);
    expect(
      core
        .replayList(did('g8', 'g3', 'l2'), faith)
        .map((R) => R.id)
        .sort(),
    ).toEqual(['g3', 'g8', 'l2']);
  });

  it('leaves a lesson out when it is not written for the person’s habit', () => {
    const gambling = withA({ habit: 'gambling' });
    core.replayList(did(...core.REPLAY.map((R) => R.id)), gambling).forEach((R) => expect(core.lessonFor(R.id, gambling)).toBeTruthy());
  });

  it('never shows the same lesson twice in a row, across rides or in one', () => {
    const days = did('l2', 'l16', 'l33');
    for (let i = 0; i < 20; i++) {
      const r = Math.random;
      const p = core.replayPick(days, plain, { rlast: 'l2' }, r);
      expect(p!.id).not.toBe('l2');
      const q = core.replayPick(days, plain, {}, r, ['l16']);
      expect(q!.id).not.toBe('l16');
    }
    /* with two lessons, the ride alternates */
    const two = did('l2', 'l16');
    expect(core.replayPick(two, plain, {}, seq(0.1), ['l2'])!.id).toBe('l16');
    expect(core.replayPick(two, plain, {}, seq(0.1), ['l2', 'l16'])!.id).toBe('l2');
  });

  it('Keep this makes a lesson come up more; a quick pass, less, never gone', () => {
    const R = core.REPLAY.find((x) => x.id === 'l33')!;
    let m: core.UrMem = {};
    const base = core.replayWeight(R, plain, m);
    m = core.replayKeep(m, 'l33', true);
    expect(core.replayWeight(R, plain, m)).toBeGreaterThan(base);
    m = core.replayKeep(m, 'l33', false);
    expect(core.replayScore(m, 'l33')).toBe(0);
    for (let i = 0; i < 10; i++) m = core.replayPassed(m, 'l33');
    expect(core.replayScore(m, 'l33')).toBe(-2);
    expect(core.replayWeight(R, plain, m)).toBeGreaterThan(0);
    for (let i = 0; i < 10; i++) m = core.replayKeep(m, 'l33', true);
    expect(core.replayScore(m, 'l33')).toBe(3);
  });

  it('a kept lesson is picked more often', () => {
    const days = did('l2', 'l16', 'l33');
    const count = (mem: core.UrMem) => {
      let n = 0;
      for (let i = 0; i < 300; i++) if (core.replayPick(days, plain, mem, () => (i + 0.5) / 300)!.id === 'l33') n++;
      return n;
    };
    expect(count({ rpl: { l33: 3 } })).toBeGreaterThan(count({}));
  });

  it('a lesson behind a move the person said helps comes up more', () => {
    const R = core.REPLAY.find((x) => x.id === 'l16')!;
    const liked = core.rateUrTool(plain, 'thought', 1);
    expect(core.replayWeight(R, liked, {})).toBeGreaterThan(core.replayWeight(R, plain, {}));
  });

  it('the remembered score never holds junk', () => {
    expect(core.replayScore({ rpl: { l2: 'x' } } as unknown as core.UrMem, 'l2')).toBe(0);
    expect(core.replayScore({ rpl: 5 } as unknown as core.UrMem, 'l2')).toBe(0);
    expect(core.replaySeen({}, 'l2').rlast).toBe('l2');
  });
});

describe('Replay and Self Talk in the ride', () => {
  const now = new Date('2026-11-15T15:00:00').getTime();
  const ride = (n: number, can: core.RideCan, mem: core.UrMem = {}) => {
    const sc = core.newUrge(now, 0);
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(core.rideNext(sc, {}, plain, tk, now, mem, can, out));
    return out;
  };
  it('Replay comes only when there is something to replay', () => {
    expect(ride(24, { words: true, fresh: true })).not.toContain('replay');
    expect(ride(24, { words: true, replay: true, fresh: true })).toContain('replay');
  });
  it('neither is in the ride until the owner says yes (RIDE_FRESH)', () => {
    const r = ride(30, { words: true, replay: true, fresh: core.RIDE_FRESH });
    if (!core.RIDE_FRESH) ['replay', 'selftalk'].forEach((id) => expect(r).not.toContain(id));
  });
  it('Self Talk comes last of all the moves to start with, and still comes', () => {
    const r = ride(24, { words: true, replay: true, fresh: true });
    expect(r).toContain('selftalk');
    const first = (id: string) => r.indexOf(id);
    core.RIDE_MOVES.filter((id) => id !== 'selftalk').forEach((id) => expect(first(id)).toBeLessThan(first('selftalk')));
  });
  it('passed over often, Self Talk comes later and still comes', () => {
    let m: core.UrMem = {};
    for (let i = 0; i < 3; i++) m = core.ridePassed(core.rideFade(m), 'selftalk', 1000);
    expect(core.rideOften(m, 'selftalk')).toBe(true);
    expect(ride(30, { words: true, fresh: true }, m)).toContain('selftalk');
  });
  it('both have a line on why they work, and a lesson', () => {
    ['replay', 'selftalk'].forEach((id) => {
      const s = core.rideScience(id);
      expect(s!.t).toBeTruthy();
      expect(s!.lesson).toBeTruthy();
    });
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
