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
    /* the pages in order: the legacy gating, with the order changed by design on October 22 (three acts) */
    expect(core.obPages(a).map((p) => p.id)).toEqual(f.pages);
    expect(core.obPrefill(st)).toEqual(f.prefill);
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
    expect(got).toEqual(f.saved);
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
  it('"Quit for good" starts tomorrow, on a first try too; wanting to understand the pattern starts with a tracking week', () => {
    expect(core.obSuggest({ aim: 'quit', tried: 't0' })).toBe('now');
    expect(core.obSuggest({ aim: 'quit', tried: 't1' })).toBe('now');
    expect(core.obSuggest({ aim: 'learn', tried: 't0' })).toBe('week');
    expect(core.obSuggest({})).toBe('week');
  });
});

it('tells the setup as three acts, in one order', () => {
  expect(core.obPages({}).map((p) => p.id)).toEqual([
    ...'hello how aim years freq mins faith b0 b1 b2 b3 b4 heard costs when wave breathe loop person tour curve tried tries slip goal reasons ifthen so becoming review'.split(
      ' ',
    ),
    'done',
  ]);
  const ids = core.obPages({ freq: 'f2', mins: 'm1' }).map((p) => p.id);
  expect(ids.slice(ids.indexOf('costs'), ids.indexOf('when'))).toEqual(['costs', 'guess', 'hours']);
  expect(core.OB_SECS.map((x) => x[0])).toEqual(['you', 'hour', 'plan']);
  /* every page points at an act, and the acts run in order */
  const order = core.OB_SECS.map((x) => x[0]);
  const at = core.OB_PAGES.map((p) => order.indexOf(p.s));
  expect(at.every((n) => n >= 0)).toBe(true);
  expect(at).toEqual([...at].sort());
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

it('asks for a free account once the plan is built, only when the build has accounts and the person is not signed in', () => {
  expect(core.obPages({}).some((p) => p.id === 'account')).toBe(false);
  const ids = core.obPages({}, { account: true, notify: true }).map((p) => p.id);
  expect(ids.indexOf('account')).toBeGreaterThan(ids.indexOf('review'));
  expect(ids.indexOf('account')).toBe(ids.indexOf('done') - 1);
});
