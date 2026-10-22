/* Opt-in counts: nothing while off, only the list's names, the bands, comebacks, setup, the batch and the server's check. */
import { describe, expect, it } from 'vitest';
import { addEvent } from '../src/mutate';
import { OB_PAGES } from '../src/setup';
import {
  feedbackClean,
  pulseAdd,
  pulseAnswer,
  pulseBand,
  pulseBatch,
  pulseClean,
  pulseKeys,
  pulseMeaning,
  pulseNew,
  pulseNorm,
  pulseOpened,
  pulseSent,
  pulseSetup,
  PULSE_MAX,
} from '../src/pulse';

const D0 = '2026-10-22';
const on = () => pulseAnswer(pulseNew(D0), true, D0);

describe('counting', () => {
  it('counts only names on the list, and never more than the cap', () => {
    let s = on();
    s = pulseAdd(s, 'sos', D0);
    s = pulseAdd(s, 'sos', D0);
    s = pulseAdd(s, 'tool_breathe', D0);
    s = pulseAdd(s, 'I felt lonely at 11 PM', D0);
    s = pulseAdd(s, 'tool_not-a-tool', D0);
    expect(s.days[D0]).toEqual({ sos: 2, tool_breathe: 1 });
    for (let i = 0; i < 80; i++) s = pulseAdd(s, 'checkin', D0);
    expect(s.days[D0].checkin).toBe(PULSE_MAX);
  });
  it('counts nothing while off, and No deletes what was kept', () => {
    let s = pulseNew(D0);
    s = pulseAdd(s, 'sos', D0);
    s = pulseSetup(s, 5);
    expect(s.days[D0]).toEqual({ sos: 1 });
    s = pulseAnswer(s, false, D0);
    expect(s.days).toEqual({});
    expect(s.setup.max).toBe(-1);
    expect(pulseAdd(s, 'sos', D0).days).toEqual({});
    expect(pulseOpened(s, {}, D0).days).toEqual({});
    expect(pulseBatch(s, '2026-10-25', 'ios', '1.0.0')).toBeNull();
  });
  it('sends nothing before the person says yes', () => {
    const s = pulseAdd(pulseNew(D0), 'sos', D0);
    expect(pulseBatch(s, '2026-10-25', 'ios', '1.0.0')).toBeNull();
    expect(pulseBatch(pulseAnswer(s, true, '2026-10-25'), '2026-10-25', 'ios', '1.0.0')!.days[0].c).toEqual({ sos: 1 });
  });
  it('every name has plain words for the privacy page', () => {
    for (const k of pulseKeys()) expect(pulseMeaning(k), k).not.toBe(k);
    expect(pulseMeaning('act_7_13')).toBe('Opened Daybook, 7 to 13 days after first opening it');
    expect(pulseMeaning('back_1')).toBe('Came back the next day after a slip');
    expect(pulseMeaning('setup_done')).toBe('Finished setup');
  });
});

describe('the bands', () => {
  it('days since first opened', () => {
    expect(pulseBand(D0, D0)).toBe('act_0');
    expect(pulseBand(D0, '2026-10-23')).toBe('act_1');
    expect(pulseBand(D0, '2026-10-28')).toBe('act_2_6');
    expect(pulseBand(D0, '2026-10-29')).toBe('act_7_13');
    expect(pulseBand(D0, '2026-11-05')).toBe('act_14_29');
    expect(pulseBand(D0, '2026-11-21')).toBe('act_30');
  });
  it('one active count a day, however often the app opens', () => {
    let s = pulseOpened(on(), {}, D0);
    s = pulseOpened(s, {}, D0);
    expect(s.days[D0]).toEqual({ act_0: 1 });
  });
  it('a comeback after a slip is counted once, in its band', () => {
    const log = addEvent({}, '2026-10-24', 'slipped', '23:00').days;
    let s = pulseOpened(on(), log, '2026-10-24');
    expect(s.days['2026-10-24']).toEqual({ act_2_6: 1 });
    s = pulseOpened(s, log, '2026-10-25');
    expect(s.days['2026-10-25']).toEqual({ act_2_6: 1, back_1: 1 });
    s = pulseOpened(s, log, '2026-10-26');
    expect(s.days['2026-10-26']).toEqual({ act_2_6: 1 });
    const later = pulseOpened(on(), log, '2026-10-30');
    expect(later.days['2026-10-30']).toEqual({ act_7_13: 1, back_4_7: 1 });
  });
  it('a slip from before Daybook was opened here is not a comeback', () => {
    const log = addEvent({}, '2026-10-01', 'slipped', '23:00').days;
    expect(pulseOpened(on(), log, D0).days[D0]).toEqual({ act_0: 1 });
  });
});

