/* The setup against the legacy app: the pages, the goals, the reasons and plans offered, the changes it would make, the settings
   it saves, and the words on the pages that answer what was said. Fixtures: test/fixtures/setup-flow.json. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flow: any[] = JSON.parse(readFileSync(join(dir, 'setup-flow.json'), 'utf8'));
const sq = (s: string) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const has = (hay: string, needle: string) => expect(sq(hay).replace(/ /g, '')).toContain(sq(needle).replace(/ /g, ''));
const moreText = (m?: { label: string; paras: string[]; keys: string[] }) =>
  m ? m.label + ' ' + m.paras.join(' ') + ' ' + m.keys.map((k) => (core.obSrc(k) || [''])[0]).join(' ') : '';

afterEach(() => vi.useRealTimers());

describe.each(flow.map((f, i) => ({ ...f, i })))('setup $i: $name', (f) => {
  const st: Settings | null =
    f.name === 'new'
      ? null
      : f.name === 'before'
        ? core.normSettings({
            start: '2026-10-12',
            day1: '2026-10-19',
            rollover: 4,
            screensOff: '23:00',
            u: 1,
            reasons: ['Clear mornings and steady energy'],
            safePerson: 'Sam',
          })
        : core.normSettings({
            start: '2026-09-01',
            day1: '2026-09-08',
            rollover: 4,
            screensOff: '22:30',
            u: 1,
            cleanMode: 'gentle',
            reasons: ['Keeping my word to myself', 'Not carrying a secret'],
            plan: [{ when: "I'm in bed late at night", then: 'Read a book.' }],
            onb: { n: 1, at: 1, a: { aim: 'quit', freq: 'f2', faith: 'some', b0: '1' }, hist: [{ d: '2026-09-01', s: 4 }] },
          });
  const a = JSON.parse(JSON.stringify(f.a));
  const redo = !!st;
  const tk = f.tk;

  it('offers the same pages, goals, reasons and plans', () => {
    /* the pages are no longer the legacy ones: setup became the short one on November 12, 2026 (WP10, the owner's D4); they
       are checked below. What each page offers and saves is still the legacy rule. The prefill also reads back "who it is
       for" from the reasons (new), which the record does not have. */
    const pre = core.obPrefill(st);
    delete pre.for;
    expect(pre).toEqual(f.prefill);
    expect(core.obGoals(st, tk).map((g) => [g.id, g.t, g.s, g.goal])).toEqual(f.goals);
    expect(core.obSug(a, st, tk)).toBe(f.sug);
    expect(core.obGoal(a, st, tk).id).toBe(f.goal);
    expect(core.obReasonOpts(a, st, redo)).toEqual(f.reasonOpts);
    expect(core.obReasonList(a)).toEqual(f.reasonList);
    expect(core.obThenOpts(a, st, redo, f.top)).toEqual(f.thenOpts);
    expect(core.obThenPick(a, st, redo, f.top)).toBe(f.thenPick);
  });

  it('finds the same changes, and saves the same settings', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(tk + 'T12:00:00-05:00'));
    expect(core.obChanges(a, st, tk).map((c) => [c.k, c.l, c.from, c.to, c.sub0 || '', c.sub1 || ''])).toEqual(f.changes);
    const all = core.obChanges(a, st, tk).map((c) => c.k);
    const r = core.obSave(a, st, all, tk, 0);
    const got = JSON.parse(JSON.stringify(r.st));
    delete got.u;
    /* since November 12, 2026 a new person starts on the two-moment day (two-moments.ts freshSettings, WP5): no evening check-in and
       no "How are you feeling today?". The frozen record is the legacy app's, so a new person's saved settings differ by those two. */
    const want = st ? f.saved : { ...f.saved, routine: { ...f.saved.routine, checkin: false }, dayFeel: false };
    expect(got).toEqual(want);
    expect(r.changed).toBe(f.changes.length);
  });

  it('says the same words', () => {
    const h = core.obHeard(a);
    /* the second line and the sources of "far from the only one" were their own page in the legacy app (now folded in) */
    const own = h.more && {
      ...h.more,
      paras: h.more.paras.slice(0, h.more.paras.length - 2),
      keys: h.more.keys.filter((k) => !['dickenson', 'grubbs19', 'antons'].includes(k)),
    };
    has(f.heard, h.h + ' ' + h.line + ' ' + (own && own.keys.length ? moreText(own) : ''));
    expect(h.line2).toContain('1 in 10 men');
    expect(h.more!.keys).toEqual(expect.arrayContaining(['dickenson', 'grubbs19', 'antons']));
    const t = core.obTries(a);
    has(f.tries, t.h + ' ' + t.line + ' ' + moreText(t.more));
    const gi = core.obGoalInfo(a, st, tk);
    has(f.goalInfo, gi.soft + ' ' + moreText(gi.more));
    const so = core.obSosLine(a);
    has(f.sos, so.when + ' ' + so.tool.name + ' ' + so.tool.desc);
    has(f.sos, so.line);
    [null, 25, 200, 800].forEach((g, k) => {
      if (!f.reveal.length) return;
      const R = core.obReveal(a, g);
      has(f.reveal[k], R.yr.toLocaleString('en-US') + ' hours a year at your pace ' + R.h);
      R.rows.forEach((x) => has(f.reveal[k], x[1]));
      has(f.reveal[k], R.soft + ' ' + moreText(R.more));
    });
    if (!redo) {
      const goal = core.obGoal(a, st, tk);
      has(f.done, 'Welcome in. ' + core.obFirst(goal.id, f.saved.screensOff) + ' +' + core.SETUP_PTS + ' points');
      has(f.review, 'Day 1 ' + core.obDate(core.obDay1(goal, null, tk)) + ' Goal ' + goal.t);
    }
  });
});

