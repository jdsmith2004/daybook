/* SOS, checked against the legacy app: what it suggests for each kind of moment (how strong, what set it off, the tools already
   tried, "still strong" rounds), the line under the suggestion, your record, and the lesson offered afterward. */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const J = <T>(x: T): T => JSON.parse(JSON.stringify(x));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'setup-flow.json', 'rekindle-words.json', 'tools-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

afterEach(() => vi.useRealTimers());

describe.each(logs)('$name', (fx) => {
  const st: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => {
    if (core.isKey(k)) days[k] = core.normDay(fx.input.days[k], k);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Case = { now: number; expected: any; at: string };
  const cases: Case[] = fx.cases.map((c: Case) => ({ ...c, at: new Date(c.now).toString().slice(0, 21) }));

  describe.each(cases)('at $at', ({ now, expected: e }: Case) => {
    const S = e.sos;
    const tk = () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(now);
      return core.logicalKey(now, st.rollover);
    };

    it('reads the same record of what helped', () => {
      const k = tk();
      expect(J(core.urStats(days, k))).toEqual(S.stats);
      expect(core.urTried(days)).toEqual(S.tried);
      expect(core.urEvidence(days)).toEqual(S.ev);
    });

    it('ranks the tools and suggests the same one, with the same words', () => {
      const k = tk();
      for (const v of S.variants) {
        const sc: core.UrState = { ...core.newUrge(now, 0), trigger: null, skip: [], explore: false, ...v.sc };
        const rank = core.urRank(sc, days, st, k, now, {});
        expect(rank.map((x) => ({ id: x.id, score: x.score, off: x.off, pin: x.pin, tk: x.tk }))).toEqual(v.rank);
        const pk = core.urPickSug(sc, days, st, k, now, {}, () => 0.99);
        expect({ top: pk.top.id, mode: pk.mode, combo: pk.combo ? pk.combo.id : null }).toEqual(v.pick);
        const sg = core.urSuggestion(pk, sc.strength, days, now);
        expect(v.go).toBe(sg.title + sg.sub);
        expect(sg.cap).toBe(v.cap);
      }
    });

    it('offers the same lesson afterward', () => {
      tk();
      const asks: [string | null, boolean][] = [
        ['late', false],
        [null, true],
        ['stress', false],
        ['u_custom1', false],
      ];
      asks.forEach(([t, sl], i) => {
        const r = core.urLessonFor(t, sl, null, days, {}, now);
        expect(r.pair ? { id: r.pair.l.id, rev: r.pair.rev } : null).toEqual(S.lessons[i]);
      });
    });
  });
});

/* the tag the two tools that help most carry for someone with no record of their own */
const BEST = { breathe: 'A strong first pick', ground: 'A strong first pick' };

