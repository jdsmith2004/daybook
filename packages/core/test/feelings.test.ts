import { describe, expect, it } from 'vitest';
import { FEEL_COLS, FEEL_DAY_MAX, FEEL_QUADS, FEEL_ROWS, FEELINGS, feelAt, feelLead, feelLog, TOOLS } from '../src/index';

describe('the feelings grid', () => {
  it('is 10 by 10, every word distinct, every line plain', () => {
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
    expect(words.size).toBe(100);
  });

  it('keeps the words the app leans on, in the right quadrant', () => {
    const at = (w: string) => {
      for (let r = 0; r < FEEL_ROWS; r++) for (let c = 0; c < FEEL_COLS; c++) if (FEELINGS[r][c].w === w) return [r, c];
      return null;
    };
    for (const w of ['Ashamed', 'Guilty', 'Lonely', 'Bored', 'Numb', 'Empty', 'Hopeless', 'Tired']) {
      const p = at(w)!;
      expect(p, w).not.toBeNull();
      expect(p[0], w).toBeGreaterThanOrEqual(5);
      expect(p[1], w).toBeLessThanOrEqual(4);
    }
    for (const w of ['Restless', 'Stressed', 'Anxious', 'Frustrated', 'Overwhelmed']) {
      const p = at(w)!;
      expect(p[0], w).toBeLessThanOrEqual(4);
      expect(p[1], w).toBeLessThanOrEqual(4);
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
    expect(feelLead(6, 2, false)!.tool).toBe('message'); // Lonely
    expect(feelLead(5, 1, false)!.tool).toBe('thought'); // Ashamed
    expect(feelLead(7, 4, true)!.tool).toBe('bed'); // Tired, at night
    expect(feelLead(7, 4, false)!.tool).toBe('halt'); // Tired, by day
    expect(feelLead(7, 7, false)!.tool).toBe('breathe'); // Calm
    expect(feelLead(0, 2, false)!.tool).toBe('ground'); // Panicked
    expect(feelLead(0, 6, false)!.tool).toBe('ground'); // Thrilled
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
