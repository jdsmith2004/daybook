/* Rekindle, checked against the legacy app: which Rekindle a slip gets, the card on Today, the short and full screens' words,
   and the sunrise plans. The legacy screens are HTML, so the port's words are looked for in their text. */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';
import type { Days, Reviews, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const J = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const norm = (s: string) => s.replace(/\s+/g, ' ');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'rekindle-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

afterEach(() => vi.useRealTimers());

describe('the Rekindle words match the legacy app', () => {
  const w = JSON.parse(readFileSync(join(dir, 'rekindle-words.json'), 'utf8'));
  it('cards, choices and prompts', () => {
    expect(J(core.RK_CARDS)).toEqual(w.RK_CARDS);
    expect(core.RK_WAIT).toEqual(w.RK_WAIT);
    expect(core.RT_Q).toEqual(w.RT_Q);
    expect(core.SR_GENERIC).toEqual(w.SR_GENERIC);
    expect([...core.RK_STEPS]).toEqual(w.RK_STEPS);
  });
  it('the message to a safe person', () => {
    ['', 'Sam', 'Alexander Hamilton the Third'].forEach((n, i) => {
      expect(core.rkTellText(core.normSettings({ start: '2026-10-01', safePerson: n }))).toBe(w.tell[i]);
    });
  });
  it('"next time ..." for each hard moment', () => {
    const st = core.normSettings({ start: '2026-10-01', opts: { trig: [{ id: 'u_work', t: 'Work stress' }], did: [] } });
    for (const [t, want] of w.when) expect(core.srWhen(t, st)).toBe(want);
  });
  it('plans in lower case', () => {
    for (const [x, want] of w.lower) expect(core.lowerFirst(x)).toBe(want);
  });
});

describe.each(logs)('$name', (fx) => {
  const st: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => {
    if (core.isKey(k)) days[k] = core.normDay(fx.input.days[k], k);
  });
  const reviews: Reviews = {};
  Object.keys(fx.input.reviews).forEach((k) => (reviews[k] = core.normReview(fx.input.reviews[k], k)));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Case = { now: number; expected: any; at: string };
  const cases: Case[] = fx.cases.map((c: Case) => ({ ...c, at: new Date(c.now).toString().slice(0, 21) }));

  describe.each(cases)('at $at', ({ now, expected: e }: Case) => {
    const at = () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(now);
      return core.logicalKey(now, st.rollover);
    };
    const R = e.rekindle;

    it('gives each slip the same Rekindle, and the same card on Today', () => {
      const tk = at();
      for (const k of Object.keys(R.steps)) expect(core.rkStepFor(days, k)).toBe(R.steps[k]);
      const act = core.rkActive(days, st, tk);
      expect(J(act)).toEqual(R.active);
      if (!act) return;
      const html = R.card.text;
      const c = core.rkCard(days, st, tk, act, new Date(now).getHours());
      expect(html).toContain(c.h);
      expect(html).toContain(c.p);
      if (c.why) expect(html).toContain(c.why);
      for (const m of c.missions) {
        expect(html).toContain(m.title);
        expect(html).toContain(m.sub);
        for (const a of m.actions) expect(html).toContain(a.label);
      }
      if (c.quote) expect(html).toContain(`If ${c.quote.when}, then ${c.quote.then}`);
      for (const t of c.care) expect(html).toContain(t);
      expect(html.includes('Start my sunrise check')).toBe(c.sunrise);
      expect(R.card.flames).toBe(`${c.flames.filter(Boolean).length} of ${c.flames.length} flames lit`);
      expect(R.card.line).toBe(c.line);
    });

    it('words the short Rekindle and the quest the same way', () => {
      const tk = at();
      const hour = new Date(now).getHours();
      for (const k of Object.keys(R.light)) {
        const ev = days[k].events.find((x) => x.id === R.ev[k])!;
        expect(norm(R.light[k].text)).toContain(norm(core.rkLightLine(days, st, k, tk, now)));
        expect(R.light[k].text).toContain('Saved · ' + core.entryLabel(ev));
        const q = core.rkQuest(days, st, tk, k, ev, hour);
        const qh = R.quest[k].text;
        expect(qh).toContain(q.h);
        expect(qh).toContain(q.p);
        expect(qh).toContain(q.prize.b);
        expect(qh).toContain(q.prize.s);
        expect(qh).toContain(q.done);
        expect(qh.includes('Did you wait first?')).toBe(q.askWait);
        for (const m of q.missions) {
          expect(qh).toContain(m.title);
          expect(qh).toContain(m.sub);
        }
        expect(R.quest[k].flames).toBe(`${q.flames.filter(Boolean).length} of ${q.flames.length} flames lit`);
      }
    });

    it('offers the same sunrise plans', () => {
      at();
      for (const k of Object.keys(R.plan)) {
        const ev = days[k].events.find((x) => x.id === R.ev[k])!;
        expect(J(core.srPlanInfo(ev, st))).toEqual(R.plan[k]);
      }
    });
  });
});