describe('SOS memory and rounds', () => {
  it('never repeats a line you saw lately, while there is another', () => {
    let mem: core.UrMem = {};
    const seen: number[] = [];
    for (let j = 0; j < 3; j++) {
      const r = core.urPick('do.base', ['a', 'b', 'c'], null, mem, () => 0);
      seen.push(r.i);
      mem = r.mem;
    }
    expect(new Set(seen).size).toBe(3);
  });

  it('a suggestion you pass over slides down, and using it eases that back', () => {
    let mem = core.urNote({}, 'move', 'breathe');
    expect(mem.pass).toEqual({ move: 1 });
    mem = core.urNote(mem, 'move', 'move');
    expect(mem.pass).toEqual({ move: 0 });
  });

  it('learns what you pick: a tool you keep passing over gives way to the one you choose', () => {
    const st = core.normSettings({ start: '2026-10-01' });
    /* a stressful afternoon, nothing in the log yet: Breathe leads, then 5-4-3-2-1 (the two that help most) */
    const now = new Date(2026, 9, 15, 15, 0).getTime();
    const sc = { ...core.newUrge(now, 0), trigger: 'stress', explore: false };
    const top = (mem: core.UrMem, s: Settings = st) => core.urPickSug({ ...sc }, {}, s, '2026-10-15', now, mem, () => 0.99).top.id;
    expect(top({})).toBe('breathe');
    let mem: core.UrMem = {};
    mem = core.urNote(mem, 'breathe', 'thought');
    expect(top(mem)).toBe('ground');
    /* keep passing over the suggestion for Name the thought, and it comes first within a few rounds */
    let n = 1;
    while (top(mem) !== 'thought' && n < 8) {
      mem = core.urNote(mem, top(mem), 'thought');
      n++;
    }
    expect(top(mem)).toBe('thought');
    expect(n).toBeLessThanOrEqual(6);
    expect(
      core.urSuggestion(
        core.urPickSug({ ...sc }, {}, st, '2026-10-15', now, mem, () => 0.99),
        null,
        {},
        now,
        st,
        mem,
      ).cap,
    ).toBe('You often pick this one.');
    /* picking it is not liking it: the tag waits for picks that ended in It passed */
    expect(core.urTags({}, st, '2026-10-15', mem)).toEqual(BEST);
  });

  it('"You like this" counts only picks that ended in It passed, or a Yes', () => {
    const st = core.normSettings({ start: '2026-10-01' });
    /* the pause, picked and stopped twice: no tag */
    let mem: core.UrMem = core.urNote(core.urNote({}, 'move', 'pause'), 'move', 'pause');
    mem = core.urWon(mem, { rounds: [['pause', 's']], mine: ['pause'] });
    expect(core.urTags({}, st, '2026-10-15', mem)).toEqual(BEST);
    /* a suggested tool that passed is not a pick of your own */
    mem = core.urWon(mem, { rounds: [['move', 'p']], mine: ['pause'] });
    expect(mem.won).toBeUndefined();
    /* picked yourself and passed, twice */
    mem = core.urWon(mem, { rounds: [['pause', 'p']], mine: ['pause'] });
    expect(core.urTags({}, st, '2026-10-15', mem)).toEqual(BEST);
    mem = core.urWon(mem, {
      rounds: [
        ['pause', 's'],
        ['pause', 'p'],
      ],
      mine: ['pause'],
    });
    expect(mem.won).toEqual({ pause: 2 });
    expect(core.urTags({}, st, '2026-10-15', mem)).toEqual({ ...BEST, pause: 'You like this' });
    /* a Yes to "Would you use it again?" is enough by itself */
    expect(core.urTags({}, core.rateUrTool(st, 'reasons', 1), '2026-10-15', {})).toEqual({ ...BEST, reasons: 'You like this' });
    /* the two that help most lose their tag after a Not really */
    expect(core.urTags({}, core.rateUrTool(st, 'ground', -1), '2026-10-15', {})).toEqual({ breathe: BEST.breathe });
  });

  it('your own record wins the suggestion, and says why in your numbers', () => {
    const st = core.normSettings({ start: '2026-08-01' });
    const now = new Date(2026, 9, 15, 21, 0).getTime();
    const tk = '2026-10-15';
    /* forty days in: Breathe passed every time, fifteen times */
    let days: Days = {};
    for (let i = 1; i <= 15; i++) days = core.addEvent(days, core.addDays(tk, -i), 'rode', '20:30', { tr: [['breathe', 'p']] }).days;
    const sc = { ...core.newUrge(now, 0), explore: false };
    const pk = core.urPickSug({ ...sc }, days, st, tk, now, {}, () => 0.99);
    expect(pk.top.id).toBe('breathe');
    expect(pk.mode).toBe('own');
    expect(core.urSuggestion(pk, 'mid', days, now, st, {}).cap).toBe('Worked 15 of the 15 times you tried it.');
    /* even when SOS would try something new */
    expect(core.urPickSug({ ...sc, explore: true }, days, st, tk, now, {}, () => 0).top.id).toBe('breathe');
    /* a Not really takes it off the top spot (the ranking still weighs it), and Not for me lets it go */
    expect(core.urPickSug({ ...sc }, days, core.rateUrTool(st, 'breathe', -1), tk, now, {}, () => 0.99).mode).not.toBe('own');
    expect(core.urPickSug({ ...sc }, days, core.setUrOff(st, 'breathe', true), tk, now, {}, () => 0.99).top.id).not.toBe('breathe');
    /* once used in this SOS, the next round moves on */
    expect(core.urPickSug({ ...sc, used: ['breathe'], again: 1 }, days, st, tk, now, {}, () => 0.99).top.id).not.toBe('breathe');
    /* Breathe can be suggested from the first round, with a record or without one */
    const one = core.addEvent({}, core.addDays(tk, -1), 'rode', '20:30', { tr: [['breathe', 'p']] }).days;
    expect(core.urRank(sc, one, st, tk, now, {}).find((x) => x.id === 'breathe')!.off).toBe(false);
    expect(core.urRank(sc, {}, st, tk, now, {}).find((x) => x.id === 'breathe')!.off).toBe(false);
    /* of two proven tools, the surer one comes first */
    let two: Days = {};
    for (let i = 1; i <= 6; i++) two = core.addEvent(two, core.addDays(tk, -i), 'rode', '20:30', { tr: [['move', i <= 3 ? 'p' : 's']] }).days;
    for (let i = 7; i <= 9; i++) two = core.addEvent(two, core.addDays(tk, -i), 'rode', '20:30', { tr: [['ground', 'p']] }).days;
    expect(core.urPickSug({ ...sc }, two, st, tk, now, {}, () => 0.99).top.id).toBe('ground');
  });

  it('a tool not tried yet says so, with its time', () => {
    const st = core.normSettings({ start: '2026-10-01' });
    const now = new Date(2026, 9, 15, 15, 0).getTime();
    const sc = { ...core.newUrge(now, 0), trigger: 'stress', explore: true };
    const pk = core.urPickSug({ ...sc }, {}, st, '2026-10-15', now, {}, () => 0);
    expect(pk.mode).toBe('fresh');
    expect(core.urSuggestion(pk, null, {}, now, st, {}).cap).toMatch(/^Not tried yet\.( (One minute|Two minutes|Three minutes)\.)?$/);
  });

  it('remembers when an SOS was last open', () => {
    expect(core.urLastAt({})).toBeNull();
    expect(core.urLastAt({ sosAt: 5000, last: { t: 3000, tool: null, out: 'rode' } })).toBe(5000);
    expect(core.urLastAt({ last: { t: 3000, tool: null, out: 'rode' } })).toBe(3000);
  });

  it('never suggests a tool marked Not for me, and weighs Would you use this again', () => {
    const now = new Date(2026, 9, 15, 15, 0).getTime();
    const sc = { ...core.newUrge(now, 0), trigger: 'bored', explore: false };
    let st = core.normSettings({ start: '2026-10-01' });
    const top = () => core.urPickSug({ ...sc }, {}, st, '2026-10-15', now, {}, () => 0.99).top.id;
    expect(top()).toBe('move');
    st = core.setUrOff(st, 'move', true);
    expect(core.urOffOf(st)).toEqual(['move']);
    expect(top()).toBe('ground');
    expect(core.urRank(sc, {}, st, '2026-10-15', now, {}).find((x) => x.id === 'move')!.off).toBe(true);
    /* Surprise me is never suggested on its own (core UR_QUIET), even for boredom */
    expect(core.urRank(sc, {}, st, '2026-10-15', now, {}).find((x) => x.id === 'surprise')!.off).toBe(true);
    /* it can still be your go-to, and it can come back */
    expect(core.urPickSug({ ...sc }, {}, { ...st, urPin: 'move' }, '2026-10-15', now, {}, () => 0.99).top.id).toBe('move');
    st = core.setUrOff(st, 'move', false);
    expect(top()).toBe('move');
    st = core.rateUrTool(core.rateUrTool(st, 'move', -1), 'move', -1);
    expect(core.urLikeOf(st, 'move')).toBe(-2);
    expect(top()).toBe('ground');
    for (let i = 0; i < 5; i++) st = core.rateUrTool(st, 'curious', 1);
    expect(core.urLikeOf(st, 'curious')).toBe(3);
    expect(top()).toBe('curious');
    /* what comes from elsewhere is cleaned when read */
    const odd = { ...st, urOff: ['move', 'nope', 'move', 4], urLike: { move: 'x', curious: 99 } } as unknown as Settings;
    expect(core.urOffOf(odd)).toEqual(['move']);
    expect(core.urLikeOf(odd, 'move')).toBe(0);
    expect(core.urLikeOf(odd, 'curious')).toBe(3);
  });

  it('keeps each round: the tool and what happened next', () => {
    let sc = { ...core.newUrge(1000, 0), used: ['breathe'] };
    sc = core.urAnswer(sc, 'again');
    expect(sc.rounds).toEqual([['breathe', 's']]);
    expect(sc.again).toBe(1);
    sc = core.urAnswer({ ...sc, used: ['breathe', 'move'], roundDone: false }, 'rode');
    expect(sc.rounds).toEqual([
      ['breathe', 's'],
      ['move', 'p'],
    ]);
  });

  it('saves the entry with how long it took, and how long you waited before a slip', () => {
    const st = core.normSettings({ start: '2026-10-01' });
    const t0 = new Date(2026, 9, 15, 23, 10).getTime();
    const sc = { ...core.newUrge(t0, 0), strength: 'high' as const, used: ['breathe', 'message'], rounds: [['breathe', 's']] as [string, 'p' | 's' | 'x'][] };
    const r = core.urEntry(sc, 'rode', st, t0 + 12 * 60000);
    expect(r.key).toBe('2026-10-15');
    expect(r.time).toBe('23:10');
    expect(r.fields).toMatchObject({ did: ['breathe', 'reach'], st: 'high', m: 12, tr: [['breathe', 's']] });
    expect(core.urEntry(sc, 'slipped', st, t0 + 7 * 60000).fields.wt).toBe(5);
  });

  it('says what SOS kept, in words', () => {
    const e = core.normEvent({
      id: 'x',
      outcome: 'rode',
      st: 'mid',
      m: 4,
      tr: [
        ['breathe', 's'],
        ['move', 'p'],
      ],
    })!;
    expect(core.urSosLines(e)).toEqual(['Started strong. Passed in 4 minutes.', 'Tried: Breathe (still strong), then Move (it passed).']);
  });
});

