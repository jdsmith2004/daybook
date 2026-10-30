/* The comeback after a slip (slip.ts): the feeling before (fb) and after (fa) kept on the slip, the plan made from the
   feeling (an after-slip talk-through with fw), and the lines that show the person their own pattern. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const K = '2026-10-20';
const noContractions = /\b\w+(n’t|n't|’re|'re|’ll|'ll|’ve|'ve|’m|'m|’s|'s)\b/i;
const slipOn = (days: core.Days, k: string, id: string, time: string, extra: Partial<core.DayEvent> = {}) =>
  core.addEvent(days, k, 'slipped', time, { id, ...extra }, 100).days;

describe('the feeling before and after, on the slip', () => {
  it('keeps a feeling word and a feeling afterwards on a slip, through changes and a backup', () => {
    let days = slipOn({}, K, 's1', '22:10');
    days = core.patchEvent(days, K, 's1', { fb: 'Lonely', trigger: 'lonely' }, 200);
    days = core.patchEvent(days, K, 's1', { fa: 'flat' }, 300);
    days = core.moveEvent(days, K, '2026-10-19', 's1', { time: '23:00' }, 400);
    const e = days['2026-10-19'].events[0];
    expect([e.fb, e.fa, e.trigger]).toEqual(['Lonely', 'flat', 'lonely']);
    const b = core.readBackup(JSON.stringify(core.makeBackup({ settings: null, days, reviews: {} })));
    expect(b.days['2026-10-19'].events[0].fb).toBe('Lonely');
    expect(b.days['2026-10-19'].events[0].fa).toBe('flat');
  });

  it('drops anything that is not a word or one of the feelings afterwards, and both on an urge ridden out', () => {
    for (const bad of ['', 'a'.repeat(25), '<b>', 3, null]) expect(core.normEvent({ id: 'x', outcome: 'slipped', fb: bad }).fb).toBeUndefined();
    for (const bad of ['sad', '', 1]) expect(core.normEvent({ id: 'x', outcome: 'slipped', fa: bad }).fa).toBeUndefined();
    expect(core.normEvent({ id: 'x', outcome: 'slipped', fb: 'Fed up', fa: 'giveup' })).toMatchObject({ fb: 'Fed up', fa: 'giveup' });
    expect(core.normEvent({ id: 'x', outcome: 'rode', fb: 'Lonely', fa: 'flat' })).not.toHaveProperty('fb');
    expect(core.normEvent({ id: 'x', outcome: 'rode', fa: 'flat' })).not.toHaveProperty('fa');
    /* an older entry gets neither key */
    expect(Object.keys(core.normEvent({ id: 'x', outcome: 'slipped' }))).not.toContain('fb');
  });

  it('shows the feeling on the entry row', () => {
    const e = core.normEvent({ id: 'x', outcome: 'slipped', time: '22:10', fb: 'Lonely', trigger: 'lonely' });
    expect(core.eventRow(e, null).meta).toMatch(/^felt lonely before/);
  });

  it('finds every word in the field, with its family', () => {
    for (const row of core.FEELINGS) for (const f of row) expect(core.famOfWord(f.w)).not.toBeNull();
    expect(core.famOfWord('Lonely')).toBe('lonely');
    expect(core.famOfWord('Stressed')).toBe('fear');
    expect(core.famOfWord('Calm')).toBe('calm');
    expect(core.famOfWord('Nope')).toBeNull();
    expect(core.feelPos('Ecstatic')).toEqual({ r: 0, c: 11 });
  });
});

