/* The journal's Insights (journal-insights.ts): the three numbers, the month, and the feelings named most often, from everything the
   journal shows. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-11-13';
const at = (m: number, d: number) => new Date(2026, m - 1, d, 20).getTime();

describe('Insights', () => {
  it('empty: zeros and no feelings', () => {
    expect(core.jnInsights({}, {}, tk)).toEqual({ year: 0, days: 0, words: 0, top: [] });
    expect(core.jnMonths({}, tk)).toEqual(['2026-11']);
  });

  it('counts entries this year, days written, words, and the top five feelings from everything the journal shows', () => {
    let jn = {};
    const add = (d: string, ms: number, w: string, t: string) => {
      const r = core.jnStart(jn, d, w, ms);
      jn = core.jnEdit(r.jn, r.id, { t }, ms + 1);
    };
    add('2025-12-30', new Date(2025, 11, 30, 20).getTime(), 'Calm', 'Last year it was quiet.');
    add('2026-11-01', at(11, 1), 'Anxious', 'one two three');
    add('2026-11-01', at(11, 1) + 5000, 'Anxious', 'four five');
    add('2026-11-05', at(11, 5), 'Hopeful', '');
    /* a feeling named on its own, and one named before a slip, count too */
    const days = {
      '2026-11-06': {
        d: '2026-11-06',
        events: [],
        checkin: null,
        p: { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {}, fe: [['Lonely', at(11, 6)]] as [string, number][] },
        u: 1,
      },
      '2026-11-07': {
        d: '2026-11-07',
        events: [{ id: 'e1', time: '23:00', outcome: 'slipped' as const, trigger: null, paused: null, did: null, recovered: false, note: '', fb: 'Lonely' }],
        checkin: null,
        p: null,
        u: 1,
      },
    };
    const i = core.jnInsights(jn, days, tk);
    expect(i.year).toBe(3);
    expect(i.days).toBe(3);
    expect(i.words).toBe(10);
    expect(i.top).toEqual([
      { w: 'Anxious', n: 2 },
      { w: 'Lonely', n: 2 },
      { w: 'Calm', n: 1 },
      { w: 'Hopeful', n: 1 },
    ]);
    expect(core.jnMonths(jn, tk)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    const m = core.jnMonth(jn, '2026-11');
    expect([...m.written].sort()).toEqual(['2026-11-01', '2026-11-05']);
    /* November 2026 starts on a Sunday and has 30 days: five weeks */
    expect(m.weeks).toHaveLength(5);
    expect(m.weeks[0][0]).toBe('2026-11-01');
    expect(m.weeks[4].filter(Boolean)).toEqual(['2026-11-29', '2026-11-30']);
  });

  it('at most five feelings', () => {
    let jn = {};
    ['Calm', 'Happy', 'Sad', 'Angry', 'Tired', 'Bored', 'Proud'].forEach((w, i) => (jn = core.jnStart(jn, '2026-11-0' + (i + 1), w, at(11, i + 1)).jn));
    expect(core.jnInsights(jn, {}, tk).top).toHaveLength(5);
  });
});