describe('the sunrise check', () => {
  const T = '2026-10-15';
  const setup = (plan?: Settings['plan']) => {
    const st = core.normSettings({ start: '2026-09-20', day1: '2026-09-27', ...(plan ? { plan } : {}) });
    const days: Days = { '2026-10-14': core.normDay({ events: [{ id: 'a', time: '23:10', outcome: 'slipped', trigger: 'late', recovered: true }] }, '2026-10-14') };
    return { st, days };
  };

  it('saves the plan on the slip and puts it in My plan when that slot still has the starting words', () => {
    const { st, days } = setup();
    const r = core.srFinish(days, st, '2026-10-14', 'a', 'Charge my phone in another room and go to sleep.', T, 5000);
    expect(r.toPlan).toBe(true);
    expect(r.st.plan[0]).toEqual({ when: "I'm in bed late at night", then: 'Charge my phone in another room and go to sleep.' });
    expect(r.days['2026-10-14'].events[0].rk).toEqual({ at: T, pl: 'Charge my phone in another room and go to sleep.' });
  });

  it('never writes over a plan the person wrote themselves', () => {
    const own = setup().st.plan.map((x, i) => (i === 0 ? { when: x.when, then: 'Read a paper book.' } : x));
    const { st, days } = setup(own);
    const r = core.srFinish(days, st, '2026-10-14', 'a', 'Leave the room for 10 minutes. Then bed, no phone.', T, 5000);
    expect(r.toPlan).toBe(false);
    expect(r.st.plan[0].then).toBe('Read a paper book.');
    expect(r.days['2026-10-14'].events[0].rk?.pl).toBe('Leave the room for 10 minutes. Then bed, no phone.');
  });

  it('a skipped plan still finishes the check', () => {
    const { st, days } = setup();
    const r = core.srFinish(days, st, '2026-10-14', 'a', '', T, 5000);
    expect(r.days['2026-10-14'].events[0].rk).toEqual({ at: T, pl: '' });
    expect(core.rkOf(r.days, '2026-10-14', st)?.m3).toBe(true);
  });

  it('asks about last night only when it is not answered and the phone was not put away', () => {
    const { st, days } = setup();
    const r = core.rkOf(days, '2026-10-14', st)!;
    expect(core.srSteps(days, r)).toEqual(['hi', 'so', 'before', 'plan']);
    days['2026-10-14'] = { ...days['2026-10-14'], checkin: core.normCheckin({ so: 'N' }) };
    expect(core.srSteps(days, core.rkOf(days, '2026-10-14', st)!)).toEqual(['hi', 'before', 'plan']);
  });

  it('going deeper marks the fourth mission, with the trace-back answers', () => {
    const { st, days } = setup();
    const next = core.rkDeep(days, st, '2026-10-14', 'trace', ['in bed', 'scrolling', 'x'.repeat(300)], 5000)!;
    const ev = next['2026-10-14'].events[0];
    expect(ev.rk?.dp).toBe('trace');
    expect(ev.rk?.tr?.[2]).toHaveLength(200);
    expect(core.rkOf(next, '2026-10-14', st)?.m4).toBe(true);
  });
});
