import { describe, expect, it } from 'vitest';
import { FEEL_COLS, FEEL_DAY_MAX, FEEL_MID, FEEL_QUADS, FEEL_ROWS, FEELINGS, feelAt, feelFam, feelLead, feelLog, feelPos, TOOLS } from '../src/index';

describe('the feelings grid', () => {
  it('is 12 by 12, every word distinct, every line plain', () => {
    expect(FEELINGS.length).toBe(FEEL_ROWS);
    const words = new Set<string>();
    for (const row of FEELINGS) {
      expect(row.length).toBe(FEEL_COLS);
      for (const f of row) {
        expect(f.w.length).toBeGreaterThan(1);
        expect(words.has(f.w)).toBe(false);
        words.add(f.w);
        const n = f.how.split(' ').length;
        expect(n).toBeGreaterThanOrEqual(4);
        expect(n).toBeLessThanOrEqual(10);
        /* no contractions, no "you": the lines describe the feeling, not the person */
        expect(f.how).not.toMatch(/'|\byou\b|\byour\b/i);
      }
    }
    expect(words.size).toBe(144);
  });

  it('keeps the words the app leans on, in the right quadrant', () => {
    const at = (w: string) => {
      for (let r = 0; r < FEEL_ROWS; r++) for (let c = 0; c < FEEL_COLS; c++) if (FEELINGS[r][c].w === w) return [r, c];
      return null;
    };
    for (const w of ['Ashamed', 'Guilty', 'Lonely', 'Bored', 'Numb', 'Empty', 'Hopeless', 'Tired']) {
      const p = at(w)!;
      expect(p, w).not.toBeNull();
      expect(p[0], w).toBeGreaterThanOrEqual(FEEL_MID);
      expect(p[1], w).toBeLessThan(FEEL_MID);
    }
    for (const w of ['Restless', 'Stressed', 'Anxious', 'Frustrated', 'Overwhelmed']) {
      const p = at(w)!;
      expect(p[0], w).toBeLessThan(FEEL_MID);
      expect(p[1], w).toBeLessThan(FEEL_MID);
    }
    for (const w of ['Hopeful', 'Proud', 'Calm', 'Relieved', 'Grateful', 'Strong']) {
      expect(at(w), w).not.toBeNull();
    }
  });

  it('opens each corner on a cell that exists', () => {
    expect(FEEL_QUADS.length).toBe(4);
    for (const q of FEEL_QUADS) expect(feelAt(q.r, q.c)).not.toBeNull();
  });

  it('leads every feeling to a real tool, or to none when nothing needs fixing', () => {
    const ids = (TOOLS as { id: string }[]).map((t) => t.id);
    for (let r = 0; r < FEEL_ROWS; r++)
      for (let c = 0; c < FEEL_COLS; c++)
        for (const night of [false, true]) {
          const lead = feelLead(r, c, night);
          expect(lead, `${r},${c}`).not.toBeNull();
          if (lead) {
            expect(ids.indexOf(lead.tool), lead.tool).toBeGreaterThanOrEqual(0);
            expect(lead.why).not.toMatch(/'/);
          }
        }
    /* the ones that matter most for this app */
    const lead = (w: string, night = false) => {
      const p = feelPos(w)!;
      return feelLead(p.r, p.c, night)!.tool;
    };
    expect(lead('Lonely')).toBe('message');
    expect(lead('Ashamed')).toBe('thought');
    expect(lead('Tired', true)).toBe('bed');
    expect(lead('Tired')).toBe('halt');
    expect(lead('Calm')).toBe('breathe');
    expect(lead('Panicked')).toBe('ground');
    expect(lead('Thrilled')).toBe('ground');
    /* the words added in the 12 by 12 grid lead where their family does */
    expect(lead('Rejected')).toBe('message');
    expect(lead('Left out')).toBe('message');
    expect(lead('Insecure')).toBe('thought');
    expect(lead('Antsy')).toBe('move');
    expect(lead('Spent', true)).toBe('bed');
    expect(lead('Indifferent')).toBe('surprise');
    expect(lead('Free')).toBe('ground');
    expect(lead('Slow')).toBe('breathe');
  });

  it('keeps every word of the old 10 by 10 grid, in the same corner', () => {
    /* the words logged before the grid grew must still be found, in the corner they were named in */
    const old: [string, boolean, boolean][] = [
      ['Enraged', true, false],
      ['Ecstatic', true, true],
      ['Despairing', false, false],
      ['Serene', false, true],
      ['Uneasy', true, false],
      ['Loved', true, true],
      ['Meh', false, false],
      ['OK', false, true],
    ];
    for (const [w, high, pleasant] of old) {
      const p = feelPos(w)!;
      expect(p, w).not.toBeNull();
      expect(p.r < FEEL_MID, w).toBe(high);
      expect(p.c >= FEEL_MID, w).toBe(pleasant);
    }
    /* the corners hold the strongest feelings, and every new word has its family */
    expect(feelAt(0, 0)!.w).toBe('Enraged');
    expect(feelAt(11, 11)!.w).toBe('Serene');
    const p = feelPos('Bitter')!;
    expect(feelFam(p.r, p.c)).toBe('anger');
  });

  it('writes a named feeling on the day, and stops at the cap', () => {
    const K = '2026-10-15';
    let d = feelLog(null, K, 'Lonely', 1000)!;
    expect(d.p!.fe).toEqual([['Lonely', 1000]]);
    expect(d.u).toBe(1000);
    d = feelLog(d, K, 'Calm', 2000)!;
    expect(d.p!.fe).toEqual([
      ['Lonely', 1000],
      ['Calm', 2000],
    ]);
    for (let i = 0; i < FEEL_DAY_MAX + 5; i++) d = feelLog(d, K, 'OK', 3000 + i)!;
    expect(d.p!.fe!.length).toBe(FEEL_DAY_MAX);
  });
});
