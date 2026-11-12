/* Packing choice pills: each goes into the first row with room, and a "none" choice stays in the last row. */
import { expect, it } from 'vitest';
import { isNoneChoice, noneTail, packRows, wrapRows } from '../src/index';

it('a short choice moves up into a row that has room, where plain wrapping wastes a row', () => {
  // "What helped?" on a phone: 10-minute pause, Breathed, Walked or moved, Texted or called someone, Hobby or project,
  // Left the room, Nothing. Plain wrapping takes 5 rows; packed takes 4, with "Nothing" still last.
  const w = [256, 164, 262, 362, 254, 218, 152];
  expect(wrapRows(w, 535, 12)).toEqual([[0, 1], [2], [3], [4, 5], [6]]);
  expect(packRows(w, 535, 12, 1)).toEqual([[0, 1], [2, 4], [3], [5, 6]]);
  // without the none rule it would move up beside "Texted or called someone"
  expect(packRows(w, 535, 12)).toEqual([[0, 1], [2, 4], [3, 6], [5]]);
  // a non-none short choice goes up to the first row with room
  expect(packRows([200, 200, 80], 300, 8)).toEqual([[0, 2], [1]]);
});

it('keeps the order wherever it fits, and the order inside each row', () => {
  expect(packRows([100, 100, 100, 100], 320, 8)).toEqual([[0, 1, 2], [3]]);
  const rows = packRows([150, 200, 60, 120, 90, 40], 300, 8);
  rows.forEach((r) => expect([...r].sort((a, b) => a - b)).toEqual(r));
  expect(rows.flat().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  expect(rows.length).toBeLessThanOrEqual(wrapRows([150, 200, 60, 120, 90, 40], 300, 8).length);
});

it('a none choice only goes into the last row', () => {
  const w = [200, 200, 80];
  expect(packRows(w, 300, 8, 1)).toEqual([[0], [1, 2]]);
  expect(packRows([200, 250, 80], 300, 8, 1)).toEqual([[0], [1], [2]]);
  // two none choices at the end stay together at the end
  expect(packRows([200, 120, 60, 60], 300, 8, 2)).toEqual([[0], [1, 2, 3]]);
});

it('an item wider than the row gets one of its own, and nothing is lost', () => {
  expect(packRows([400, 50], 300, 8)).toEqual([[0], [1]]);
  expect(packRows([], 300, 8)).toEqual([]);
  expect(packRows([50], 300, 8, 1)).toEqual([[0]]);
  // exact fit counts as fitting
  expect(packRows([146, 146], 300, 8)).toEqual([[0, 1]]);
});

it('knows the none choices', () => {
  for (const t of ['Nothing', 'Something else', 'None of these', 'None', 'Not sure']) expect(isNoneChoice(t)).toBe(true);
  for (const t of ['Walked or moved', 'Breathed', 'Others online']) expect(isNoneChoice(t)).toBe(false);
  expect(noneTail(['Walked', 'Nothing'])).toBe(1);
  expect(noneTail(['Nothing', 'Walked'])).toBe(0);
  expect(noneTail(['A', 'Something else', 'None of these'])).toBe(2);
});