describe('the tools, against the legacy words', () => {
  const w = JSON.parse(readFileSync(join(dir, 'tools-words.json'), 'utf8'));
  it('reach a person', () => {
    expect(core.messageTexts(core.normSettings({ start: '2026-10-01' }))).toEqual(w.texts[0]);
    expect(core.messageTexts(core.normSettings({ start: '2026-10-01', safePerson: 'Sam' }))).toEqual(w.texts[1]);
  });
  it('get curious', () => {
    for (const [b, f, want] of w.cu) expect(core.cuLine(b, f)).toBe(want);
  });
  it('go to bed', () => {
    expect(core.bedPlans(core.normSettings({ start: '2026-10-01' }))).toEqual(w.bed[0]);
    expect(core.bedPlans(core.normSettings({ start: '2026-10-01', note: 'It passes.' }))).toEqual(w.bed[1]);
  });
  it('my reasons', () => {
    for (const [t, id] of w.reasons) expect(core.reasonGuess(t).id).toBe(id);
  });
});

describe('a text to your safe person', () => {
  it('keeps a number as typed, and opens the messages app with the words ready', () => {
    expect(core.cleanPhone('(555) 123-4567')).toBe('5551234567');
    expect(core.cleanPhone(' +44 20 7946 0958 ')).toBe('+442079460958');
    expect(core.cleanPhone('call me')).toBe('');
    expect(core.cleanPhone('12')).toBe('');
    const body = core.messageTexts(core.normSettings({ start: '2026-10-01', safePerson: 'Sam' }))[1];
    expect(body).toBe('Hey Sam, rough moment. Can you text me back about anything for a few minutes?');
    expect(core.smsLink('555-123-4567', 'Hi & bye', true)).toBe('sms:5551234567&body=Hi%20%26%20bye');
    expect(core.smsLink('555-123-4567', 'Hi', false)).toBe('sms:5551234567?body=Hi');
    expect(core.smsLink('', 'Hi', true)).toBe('sms:&body=Hi');
  });
});

