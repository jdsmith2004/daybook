/* What gets a sheet, and what is one short toast. */
import { expect, it } from 'vitest';
import { celSplit, celSpendsLevel, levelOf, type CelItem } from '../src/index';

const lv = (n: number, evolve: boolean, from = n - 1): CelItem => ({ type: 'level', level: { ...levelOf(0), n } as never, from, evolve });
const badge = { type: 'badge', b: { id: 'x', name: 'X', desc: '', icon: '', tone: '' } } as unknown as CelItem;

it('a plain level is a toast and no sheet', () => {
  expect(celSplit([lv(7, false)])).toEqual({ sheet: [], toast: 'Level 7' });
});
it('a full ring is a toast too', () => {
  expect(celSplit([lv(7, false), { type: 'perfect', n: 3 }])).toEqual({ sheet: [], toast: 'Level 7 · All 3 wins today' });
});
it('a new form and a badge keep their sheet', () => {
  expect(celSplit([lv(6, true)]).sheet.length).toBe(1);
  expect(celSplit([badge]).sheet).toEqual([badge]);
});
it('a plain level rides on a sheet as a row, with no toast over it', () => {
  const r = celSplit([lv(7, false), badge]);
  expect(r.sheet.length).toBe(2);
  expect(r.toast).toBeNull();
});
it('nothing waiting says nothing', () => {
  expect(celSplit([])).toEqual({ sheet: [], toast: null });
});

it('the first plain level of a day gets its own moment', () => {
  expect(celSplit([lv(7, false)], true)).toEqual({ sheet: [lv(7, false)], toast: null });
  expect(celSpendsLevel([lv(7, false)])).toBe(true);
  expect(celSpendsLevel([lv(6, true)])).toBe(false);
});
it('two plain levels at once are one moment, for the higher', () => {
  const r = celSplit([lv(7, false), lv(8, false, 7)], true);
  expect(r.sheet.length).toBe(1);
  expect(r.sheet[0].type === 'level' && r.sheet[0].level.n).toBe(8);
});
it('a level from nothing (the preview in Settings) always shows', () => {
  expect(celSplit([lv(1, false, 0)], true).sheet.length).toBe(1);
});