describe('sending', () => {
  it('sends the days that are over, with setup once, and lets them go', () => {
    let s = pulseNew(D0);
    s = pulseSetup(s, 3);
    s = pulseSetup(s, 1);
    s = pulseSetup(s, OB_PAGES.length - 1, true);
    s = pulseAdd(pulseOpened(s, {}, D0), 'sos', D0);
    s = pulseAnswer(s, true, D0);
    s = pulseAdd(s, 'sos', '2026-10-23');
    expect(pulseBatch(s, D0, 'ios', '1.0.0')).toBeNull();
    const b = pulseBatch(s, '2026-10-23', 'ios', '1.0.0')!;
    const pages = Object.fromEntries(OB_PAGES.map((p) => ['setup_' + p.id, 1]));
    expect(b).toEqual({ p: 'ios', v: '1.0.0', days: [{ d: D0, c: { act_0: 1, sos: 1, ...pages, setup_done: 1 } }] });
    s = pulseSent(s, b);
    expect(Object.keys(s.days)).toEqual(['2026-10-23']);
    expect(s.last).toEqual(b);
    const b2 = pulseBatch(s, '2026-10-24', 'ios', '1.0.0')!;
    expect(b2.days).toEqual([{ d: '2026-10-23', c: { sos: 1 } }]);
  });
  it('a batch holds only names and small numbers: no words, times, triggers or ids', () => {
    let s = on();
    for (const k of ['sos', 'tool_breathe', 'slip_logged', 'back_1']) s = pulseAdd(s, k, D0);
    const b = pulseBatch(s, '2026-10-23', 'web', '1.0.0')!;
    const text = JSON.stringify(b);
    expect(Object.keys(b).sort()).toEqual(['days', 'p', 'v']);
    for (const row of b.days) for (const [k, n] of Object.entries(row.c)) expect(pulseKeys().has(k) && Number.isInteger(n)).toBe(true);
    expect(text).not.toMatch(/\d{1,2}:\d{2}|@|"id"|"t"/);
  });
  it('setup pages are each sent once, so the totals make a funnel', () => {
    let s = pulseAnswer(pulseSetup(pulseNew(D0), 2), true, D0);
    s = pulseAdd(s, 'sos', D0);
    let b = pulseBatch(s, '2026-10-23', 'web', '1')!;
    expect(Object.keys(b.days[0].c).filter((k) => k.startsWith('setup_'))).toEqual(OB_PAGES.slice(0, 3).map((p) => 'setup_' + p.id));
    s = pulseAdd(pulseSetup(pulseSent(s, b), 4), 'sos', '2026-10-23');
    b = pulseBatch(s, '2026-10-24', 'web', '1')!;
    expect(Object.keys(b.days[0].c).filter((k) => k.startsWith('setup_'))).toEqual(OB_PAGES.slice(3, 5).map((p) => 'setup_' + p.id));
  });
  it('reading back a broken state starts fresh', () => {
    expect(pulseNorm(null, D0)).toEqual(pulseNew(D0));
    const s = pulseNorm({ on: true, first: D0, days: { [D0]: { sos: 3, made_up: 9 }, bad: { sos: 1 } } }, D0);
    expect(s.days).toEqual({ [D0]: { sos: 3 } });
    expect(pulseNorm({ on: true, first: D0, days: { '2026-09-01': { sos: 1 } } }, D0).days).toEqual({});
  });
});