describe('your urge plan in SOS', () => {
  const st = core.normSettings({ v: 1, start: '2026-10-01', rollover: 4, u: 1 });
  it('late at night: the line for bed or late at night, its first sentence, as one sentence', () => {
    expect(core.urPlanNow(st, 23)).toBe('When I am in bed late at night, I will get up and leave the room for 10 minutes.');
    expect(core.urPlanNow(st, 2)).toBe('When I am in bed late at night, I will get up and leave the room for 10 minutes.');
  });
  it('in the day the feeling is not known, so no line', () => {
    expect(core.urPlanNow(st, 15)).toBeNull();
  });
  it('the person’s own words, a blank line, and no line for the night', () => {
    const own = { ...st, plan: [{ when: "I'm awake late, scrolling", then: 'I will put the phone in the kitchen. Then read.' }] };
    expect(core.urPlanNow(own, 23)).toBe("When I'm awake late, scrolling, I will put the phone in the kitchen.");
    expect(
      core.urPlanNow(
        {
          ...st,
          plan: [
            { when: '', then: '' },
            { when: 'I am lonely or low', then: 'Text a friend.' },
          ],
        },
        23,
      ),
    ).toBeNull();
  });
});

describe('what do I need and the menu ideas', () => {
  it('every need has one thing to do, and tired goes to bed only at night', () => {
    for (const n of core.NEEDS as unknown as [string][]) expect(core.needDo(n[0], false).label).toBeTruthy();
    expect(core.needDo('tired', true).tool).toBe('bed');
    expect(core.needDo('tired', false).tool).toBe('pause');
    expect(core.needDo('hungry', false).tool).toBeNull();
  });
  it('a menu idea opens its tool when it is one', () => {
    expect(core.ideaTool('Walk around the block')).toBe('move');
    expect(core.ideaTool('Ten squats or push-ups')).toBe('move');
    expect(core.ideaTool('Text a friend: "thinking of you"')).toBe('message');
    expect(core.ideaTool('Call someone for five minutes')).toBe('message');
    expect(core.ideaTool('Make a hot drink')).toBeNull();
    expect(core.ideaTool('Take a shower')).toBeNull();
  });
});
