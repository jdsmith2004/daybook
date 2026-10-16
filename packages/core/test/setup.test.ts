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
        ? core.normSettings({ start: '2026-10-12', day1: '2026-10-19', rollover: 4, screensOff: '23:00', u: 1, reasons: ['Clear mornings and steady energy'], safePerson: 'Sam' })
        : core.normSettings({
            start: '2026-09-01', day1: '2026-09-08', rollover: 4, screensOff: '22:30', u: 1, cleanMode: 'gentle', reasons: ['Keeping my word to myself', 'Not carrying a secret'],
            plan: [{ when: "I'm in bed late at night", then: 'Read a book.' }],
            onb: { n: 1, at: 1, a: { aim: 'quit', freq: 'f2', faith: 'some', b0: '1' }, hist: [{ d: '2026-09-01', s: 4 }] },
          });
  const a = JSON.parse(JSON.stringify(f.a));
  const redo = !!st;
  const tk = f.tk;

  it('offers the same pages, goals, reasons and plans', () => {
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
    has(f.heard, h.h + ' ' + h.line + ' ' + moreText(h.more));
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
