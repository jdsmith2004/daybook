/* Quiet days: pause, then ask (away.ts, back.ts). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const tk = '2026-10-20';
const base = (): Settings => ({ ...core.normSettings({ start: '2026-10-01', day1: '2026-10-01', u: 1 }), awayFrom: '2026-10-01' });
/** the app opened on each of these days, and nothing else */
const opened = (keys: string[]): Days => Object.fromEntries(keys.map((k) => [k, core.normDay({ p: { o: true } }, k)]));
const range = (a: string, b: string) => {
  const out: string[] = [];
  for (let k = a; k <= b; k = core.addDays(k, 1)) out.push(k);
  return out;
};

describe('which days are known', () => {
  it('a day the app was opened is present, and the mark is kept, earns nothing and does not start the log', () => {
    const d = core.normDay({ p: { o: true } }, '2026-10-05');
    expect(d.p?.o).toBe(true);
    expect(core.presentDay(d)).toBe(true);
    expect(core.loggedDay(d)).toBe(false);
    expect(core.dayPoints({ '2026-10-05': d }, '2026-10-05', base()).total).toBe(0);
  });

  it('one or two quiet days still count; from the third on, the gap is not known', () => {
    const st = base();
    /* here every day but Oct 6 and 7 (two quiet days), and Oct 10 to 14 (five quiet days) */
    const days = opened(
      range('2026-10-01', '2026-10-19').filter(
        (k) => !['2026-10-06', '2026-10-07', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'].includes(k),
      ),
    );
    expect(core.unknownDays(days, st, tk)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
    expect(core.dayKnown(days, st, '2026-10-07', tk)).toBe(true);
    expect(core.dayKind('2026-10-12', days['2026-10-12'], st, tk, undefined, days)).toBe('unknown');
    expect(core.statusOf('2026-10-12', days['2026-10-12'], st, tk, days)).toBe('unknown');
    /* without the log, the old answer (the golden record) */
    expect(core.dayKind('2026-10-12', undefined, st, tk)).toBe('ok');
  });

  it('is off before awayFrom, so an older log counts as it always did', () => {
    const st = { ...base(), awayFrom: null };
    const days = opened(['2026-10-01', '2026-10-19']);
    expect(core.unknownDays(days, st, tk)).toEqual([]);
    const later = { ...base(), awayFrom: '2026-10-15' };
    expect(core.unknownDays(days, later, tk)).toEqual(['2026-10-17', '2026-10-18']);
  });

  it('today is never quiet', () => {
    expect(core.dayKnown({}, base(), tk, tk)).toBe(true);
  });
});

describe('what not-known days do', () => {
  const st = base();
  /* here Oct 1 to 5, away Oct 6 to 15 (8 not known: Oct 8 to 15), back Oct 16 */
  const days = opened([...range('2026-10-01', '2026-10-05'), ...range('2026-10-16', '2026-10-19')]);

  it('a run pauses through them, and goes on after', () => {
    const L = core.runLedger(days, st, tk);
    /* 5 before, 2 quiet days in the grace, 5 after (Oct 16 to 20): 12, never zero */
    expect(L.cur).toBe(12);
    expect(L.counted).toBe(12);
  });

  it('graduation counts only known days, so a gap never graduates anyone', () => {
    const quiet = opened(['2026-07-01']);
    const s2 = { ...base(), start: '2026-07-01', day1: '2026-07-01', awayFrom: '2026-07-01' };
    const g = core.gradInfo(quiet, s2, tk);
    /* opened once on Jul 1, then gone: the two grace days fall outside the last 100, the rest are not known */
    expect(g.count).toBe(0);
    expect(g.ready).toBe(false);
  });

  it('a graduation already earned stays', () => {
    const s2 = { ...base(), gradAt: '2026-09-01' };
    expect(core.gradInfo({}, s2, tk).at).toBe('2026-09-01');
  });

  it('the calendar says so, without the word missed', () => {
    const m = core.calMonth(days, st, tk, '2026-10');
    expect(m.days.find((d) => d.k === '2026-10-10')?.kind).toBe('away');
    expect(core.daySummary(days, st, '2026-10-10', tk).head).toBe('Not known. You were away');
  });
});

describe('coming back', () => {
  const st = base();
  const days = opened([...range('2026-10-01', '2026-10-05'), ...range('2026-10-16', '2026-10-19')]);
  const gap = { from: '2026-10-08', to: '2026-10-15' };

  it('asks about the gap once the person is back', () => {
    expect(core.awayDue(days, st, tk)).toEqual({ ...gap, n: 8 });
  });

  it('"No slips": the days count', () => {
    const r = core.answerAway(days, st, gap, 'clean', [], 5);
    expect(core.unknownDays(r.days, r.st, tk)).toEqual([]);
    expect(core.awayDue(r.days, r.st, tk)).toBeNull();
    expect(core.runLedger(r.days, r.st, tk).cur).toBe(20);
  });

  it('"Some slips" with days picked: those are slips, the others count', () => {
    const r = core.answerAway(days, st, gap, 'some', ['2026-10-11'], 5);
    expect(r.days['2026-10-11'].events[0].outcome).toBe('slipped');
    expect(core.unknownDays(r.days, r.st, tk)).toEqual([]);
    expect(core.awayDue(r.days, r.st, tk)).toBeNull();
    expect(core.dayKind('2026-10-12', r.days['2026-10-12'], r.st, tk, undefined, r.days)).toBe('ok');
  });

  it('"Some slips" with no day picked, or "rather not say": not known, and not asked again', () => {
    for (const r of [core.answerAway(days, st, gap, 'some', [], 5), core.answerAway(days, st, gap, 'skip', [], 5)]) {
      expect(r.st.away).toEqual([{ ...gap, a: 'skip' }]);
      expect(core.unknownDays(r.days, r.st, tk)).toEqual(range('2026-10-08', '2026-10-15'));
      expect(core.awayDue(r.days, r.st, tk)).toBeNull();
      /* the run before the gap goes on from where it paused */
      expect(core.runLedger(r.days, r.st, tk).cur).toBe(12);
    }
  });

  it('an answer from another device arrives with the settings and counts here too', () => {
    const there = core.answerAway(days, st, gap, 'clean', [], 5).st;
    expect(core.normSettings(JSON.parse(JSON.stringify(there))).away).toEqual([{ ...gap, a: 'clean' }]);
  });

  it('the rule starts once', () => {
    const s0 = { ...base(), awayFrom: null };
    const s1 = core.awayStart(s0, tk, 5)!;
    expect(s1.awayFrom).toBe(tk);
    expect(core.awayStart(s1, '2026-10-21', 6)).toBeNull();
  });
});
