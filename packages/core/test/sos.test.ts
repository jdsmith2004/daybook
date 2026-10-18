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
    /* a stressful afternoon, nothing in the log yet: Move leads */
    const now = new Date(2026, 9, 15, 15, 0).getTime();
    const sc = { ...core.newUrge(now, 0), trigger: 'stress', explore: false };
    const top = (mem: core.UrMem, s: Settings = st) => core.urPickSug({ ...sc }, {}, s, '2026-10-15', now, mem, () => 0.99).top.id;
    expect(top({})).toBe('move');
    let mem: core.UrMem = {};
    mem = core.urNote(mem, 'move', 'thought');
    expect(top(mem)).toBe('ground');
    mem = core.urNote(mem, 'ground', 'thought');
    expect(mem.pick).toEqual({ thought: 2 });
    expect(mem.pass).toEqual({ move: 1, ground: 1 });
    expect(top(mem)).toBe('thought');
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
    expect(core.urTags({}, st, '2026-10-15', mem)).toEqual({ thought: 'You like this' });
  });

  it('never suggests a tool marked Not for me, and weighs Would you use this again', () => {
    const now = new Date(2026, 9, 15, 15, 0).getTime();
    const sc = { ...core.newUrge(now, 0), trigger: 'bored', explore: false };
    let st = core.normSettings({ start: '2026-10-01' });
    const top = () => core.urPickSug({ ...sc }, {}, st, '2026-10-15', now, {}, () => 0.99).top.id;
    expect(top()).toBe('move');
    st = core.setUrOff(st, 'move', true);
    expect(core.urOffOf(st)).toEqual(['move']);
    expect(top()).toBe('surprise');
    expect(core.urRank(sc, {}, st, '2026-10-15', now, {}).find((x) => x.id === 'move')!.off).toBe(true);
    /* it can still be your go-to, and it can come back */
    expect(core.urPickSug({ ...sc }, {}, { ...st, urPin: 'move' }, '2026-10-15', now, {}, () => 0.99).top.id).toBe('move');
    st = core.setUrOff(st, 'move', false);
    expect(top()).toBe('move');
    st = core.rateUrTool(core.rateUrTool(st, 'move', -1), 'move', -1);
    expect(core.urLikeOf(st, 'move')).toBe(-2);
    expect(top()).toBe('surprise');
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