describe('the pattern lines', () => {
  it('shows how it felt afterwards before, only when it has happened before and never for okay', () => {
    let days = slipOn({}, K, 's9', '22:10');
    expect(core.slipNowLine(days, 's9', 'flat')).toBeNull();
    days = slipOn(days, '2026-10-10', 'a', '21:00', { fa: 'flat' });
    days = slipOn(days, '2026-10-12', 'b', '21:00', { fa: 'shame' });
    expect(core.slipNowLine(days, 's9', 'flat')).toBe('After 2 of your last 3 slips, you felt flat or empty.');
    expect(core.slipNowLine(days, 's9', 'okay')).toBeNull();
  });

  it('at the next urge: how it felt after the last slips, only with 2 or more recorded and most of them heavy', () => {
    const fa = (list: (core.RkFeel | null)[]) =>
      list.reduce((d: core.Days, f, i) => slipOn(d, core.addDays(K, -10 + i), 's' + i, '22:00', f ? { fa: f } : {}), {});
    expect(core.slipFeltLine({})).toBeNull();
    expect(core.slipFeltLine(fa(['flat']))).toBeNull();
    expect(core.slipFeltLine(fa(['flat', 'flat']))).toBe('After both of your last 2 slips, you felt flat or empty.');
    expect(core.slipFeltLine(fa(['flat', 'okay', 'flat', 'flat']))).toBe('After 3 of your last 4 slips, you felt flat or empty.');
    /* slips with nothing recorded are not counted either way */
    expect(core.slipFeltLine(fa(['flat', null, 'flat', null]))).toBe('After both of your last 2 slips, you felt flat or empty.');
    /* most, not half */
    expect(core.slipFeltLine(fa(['flat', 'okay']))).toBeNull();
    expect(core.slipFeltLine(fa(['flat', 'pull', 'angry', 'shame']))).toBeNull();
    /* mixed: the heavy feelings named, the most common first */
    expect(core.slipFeltLine(fa(['shame', 'flat', 'shame', 'giveup', 'okay']))).toBe('After 4 of your last 5 slips, you felt ashamed, flat or like giving up.');
    expect(core.slipFeltLine(fa(['shame', 'flat', 'flat']))).toBe('After each of your last 3 slips, you felt flat or ashamed.');
    /* only the last five recorded */
    expect(core.slipFeltLine(fa(['flat', 'flat', 'flat', 'okay', 'okay', 'okay', 'pull']))).toBeNull();
  });

  it('the line at the next urge never names the habit, and has no contractions', () => {
    for (const f of ['flat', 'shame', 'giveup'] as core.RkFeel[]) {
      const l = core.slipFeltLine({ ...slipOn(slipOn({}, K, 'a', '21:00', { fa: f }), '2026-10-21', 'b', '21:00', { fa: f }) })!;
      expect(l).not.toMatch(noContractions);
      expect(l).not.toMatch(/porn|addict|relapse/i);
    }
  });
});

describe('the plan for next time', () => {
  it('offers four moves that fit what was going on, early bed at night, the device out of reach, and what held first', () => {
    expect(core.slipMoves('lonely', false)).toEqual(['text', 'call', 'people', 'kind', 'away']);
    expect(core.slipMoves('late', false)).toEqual(['away', 'bed', 'shower', 'breathe']);
    expect(core.slipMoves('stress', false)[0]).toBe('walk');
    /* late at night, going out is swapped for something that works at home, and early bed is offered */
    expect(core.slipMoves('lonely', true)).toEqual(['text', 'call', 'kind', 'bed', 'away']);
    expect(core.slipMoves('bored', true)).toEqual(['hands', 'show', 'move', 'bed', 'away']);
    expect(core.slipMoves('lonely', false, { people: { held: 2, n: 3 } })[0]).toBe('people');
    /* every situation's moves are real moves, with words */
    for (const w of Object.keys(core.TALK_WHEN) as core.TalkWhen[])
      for (const night of [false, true]) for (const m of core.slipMoves(w, night)) expect(core.TALK_MOVES[m][0]).toBeTruthy();
  });

  it('reads the situation from the slip: a built-in answer, or the urge itself', () => {
    expect(core.slipWhen('late')).toBe('late');
    expect(core.slipWhen('scroll')).toBe('scroll');
    for (const t of ['other', 'none', 'u_abc123', null, undefined, 'toString']) expect(core.slipWhen(t)).toBe('urge');
  });

  it('reads as an if-then plan from what was going on', () => {
    const t = {
      ...core.newTalk(1000),
      p: 'change' as const,
      pr: 1 as const,
      n: 'rest' as const,
      m: ['away'] as core.TalkMove[],
      mo: 'late',
      ft: 'late' as const,
    };
    expect(core.talkPlanLine(t)).toBe('When it is late and I am in bed with my phone, I will put the device out of reach.');
    expect(core.talkPlanLine({ ...t, ft: 'bored', mo: 'evening', m: ['hands'] })).toBe('When I am bored in the evening, I will start something with my hands.');
    expect(core.talkPlanLine({ ...t, ft: 'urge', mo: null, m: ['walk'] })).toBe('When the urge comes, I will walk it off.');
    expect(core.normTalk(t)!.ft).toBe('late');
    expect(core.normTalk({ ...t, ft: 'nope' as core.TalkWhen })).not.toHaveProperty('ft');
    expect(core.normTalk({ ...t, ft: 'toString' as core.TalkWhen })).not.toHaveProperty('ft');
  });

  it('takes a plan in the person own words', () => {
    const t = {
      ...core.newTalk(1000),
      p: 'change' as const,
      pr: 1 as const,
      n: 'close' as const,
      m: [] as core.TalkMove[],
      mx: ['Play guitar for 20 minutes'],
      mo: 'late',
      fw: 'Lonely',
    };
    expect(core.talkPlanLine(core.normTalk(t)!)).toBe('When I feel lonely late at night, I will play guitar for 20 minutes.');
  });

  it('reads as an if-then plan from the feeling, and the moment from the time of the slip', () => {
    expect(core.slipMoment('23:40')).toBe('late');
    expect(core.slipMoment('02:00')).toBe('late');
    expect(core.slipMoment('18:00')).toBe('evening');
    expect(core.slipMoment('13:00')).toBeNull();
    expect(core.slipMoment(null)).toBeNull();
    const t = {
      ...core.newTalk(1000),
      p: 'change' as const,
      pr: 1 as const,
      n: 'close' as const,
      m: ['text', 'away'] as core.TalkMove[],
      mo: 'late',
      fw: 'Lonely',
    };
    expect(core.talkPlanLine(t)).toBe('When I feel lonely late at night, I will text someone and put the device out of reach.');
    expect(core.talkPlanLine({ ...t, mo: null, m: ['walk'] })).toBe('When I feel lonely, I will walk it off.');
  });

  it('keeps the feeling word on the saved plan, and the day page calls it a plan for next time', () => {
    const t = { ...core.newTalk(1000), p: 'change' as const, pr: 1 as const, n: 'close' as const, m: ['text'] as core.TalkMove[], mo: 'late', fw: 'Lonely' };
    expect(core.normTalk(t)!.fw).toBe('Lonely');
    expect(core.normTalk({ ...t, fw: '<x>' })).not.toHaveProperty('fw');
    expect(core.normTalk({ ...t, fw: undefined })).not.toHaveProperty('fw');
    const days = core.saveTalk(slipOn({}, K, 's1', '22:10'), K, t, 2000);
    expect(core.talksOf(days)[0].talk.fw).toBe('Lonely');
    const st = core.normSettings({ start: '2026-10-01' });
    expect(core.daySummary(days, st, K, K).more.map((x) => x.t)).toContain('Made a plan for next time');
  });
});

