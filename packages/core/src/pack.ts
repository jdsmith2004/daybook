/* Packing a group of choice pills into rows. Plain wrapping puts each pill on the row after the one before it, so a short
   choice like "Nothing" starts a row of its own while there is room beside a pill one row up. Here each pill goes into the
   first row that has room for it, so no row is wasted, and the order stays as it was wherever it fits. A "none" choice
   ("Nothing", "Something else", "None of these") stays last: it may only go into the last row. */

/** a choice that means none of the others; it stays at the end of its group */
export function isNoneChoice(label: string): boolean {
  return /^(nothing|none|something else|none of (these|them|those|that)|other|not sure|i do not know|no idea|skip)\b/i.test(label.trim());
}

/** how many choices at the end of a list are "none" choices, which keep to the last row */
export function noneTail(labels: string[]): number {
  let n = 0;
  while (n < labels.length && isNoneChoice(labels[labels.length - 1 - n])) n++;
  return n;
}

/** rows of indexes, from widths: each item goes into the first row with room for it (keeping the order inside a row).
    The last `last` items only go into the last row, after everything else. An item wider than the row gets one of its own. */
export function packRows(widths: number[], max: number, gap: number, last = 0): number[][] {
  const rows: number[][] = [];
  const used: number[] = [];
  const fits = (r: number, w: number) => used[r] + gap + w <= max + 0.5;
  const add = (r: number, i: number, w: number) => {
    rows[r].push(i);
    used[r] += gap + w;
  };
  const open = (i: number, w: number) => {
    rows.push([i]);
    used.push(w);
  };
  const free = Math.max(0, widths.length - Math.max(0, last));
  for (let i = 0; i < free; i++) {
    const w = widths[i];
    const r = rows.findIndex((_, k) => fits(k, w));
    if (r >= 0) add(r, i, w);
    else open(i, w);
  }
  for (let i = free; i < widths.length; i++) {
    const w = widths[i];
    const r = rows.length - 1;
    if (r >= 0 && fits(r, w)) add(r, i, w);
    else open(i, w);
  }
  return rows;
}

/** the same rows as plain wrapping makes, strictly in order; to compare against */
export function wrapRows(widths: number[], max: number, gap: number): number[][] {
  const rows: number[][] = [];
  let used = 0;
  widths.forEach((w, i) => {
    if (rows.length && used + gap + w <= max + 0.5) {
      rows[rows.length - 1].push(i);
      used += gap + w;
    } else {
      rows.push([i]);
      used = w;
    }
  });
  return rows;
}
