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
    expect(core.feelPos('Ecstatic')).toEqual({ r: 0, c: 9 });
  });
});

describe('the pattern lines', () => {
  it('says nothing until there is a pattern, then counts the family over the last slips', () => {
    let days = slipOn({}, K, 's9', '22:10');
    expect(core.slipBeforeLine(days, 's9', 'fear')).toBeNull();
    days = slipOn(days, '2026-10-10', 'a', '21:00', { fb: 'Stressed' });
    expect(core.slipBeforeLine(days, 's9', 'fear')).toBe('Stress or worry came before both of your last 2 slips.');
    expect(core.slipBeforeLine(days, 's9', 'lonely')).toBe('This is new: your last slip came after something else.');
    days = slipOn(days, '2026-10-12', 'b', '21:00', { fb: 'Lonely' });
    days = slipOn(days, '2026-10-14', 'c', '21:00', { fb: 'Anxious' });
    expect(core.slipBeforeLine(days, 's9', 'fear')).toBe('Stress or worry came before 3 of your last 4 slips.');
  });

  it('shows how it felt afterwards before, only when it has happened before and never for okay', () => {
    let days = slipOn({}, K, 's9', '22:10');
    expect(core.slipNowLine(days, 's9', 'flat')).toBeNull();
    days = slipOn(days, '2026-10-10', 'a', '21:00', { fa: 'flat' });
    days = slipOn(days, '2026-10-12', 'b', '21:00', { fa: 'shame' });
    expect(core.slipNowLine(days, 's9', 'flat')).toBe('After 2 of your last 3 slips, you felt flat or empty.');
    expect(core.slipNowLine(days, 's9', 'okay')).toBeNull();
  });
});

describe('the plan for next time', () => {
  it('offers the family moves, early bed at night, the device out of reach, and what held first', () => {
    expect(core.slipMoves('lonely', false)).toEqual(['text', 'call', 'people', 'away']);
    expect(core.slipMoves('lonely', true)).toEqual(['text', 'call', 'bed', 'away']);
    /* going out is swapped for something that works at home late at night */
    expect(core.slipMoves('low', true)).toEqual(['text', 'shower', 'bed', 'away']);
    expect(core.slipMoves('bored', true)).toEqual(['hands', 'show', 'bed', 'away']);
    expect(core.slipMoves('tired', true)).toEqual(['bed', 'nap', 'shower', 'away']);
    expect(core.slipMoves('lonely', false, { people: { held: 2, n: 3 } })[0]).toBe('people');
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
  it('are plain, with no contractions, and every feeling family and feeling afterwards has its answer', () => {
    const fams: core.FeelFam[] = ['lonely', 'shame', 'anger', 'fear', 'bored', 'tired', 'low', 'bright', 'calm'];
    for (const f of fams) {
      expect(core.SLIP_ASKS[f].h.length).toBeGreaterThan(0);
      expect(core.SLIP_NEED[f]).toBeTruthy();
    }
    for (const [id] of core.SLIP_NOW) expect(core.SLIP_NOW_SAYS[id].t.length).toBeGreaterThan(0);
    const all = [...Object.values(core.SLIP_ASKS), ...Object.values(core.SLIP_NOW_SAYS)].flatMap((x) => [x.h, x.t]);
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
    expect(line).toMatch(/still yours\.$/);
    expect(line.split('. ').length).toBe(1);
    expect(line).not.toMatch(noContractions);
  });
});