describe('the server check', () => {
  it('keeps known names and whole numbers in range, for recent days only', () => {
    const b = pulseClean(
      {
        p: 'ios',
        v: '1.0.0',
        uid: 'someone',
        days: [
          { d: '2026-10-21', c: { sos: 2, made_up: 1, checkin: 1.5, morning: -1, sunrise: 999 }, note: 'hi' },
          { d: '2026-01-01', c: { sos: 1 } },
          { d: '2026-10-21', c: { sos: 1 } },
          { d: '2026-12-01', c: { sos: 1 } },
        ],
      },
      D0,
    );
    expect(b).toEqual({ p: 'ios', v: '1.0.0', days: [{ d: '2026-10-21', c: { sos: 2, sunrise: PULSE_MAX } }] });
    expect(pulseClean({ p: 'mac', v: '1', days: [{ d: D0, c: { sos: 1 } }] }, D0)).toBeNull();
    expect(pulseClean({ p: 'web', days: [{ d: D0, c: { made_up: 1 } }] }, D0)).toBeNull();
    expect(pulseClean('nope', D0)).toBeNull();
  });
  it('feedback: the words, and a reply address only if it is one', () => {
    expect(feedbackClean({ t: '  It helped last night.  ', r: 'me@example.com', p: 'ios', v: '1.0.0' })).toEqual({
      t: 'It helped last night.',
      r: 'me@example.com',
      p: 'ios',
      v: '1.0.0',
    });
    expect(feedbackClean({ t: 'x', r: 'not an address' })!.r).toBeNull();
    expect(feedbackClean({ t: '   ' })).toBeNull();
    expect(feedbackClean({ t: 'a'.repeat(5000) })!.t).toHaveLength(2000);
  });
});

describe('the ask and the summary', () => {
  it('asks from day two, in the daytime, on a calm day, beside no other ask', async () => {
    const { pulseAsk } = await import('../src/pulse');
    const s = pulseNew(D0);
    const tk = '2026-10-23';
    expect(pulseAsk(s, {}, tk, 12, false, false)).toBe(true);
    expect(pulseAsk(s, {}, D0, 12, false, false)).toBe(false);
    expect(pulseAsk(s, {}, tk, 22, false, false)).toBe(false);
    expect(pulseAsk(s, {}, tk, 12, true, false)).toBe(false);
    expect(pulseAsk(s, {}, tk, 12, false, true)).toBe(false);
    expect(pulseAsk(s, addEvent({}, D0, 'slipped', '23:00').days, tk, 12, false, false)).toBe(false);
    expect(pulseAsk(pulseAnswer(s, false, D0), {}, tk, 12, false, false)).toBe(false);
    expect(pulseAsk(on(), {}, tk, 12, false, false)).toBe(false);
  });
  it('adds up the totals for the Stats page', async () => {
    const { pulseSummary } = await import('../src/pulse');
    const sum = pulseSummary(
      [
        { k: '2026-10-20#ios', n: { batches: 3, sos: 4, act_1: 2, back_1: 1, slip_logged: 2, setup_hello: 3, setup_done: 1, tool_breathe: 2 } },
        { k: '2026-10-21#web', n: { batches: 1, sos: 1, back_2_3: 1 } },
        { k: '2026-10-21#v#1.0.0', n: { batches: 4 } },
        { k: '2026-09-01#ios', n: { batches: 9, sos: 9 } },
      ],
      '2026-10-01',
      '2026-10-22',
    );
    expect(sum.platforms).toEqual([
      ['ios', 3],
      ['web', 1],
    ]);
    expect(sum.versions).toEqual([['1.0.0', 4]]);
    expect(sum.used).toEqual([
      ['sos', 5],
      ['tool_breathe', 2],
    ]);
    expect(sum.back.slice(0, 2)).toEqual([
      ['back_1', 1],
      ['back_2_3', 1],
    ]);
    expect(sum.slips).toBe(2);
    expect(sum.setup[0]).toEqual(['setup_hello', 3]);
    expect(sum.setup[sum.setup.length - 1]).toEqual(['setup_done', 1]);
  });
});

it('the privacy page lists every name a count can have', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../../../apps/mobile/public/privacy.html', import.meta.url), 'utf8');
  for (const k of pulseKeys()) {
    const name = k.startsWith('tool_') ? k.slice(5) : k.startsWith('setup_') && k !== 'setup_done' ? k.slice(6) : k;
    expect(html.includes(k.startsWith('tool_') || (k.startsWith('setup_') && k !== 'setup_done') ? name : '<code>' + k + '</code>'), k).toBe(true);
  }
});
