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
  // the none choice joins the row with room for it, and that row goes last, instead of taking a row of its own
  expect(packRows([200, 250, 80], 300, 8, 1)).toEqual([[1], [0, 2]]);
  // no row has room: it takes its own, last
  expect(packRows([250, 250, 80], 300, 8, 1)).toEqual([[0], [1], [2]]);
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
  for (const t of ['Nothing', 'Something else', 'None of these', 'None', 'Not sure', 'My own idea']) expect(isNoneChoice(t)).toBe(true);
  for (const t of ['Walked or moved', 'Breathed', 'Others online']) expect(isNoneChoice(t)).toBe(false);
  expect(noneTail(['Walked', 'Nothing'])).toBe(1);
  expect(noneTail(['Nothing', 'Walked'])).toBe(0);
  expect(noneTail(['A', 'Something else', 'None of these'])).toBe(2);
});

it('the owner\'s "Why a 3, and not a 6?" page: the reasons and the holds in one group take a row fewer', () => {
  // widths in points from the owner's picture, 331 to use, gap 8: Being ready for a real, honest relationship; Living by
  // my faith | I am somewhere I cannot; I know how it ends; I opened this; Part of me does not want it; God is with me
  const reasons = [284, 134];
  const holds = [180, 140, 105, 193, 118];
  // two groups, one under the other: 2 rows + 3 rows, with "Living by my faith" and "God is with me" each beside a gap
  expect(packRows(reasons, 331, 8).length + packRows(holds, 331, 8).length).toBe(5);
  // one group: 4 rows, every row full
  expect(packRows(reasons.concat(holds), 331, 8).length).toBe(4);
});

it('moves pills out of order only when that saves a row', () => {
  // in order, the two short ones share a row and each long one takes its own: 3 rows; paired up, 2
  const w = [40, 40, 60, 60];
  expect(wrapRows(w, 100, 0).length).toBe(3);
  expect(packRows(w, 100, 0)).toEqual([
    [0, 2],
    [1, 3],
  ]);
  // when the order already gives the fewest rows, nothing moves
  expect(packRows([100, 100, 100, 100], 320, 8)).toEqual([[0, 1, 2], [3]]);
  expect(packRows([60, 50, 70, 30, 40], 100, 0)).toEqual([[0, 3], [1, 4], [2]]);
});

it('never makes more rows than plain wrapping, and keeps every pill, for many random groups', () => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let t = 0; t < 400; t++) {
    const n = 1 + Math.floor(rnd() * 12);
    const w = Array.from({ length: n }, () => 40 + Math.round(rnd() * 300));
    const max = 280 + Math.round(rnd() * 120);
    const last = rnd() < 0.3 ? 1 : 0;
    const rows = packRows(w, max, 8, last);
    expect(rows.flat().sort((a, b) => a - b)).toEqual(w.map((_, i) => i));
    expect(rows.length).toBeLessThanOrEqual(wrapRows(w, max, 8).length);
    for (const r of rows) if (r.length > 1) expect(r.reduce((a, i) => a + w[i], 0) + 8 * (r.length - 1)).toBeLessThanOrEqual(max + 0.5);
    if (last) expect(rows[rows.length - 1]).toContain(n - 1);
  }
});

it('a long list stays quick', () => {
  const w = Array.from({ length: 14 }, (_, i) => 50 + ((i * 97) % 230));
  const t0 = Date.now();
  packRows(w, 343, 8);
  expect(Date.now() - t0).toBeLessThan(50);
});

it('"Write my own" does not take a row alone when the others can make room for it', () => {
  // in order: [50, 30] [50, 40], and the last 30 fits neither; grouped [50, 50] [30, 40], it fits beside 30 and 40
  expect(packRows([50, 30, 50, 40, 30], 100, 0, 1)).toEqual([
    [0, 2],
    [1, 3, 4],
  ]);
  // already room in order: nothing moves
  expect(packRows([60, 40, 50, 30, 20], 100, 0, 1)).toEqual([
    [0, 1],
    [2, 3, 4],
  ]);
  // every grouping fills both rows: it takes a row of its own, last
  expect(packRows([70, 30, 70, 30, 20], 100, 0, 1)).toEqual([[0, 1], [2, 3], [4]]);
});
