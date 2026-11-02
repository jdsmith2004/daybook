/* The Sunday review fits the week the person had: each kind of week is named in plain numbers, a hard week is never waved
   off with "one missed day barely matters", and every week ends with one step drawn from the person's own log. */
import { describe, expect, it } from 'vitest';
import { normSettings } from '../src/legacy/core.js';
import { addEvent } from '../src/mutate';
import { story, storyTeach } from '../src/sunday-story';
import type { Days } from '../src/types';

/* 2026-10-12 is a Monday, 2026-10-18 a Sunday */
const MON = '2026-10-12';
const SUN = '2026-10-18';
const FRI = '2026-10-16';
const st = normSettings({ start: '2026-08-01', day1: '2026-08-08', safePerson: 'Sam Lee' });
const at = (k: string, t: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10), +t.slice(0, 2), +t.slice(3, 5)).getTime();
const day = (n: number) => {
  const d = new Date(2026, 9, 12 + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
type E = [string, 'rode' | 'slipped', string, Record<string, unknown>?];
const log = (es: E[], d: Days = {}) => es.reduce((x, [k, o, t, more]) => addEvent(x, k, o, t, more || {}, 1).days, d);
/* the week as the review reads it, on Sunday night or (for a week so far) on Friday */
const read = (d: Days, tk = SUN, s = st) => story(d, s, {}, SUN, tk, at(tk, '23:59'), {});

describe('the kind of week, named honestly', () => {
  it('never says one missed day barely matters on a week with a slip on 4 of 5 days', () => {
    const d = log([0, 1, 2, 3].map((i): E => [day(i), 'slipped', '23:10']));
    const x = read(d, FRI);
    expect(x.read.kind).toBe('most');
    expect(x.read.says).toBe('4 of 5 days had a slip. A hard week.');
    const t = storyTeach('days', { kind: x.read.kind })!;
    expect(t.t).not.toMatch(/one missed day|single day|one slip/i);
    expect(t.l).not.toBe('l21');
    expect(storyTeach('slips', { kind: x.read.kind })!.t).not.toMatch(/one slip stays one slip/);
    expect(x.read.title).toBe('One thing to change');
  });
  it('a week with a slip every day says so, and what held', () => {
    const d = log([...[0, 1, 2, 3, 4, 5, 6].map((i): E => [day(i), 'slipped', '13:00']), [day(2), 'rode', '20:00']]);
    const x = read(d);
    expect(x.read.kind).toBe('all');
    expect(x.read.says).toBe('Every day this week had a slip.');
    expect(x.read.held).toBe('And you rode out 1 urge. That skill is real, and next week can be different.');
  });
  it('a week one day old, with a slip on it, reads plainly', () => {
    const x = read(log([[MON, 'slipped', '13:00']]), MON);
    expect(x.read.kind).toBe('all');
    expect(x.read.says).toBe('The one day so far had a slip.');
  });
  it('one slip is named as one, and the other days count', () => {
    const d = log([
      ['2026-10-09', 'slipped', '22:00'],
      [day(2), 'slipped', '22:00'],
    ]);
    const x = read(d);
    expect(x.read.kind).toBe('one');
    expect(x.read.says).toBe('1 of 7 days had a slip. The other 6 did not.');
    expect(x.read.held).toBe('One slip is one event, not the week.');
    expect(storyTeach('days', { kind: 'one' })!.l).toBe('l21');
  });
  it('the first slip after a long stretch keeps the stretch', () => {
    const d = log([
      ['2026-09-20', 'slipped', '22:00'],
      [day(2), 'slipped', '22:00'],
    ]);
    const x = read(d);
    expect(x.read.kind).toBe('after');
    expect(x.read.gap).toBe(24);
    expect(x.read.says).toBe('1 of 7 days had a slip, the first in 24 days.');
    expect(x.read.held).toBe('Those 24 days happened, and nothing takes them back.');
  });
  it('two slips after a long stretch are named as two, never as one missed day', () => {
    const d = log([
      ['2026-09-20', 'slipped', '22:00'],
      [day(0), 'slipped', '22:00'],
      [day(5), 'slipped', '22:00'],
    ]);
    const x = read(d);
    expect(x.read.kind).toBe('few');
    expect(x.read.says).toBe('2 of 7 days had a slip, and 5 did not.');
    expect(storyTeach('days', { kind: x.read.kind })!.t).not.toMatch(/one missed day/i);
  });
  it('a few slip days, better than last week', () => {
    const d = log([
      ...[0, 1, 2, 3, 4].map((i): E => ['2026-10-0' + (5 + i), 'slipped', '12:00']),
      [day(0), 'slipped', '12:00'],
      [day(3), 'slipped', '12:00'],
      [day(5), 'slipped', '12:00'],
    ]);
    const x = read(d);
    expect(x.read.kind).toBe('few');
    expect(x.read.vs).toBe('better');
    expect(x.read.says).toBe('3 of 7 days had a slip, and 4 did not.');
    expect(x.read.held).toBe('Down from 5 last week. That is the direction.');
  });
  it('a few slip days, harder than last week, points to the step', () => {
    const d = log([
      ['2026-10-07', 'slipped', '12:00'],
      [day(0), 'slipped', '12:00'],
      [day(3), 'slipped', '12:00'],
      [day(5), 'slipped', '12:00'],
    ]);
    const x = read(d);
    expect(x.read.vs).toBe('worse');
    expect(x.read.held).toBe('Up from 1 last week. Next week gets one clear change.');
  });
  it('most days, but fewer than last week, says that first', () => {
    const d = log([
      ...[0, 1, 2, 3, 4, 5, 6].map((i): E => ['2026-10-' + String(5 + i).padStart(2, '0'), 'slipped', '12:00']),
      ...[0, 1, 2, 3].map((i): E => [day(i), 'slipped', '12:00']),
    ]);
    expect(read(d).read.held).toBe('Still fewer than last week’s 7. Keep going.');
  });
  it('a week with many urges ridden out says so', () => {
    const d = log([['2026-10-09', 'slipped', '22:00'], [day(2), 'slipped', '22:00'], ...[0, 1, 3, 4, 5].map((i): E => [day(i), 'rode', '15:00'])]);
    expect(read(d).read.held).toBe('You rode out 5 urges too.');
  });
  it('a clean week, and a clean first week', () => {
    const d = log([0, 2, 4].map((i): E => [day(i), 'rode', '15:00']));
    const x = read(d);
    expect(x.read.kind).toBe('clean');
    expect(x.read.says).toBe('Not one slip all week.');
    expect(x.read.held).toBe('You rode out 3 urges to get here.');
    expect(x.read.title).toBe('Keep what worked');
    expect(x.read.step.line).toBe('When an urge hits, open SOS and breathe.');
    const fresh = normSettings({ start: MON });
    const y = read(log([[day(1), 'rode', '15:00']]), SUN, fresh);
    expect(y.read.first).toBe(true);
    expect(y.read.held).toBe('Your first week, and it is clean.');
  });
  it('a first week with slips most days is the start of the pattern, not a verdict', () => {
    const fresh = normSettings({ start: MON });
    const x = read(log([0, 1, 2, 3, 4].map((i): E => [day(i), 'slipped', '13:00'])), SUN, fresh);
    expect(x.read.kind).toBe('most');
    expect(x.read.held).toBe('Your first week, logged honestly. Now you can see the pattern, and that is where change starts.');
  });
  it('a week with almost nothing logged is quiet, not clean', () => {
    const x = read({});
    expect(x.read.kind).toBe('quiet');
    expect(x.read.says).toBe('No slips logged, and not much else.');
    expect(x.read.step.c).toBe('checkin');
    expect(x.deep.id).toBe('review');
  });
  it('speaks plainly: no contractions, no shame words', () => {
    const weeks = [
      log([0, 1, 2, 3].map((i): E => [day(i), 'slipped', '23:10'])),
      log([0, 1, 2, 3, 4, 5, 6].map((i): E => [day(i), 'slipped', '13:00'])),
      log([[day(2), 'slipped', '22:00']]),
      {},
    ];
    for (const d of weeks) {
      const r = read(d).read;
      for (const t of [r.says, r.held, r.title, r.step.line, ...r.step.why]) {
        expect(t).not.toMatch(/n’t|n't|’re|’ll|’ve|'re|'ll|'ve/);
        expect(t).not.toMatch(/fail|reset|blew|ruin|start over|back to zero/i);
      }
    }
  });
});

describe('one step for next week, from their own pattern', () => {
  it('late slips: the hard hour, and the phone in another room', () => {
    const d = log([0, 1, 2, 3].map((i): E => [day(i), 'slipped', '22:10']));
    const s = read(d).read.step;
    expect(s.w).toBe('it gets to 10 PM');
    expect(s.t).toBe('put my phone in another room');
    expect(s.line).toBe('When it gets to 10 PM, put your phone in another room.');
    expect(s.why).toEqual(['All 4 slips this week came between 10 PM and midnight.']);
    expect(s.c).toBe('late');
  });
  it('what set the slips off, and the tool that worked', () => {
    const d = log([
      [day(0), 'slipped', '09:00', { trigger: 'stress' }],
      [day(1), 'slipped', '13:00', { trigger: 'stress' }],
      [day(2), 'slipped', '18:00', { trigger: 'stress' }],
      [day(3), 'rode', '07:00', { tr: [['breathe', 'p']] }],
      [day(4), 'rode', '11:00', { tr: [['breathe', 'p']] }],
    ]);
    const s = read(d).read.step;
    expect(s.line).toBe('When you feel stressed, open SOS and start Breathe.');
    expect(s.why).toEqual(['Feeling stressed or anxious came before all 3 slips this week.', 'Breathe worked both times you used it.']);
    expect(s.c).toBe('trig:stress');
  });
  it('lonely: a person, by name', () => {
    const d = log([
      [day(1), 'slipped', '09:00', { trigger: 'lonely' }],
      [day(4), 'slipped', '15:00', { trigger: 'lonely' }],
    ]);
    const s = read(d).read.step;
    expect(s.line).toBe('When you feel lonely or low, text Sam.');
    expect(s.t).toBe('text Sam');
  });
  it('the weekend, when that is where the slips came', () => {
    const d = log([
      [day(5), 'slipped', '12:00'],
      [day(6), 'slipped', '17:00'],
    ]);
    expect(read(d).read.step.line).toBe('When the weekend comes, plan your day the night before.');
  });
  it('with nothing to go on, a move that works for most people', () => {
    const d = log([[day(2), 'rode', '15:00']]);
    const s = read(d).read.step;
    expect(s.line).toBe('When an urge hits, open SOS and breathe.');
    expect(s.why.length).toBe(1);
  });
  it('ends every review with the step', () => {
    expect(read({}).screens.slice(-2)).toEqual(['deep', 'next']);
  });
});
