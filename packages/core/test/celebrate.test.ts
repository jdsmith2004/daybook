/* What gets a sheet, and what is one short toast. */
import { expect, it } from 'vitest';
import { celSplit, celSpendsDay, levelOf, type CelItem } from '../src/index';

const lv = (n: number, evolve: boolean, from = n - 1): CelItem => ({ type: 'level', level: { ...levelOf(0), n } as never, from, evolve });
const badge = { type: 'badge', b: { id: 'x', name: 'X', desc: '', icon: '', tone: '' } } as unknown as CelItem;

it('a plain level is a toast and no sheet', () => {
  expect(celSplit([lv(7, false)])).toEqual({ sheet: [], toast: 'Level 7' });
});
it('a full ring is a toast too', () => {
  expect(celSplit([lv(7, false), { type: 'perfect', n: 3 }])).toEqual({ sheet: [], toast: 'Level 7 · All 3 wins today' });
});
it('a new form keeps its sheet; a badge has one a day, then it is said in the toast', () => {
  expect(celSplit([lv(6, true)]).sheet.length).toBe(1);
  expect(celSplit([badge], true).sheet).toEqual([badge]);
  expect(celSplit([badge], false)).toEqual({ sheet: [], toast: 'New badge: X' });
});
it('a plain level rides on a sheet as a row, with no toast over it', () => {
  const r = celSplit([lv(7, false), badge], true);
  expect(r.sheet.length).toBe(2);
  expect(r.toast).toBeNull();
});
it('nothing waiting says nothing', () => {
  expect(celSplit([])).toEqual({ sheet: [], toast: null });
});

it('a plain level is always the toast, even the first of a day (the owner, November 18, 2026; the pop-ups audit, B1)', () => {
  expect(celSplit([lv(7, false)], true)).toEqual({ sheet: [], toast: 'Level 7' });
  expect(celSpendsDay([badge])).toBe(true);
  expect(celSpendsDay([lv(6, true)])).toBe(false);
});
it('two plain levels at once are one row, for the higher, on a new form', () => {
  const r = celSplit([lv(7, false), lv(8, false, 7), lv(9, true, 8)]);
  expect(r.sheet.filter((x) => x.type === 'level' && !x.evolve).length).toBe(1);
});
it('a level from nothing (the preview in Settings) always shows', () => {
  expect(celSplit([lv(1, false, 0)]).sheet.length).toBe(1);
});
