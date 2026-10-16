/* Golden tests: @daybook/core must compute exactly what the legacy app computes, for every log and moment in test/fixtures.
   The fixtures come from running legacy/index.html itself (scripts/make-fixtures.mjs). If one of these fails, the port
   changed a rule. Fix the port, or if the rule was meant to change, change legacy/index.html and make the fixtures again. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Days, Reviews, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const J = <T>(x: T): T => JSON.parse(JSON.stringify(x));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'rekindle-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

/* the text inside the legacy HTML, with its escaping undone, so a string from the port can be looked for in it */
const unescape = (h: string) =>
  h.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const textOf = (h: string) => unescape(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

afterEach(() => vi.useRealTimers());

it('runs in the time zone the fixtures were made in', () => {
  expect(new Date(Date.UTC(2026, 9, 15, 12)).getHours()).toBe(7); // America/Chicago, CDT
});

describe.each(logs)('$name', (fx) => {
  const st: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => {
    if (core.isKey(k)) days[k] = core.normDay(fx.input.days[k], k);
  });
  const reviews: Reviews = {};
  Object.keys(fx.input.reviews).forEach((k) => (reviews[k] = core.normReview(fx.input.reviews[k], k)));

  it('words each entry the same way', () => {
    const e = fx.cases[0].expected;
    for (const k of Object.keys(e.rows)) {
      const rows = core.sortedEvents(days[k], st.rollover).map((x) => core.eventRow(x, st));
      rows.forEach((r, i) => {
        const html = textOf(e.rows[k][i]);
        expect(html).toContain(r.time);
        expect(html).toContain(r.what + (r.meta ? ' ' + r.meta : ''));
      });
    }
  });

  it('cleans up the log the same way', () => {
    const e = fx.cases[0].expected;
    expect(J(st)).toEqual(e.st);
    expect(J(days)).toEqual(e.days);
    expect(J(reviews)).toEqual(e.reviews);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Case = { now: number; expected: any; at: string };
  const cases: Case[] = fx.cases.map((c: Case) => ({ ...c, at: new Date(c.now).toString().slice(0, 21) }));
  describe.each(cases)(
    'at $at',
    ({ now, expected: e }: Case) => {
      const at = () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(now);
        return core.logicalKey(now, st.rollover);
      };

      it('knows what day it is, and where you are', () => {
        const tk = at();
        expect(tk).toBe(e.tk);
        expect(core.phaseLabel(tk, st)).toBe(e.phase);
      });

      it('counts runs, saves and clean days', () => {
        const tk = at();
        expect(J(core.runLedger(days, st, tk))).toEqual(e.ledger.def);
        expect(J(core.runLedger(days, st, tk, 'strict'))).toEqual(e.ledger.strict);
        expect(J(core.runLedger(days, st, tk, 'gentle'))).toEqual(e.ledger.gentle);
        expect(J(core.runLedger(days, st, tk, 'strict', true))).toEqual(e.ledger.noSave);
        expect(J(core.runLedger(days, st, tk, 'step'))).toEqual(e.ledger.step);
        expect(core.rkFullDays(days)).toEqual(e.full);
        expect(core.roughPatch(days, st, tk)).toBe(e.rough);
        for (const k of Object.keys(e.kinds)) expect(core.dayKind(k, days[k], st, tk)).toBe(e.kinds[k]);
      });

      it('works out step down', () => {
        at();
        expect(J(core.stepView(days, st, now))).toEqual(e.step);
        expect(core.slipMoments(days, st, now)).toEqual(e.slipMoments);
      });

      it('gives the same points, level, wins, quests and badges', () => {
        const tk = at();
        expect(J(core.gameCompute(days, st, reviews, tk))).toEqual(e.game);
        for (const k of Object.keys(e.dayPoints)) {
          expect(J(core.dayPoints(days, k, st))).toEqual(e.dayPoints[k]);
          expect(J(core.rkOf(days, k, st))).toEqual(e.rk[k]);
          expect(J(core.winsOf(days, k, st))).toEqual(e.wins[k]);
        }
      });

      it('lays out the day and the weeks the same way', () => {
        const tk = at();
        expect(J(core.rhythm(days, st, tk, now))).toEqual(e.rhythm);
        e.weeks.forEach((w: { stats: unknown; quests: unknown; slips: number }, i: number) => {
          expect(J(core.weekStats(days, st, i))).toEqual(w.stats);
          expect(J(core.questsFor(days, st, i))).toEqual(w.quests);
          expect(core.slipsInWeek(days, st, i)).toBe(w.slips);
        });
      });

      it('builds the Days card from the same numbers and words', () => {
        const tk = at();
        const v = core.cleanView(days, st, tk, now);
        expect(J(v)).toEqual(e.cleanView);
        const html = textOf(e.html.days);
        const t = core.daysCardText(days, st, v, tk);
        expect(html).toContain(t.eyebrow);
        if (t.tracking) {
          expect(html).toContain(t.facts.dl + ' ' + (t.facts.dl === 1 ? 'day logged' : 'days logged'));
        } else if (st.cleanMode !== 'step') {
          expect(html).toContain(t.good + ' ' + t.of);
          expect(html).toContain(t.sub);
          const ch = core.runChips(v);
          const sm = textOf(e.html.daysSm);
          expect(sm).toContain([ch.main.small, ch.main.text].filter(Boolean).join(' '));
          if (ch.main.saved) expect(sm).toContain('· ' + ch.main.saved + ' saved');
          if (ch.longest) expect(sm).toContain('Longest run ' + ch.longest);
          else expect(sm).not.toContain('Longest run');
          if (ch.next) expect(sm).toContain('Next goal ' + ch.next);
          else expect(sm).not.toContain('Next goal');
          if (ch.line) expect(sm).toContain(ch.line);
        }
      });

      it('builds the step-down card and the offer the same way', () => {
        const tk = at();
        expect(core.stepOffer(days, st, tk)).toBe(!!e.html.offer);
        if (!e.html.step) return;
        const c = core.stepCard(days, st, now);
        const html = textOf(e.html.step);
        expect(html).toContain(c.hero + ' ' + c.heroSub);
        expect(html).toContain(c.goalLine);
        expect(html).toContain(c.week.big + ' ' + c.week.text);
        expect(html).toContain(c.wait.big + ' ' + c.wait.text);
        expect(html).toContain(c.best.big + ' ' + c.best.text);
        expect(e.html.step).toContain(`<i style="width:${c.pct}%"></i>`);
        if (c.hh) expect(html).toContain(c.hh.text);
        if (c.hh?.won) expect(html).toContain(c.hh.won);
        if (c.ready) expect(html).toContain(c.ready);
        else expect(html).not.toContain('You are ready to count days');
        expect(html.includes('This is a strong pull')).toBe(c.help);
      });

      it('switches to step down by itself only when the legacy app would', () => {
        const tk = at();
        const want = st.cleanMode !== 'step' && st.cleanAuto !== false && !(st.cleanHold && tk < core.addDays(st.cleanHold, 14)) && e.rough;
        expect(core.shouldAutoStep(days, st, tk)).toBe(want);
      });
    },
  );
});

describe('the flame', () => {
  const legacy: string[] = JSON.parse(readFileSync(join(dir, 'emblem.json'), 'utf8'));
  it.each(legacy.map((svg, i) => ({ svg, level: i + 1 })))('level $level is drawn the same', ({ svg, level }) => {
    expect(core.sameIds(core.Em.emblem(level, { still: true, size: 120 }))).toBe(core.sameIds(svg));
    const x = core.emblemXml(level);
    expect(x.startsWith('<svg viewBox="0 0 120 120">')).toBe(true);
    expect(x).not.toMatch(/ class=| style=/);
  });
});

describe('setup', () => {
  const cases: { a: core.SetupAnswers; s: string }[] = JSON.parse(readFileSync(join(dir, 'setup.json'), 'utf8'));
  it('suggests the same goal for every set of answers', () => {
    for (const c of cases) expect(core.obSuggest(c.a), JSON.stringify(c.a)).toBe(c.s);
  });
});
