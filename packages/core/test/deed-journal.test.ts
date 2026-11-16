import { describe, expect, it } from 'vitest';
import { deedJot, deedWrite, JN_NO_FEEL, PATH_STEPS } from '../src';

describe('a deed written into the journal', () => {
  it('gives a box to the deeds that ask for words, and only those', () => {
    const ids = PATH_STEPS.filter((_, k) => deedWrite(k)).map((s) => s.id);
    expect(ids).toEqual(['s1', 's2', 's4', 's5', 's7']);
    expect(deedWrite(-1)).toBeNull();
    expect(deedWrite(99)).toBeNull();
  });
  it('makes an entry on the first word, follows changes, and takes it out when emptied', () => {
    const words = PATH_STEPS[3].deed;
    const a = deedJot({}, null, '2026-11-16', words, '', 1000);
    expect(a).toEqual({ jn: {}, id: null });
    const b = deedJot({}, null, '2026-11-16', words, 'I am', 2000);
    expect(b.id).toBeTruthy();
    const e = b.jn[b.id!];
    expect(e).toMatchObject({ d: '2026-11-16', w: JN_NO_FEEL, t: 'I am', q: words });
    const c = deedJot(b.jn, b.id, '2026-11-16', words, 'I am becoming free', 3000);
    expect(c.id).toBe(b.id);
    expect(Object.keys(c.jn)).toHaveLength(1);
    expect(c.jn[b.id!].t).toBe('I am becoming free');
    expect(c.jn[b.id!].u).toBeGreaterThan(e.u);
    const d = deedJot(c.jn, c.id, '2026-11-16', words, '  ', 4000);
    expect(d).toEqual({ jn: {}, id: null });
  });
  it('keeps the rest of the journal as it was', () => {
    const other = deedJot({}, null, '2026-11-15', 'x', 'another', 500);
    const r = deedJot(other.jn, null, '2026-11-16', 'y', 'mine', 1000);
    expect(Object.keys(r.jn)).toHaveLength(2);
    expect(r.jn[other.id!]).toBe(other.jn[other.id!]);
  });
});