describe('the words', () => {
  it('are plain, with no contractions, and every situation and feeling afterwards has its words', () => {
    for (const w of Object.keys(core.TALK_WHEN) as core.TalkWhen[]) expect(core.SLIP_NEED[w]).toBeTruthy();
    for (const [id] of core.SLIP_NOW) expect(core.SLIP_NOW_SAYS[id].t.length).toBeGreaterThan(0);
    const all = [...Object.values(core.SLIP_NOW_SAYS).flatMap((x) => [x.h, x.t]), ...Object.values(core.TALK_WHEN)];
    for (const w of all) {
      expect(w).not.toMatch(noContractions);
      expect(w).not.toMatch(/—/);
      expect(w).not.toMatch(/\b(failed|failure|reset|start over|relapse)\b/i);
      /* like every care screen, the words never name the habit */
      expect(w).not.toMatch(/\bporn/i);
    }
  });
});

describe('the line under Rekindle once it is held', () => {
  it('is one plain line: what is still yours, with no contractions', () => {
    const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-01' });
    const days = slipOn({}, K, 's1', '22:10');
    const line = core.rkLitLine(days, st, {}, K, K);
    expect(line).toBe('Your 19 days are on your record, and everything you earned is still yours.');
    expect(line).not.toMatch(/for now/);
    expect(line.split('. ').length).toBe(1);
    expect(line).not.toMatch(noContractions);
  });
});

describe('the second slip in a week gets the most care', () => {
  const slip = (d: core.Days, k: string) => core.addEvent(d, k, 'slipped', '21:00');
  it('a first slip gets no line; another within seven days does', () => {
    const a = slip({}, '2026-10-10');
    expect(core.slipRepeat(a.days, '2026-10-10', a.id)).toBeNull();
    const b = slip(a.days, '2026-10-16');
    expect(core.slipRepeat(b.days, '2026-10-16', b.id)).toMatchObject({ n: 2, line: 'Two in a week is where most people give up. You are still here.' });
    const c = slip(a.days, '2026-10-17');
    expect(core.slipRepeat(c.days, '2026-10-17', c.id)).toBeNull();
  });
  it('a third says it without counting up', () => {
    const a = slip(slip({}, '2026-10-10').days, '2026-10-11');
    const b = slip(a.days, '2026-10-12');
    expect(core.slipRepeat(b.days, '2026-10-12', b.id)!.line).toBe('A week like this is where most people give up. You are still here.');
  });
  it('an urge ridden out does not count, and neither does an entry that is not there', () => {
    const a = core.addEvent(slip({}, '2026-10-10').days, '2026-10-11', 'rode', '21:00');
    expect(core.slipRepeat(a.days, '2026-10-11', a.id)).toBeNull();
    expect(core.slipRepeat(a.days, '2026-10-11', 'nope')).toBeNull();
  });
  it('the lesson it opens is there', () => {
    expect(core.lessonById(core.SLIP_THERAPY_LESSON)?.title).toBe('What therapy is like');
  });
});