describe('the goal it suggests', () => {
  it('is still the legacy rule for a walk-through; a new person no longer gets a goal page (obBegin)', () => {
    expect(core.obSuggest({ aim: 'quit', tried: 't0' })).toBe('week');
    expect(core.obSuggest({ aim: 'nights' })).toBe('nights');
    expect(core.obGoal({ aim: 'quit', goal: 'now' }, null, '2026-11-02' as core.DayKey).id).toBe('now');
  });
});

describe('setup in two minutes (WP10)', () => {
  it('asks a new person a few things, sets tonight, lights the flame, then asks for the account', () => {
    expect(core.obPages({}).map((p) => p.id)).toEqual(['habit', 'freq', 'when', 'breathe', 'promise', 'for', 'faith', 'tonight', 'light']);
    expect(core.obPages({ faith: 'big' }, { account: true }).map((p) => p.id)).toEqual(
      'habit freq when breathe promise for faith creed tonight light account'.split(' '),
    );
    expect(core.obPages({}, { redo: true })[0].id).toBe('hello');
  });
  it('asks the phone-down time only of people quitting porn (the owner, via WP3)', () => {
    for (const habit of ['alcohol', 'gambling', 'other']) {
      expect(core.obPages({ habit }).map((p) => p.id)).not.toContain('tonight');
      expect(core.obPromise({ habit, when: ['late'] }).rows[0][1]).not.toMatch(/night|phone/i);
      const st = core.obBegin({ habit, when: ['late', 'scroll'] }, '2026-11-12' as core.DayKey, 0);
      for (const t of core.obPlanLine(st).opts) expect(t).not.toMatch(/phone|bed/i);
    }
    expect(core.obPages({ habit: 'porn' }).map((p) => p.id)).toContain('tonight');
  });
  it('asks the same questions on a walk-through, then the changes to keep', () => {
    expect(core.obPages({}, { redo: true, account: true }).map((p) => p.id)).toEqual(['hello', 'habit', 'freq', 'when', 'for', 'faith', 'review', 'done']);
  });
  it('starts counting tonight, counts how often says, and keeps who it is for as reasons', () => {
    const tk = '2026-11-12' as core.DayKey;
    const st = core.obBegin({ habit: 'alcohol', freq: 'f3', when: ['late'], for: ['love', 'health'], faith: 'no', first: 3 }, tk, 0);
    expect(st.day1).toBe(tk);
    expect(st.start).toBe(tk);
    expect(st.fw).toBe(tk);
    expect(st.fwGoal).toBe(3);
    expect(st.cleanMode).toBe('step');
    expect(st.stepAt).toBe(tk);
    expect(st.goal).toBe('Quit drinking. Log honestly, slips included.');
    expect(st.reasons).toEqual(['Being fully present with the people I love', 'Clear mornings and steady energy']);
    expect(st.screensOff).toBe('22:30');
    expect(st.onb!.n).toBe(1);
    expect(st.onb!.a.habit).toBe('alcohol');
    /* "how free do you see yourself" waits for day 30, not the first morning */
    for (const n of [0, 1, 7, 29]) expect(core.freeDue({}, st, core.addDays(tk, n) as core.DayKey, null), 'day ' + n).toBe(false);
    expect(core.freeDue({}, st, core.addDays(tk, 30) as core.DayKey, null)).toBe(true);
    /* the record reads the same after the settings are cleaned */
    const again = core.normSettings(JSON.parse(JSON.stringify(st)));
    expect(again.fw).toBe(tk);
    expect(again.day1).toBe(tk);
  });
  it('gives a person who skipped everything a calm start: gentle, Day 1 today, eleven at night', () => {
    const tk = '2026-11-12' as core.DayKey;
    const st = core.obBegin({}, tk, 0);
    expect(st.day1).toBe(tk);
    expect(st.cleanMode).toBe('gentle');
    expect(st.screensOff).toBe('23:00');
    expect(st.goal).toBe('Quit porn. Log honestly, slips included.');
    expect(st.fwGoal).toBeUndefined();
  });
  it('reads back what was said, with hope, on the page that is the heart of setup', () => {
    const p = core.obPromise({ freq: 'f3', when: ['late'] });
    expect(p.rows).toHaveLength(3);
    expect(p.rows[0][1]).toContain('Tonight, we get there first');
    expect(p.say).toContain('free');
  });
});

it("names the person's hardest moment on the wave page", () => {
  const w = (when: string[]) => core.obWave({ when }).h;
  expect(w(['late'])).toBe('Late at night, in bed, an urge rises, peaks, and passes.');
  expect(w(['bored'])).toBe('Bored and alone at home, an urge rises, peaks, and passes.');
  expect(w(['stress'])).toBe('Stressed and wound up, an urge rises, peaks, and passes.');
  expect(w(['lonely'])).toBe('Lonely or low, an urge rises, peaks, and passes.');
  expect(w(['tired'])).toBe('Tired at the end of the day, an urge rises, peaks, and passes.');
  expect(w(['scroll'])).toBe('Scrolling your phone, an urge rises, peaks, and passes.');
  expect(core.obWave({}).h).toBe('Urges rise, peak, and pass.');
});
