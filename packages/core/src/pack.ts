/* Packing a group of choice pills into rows. Plain wrapping puts each pill on the row after the one before it, so a short
   choice like "Nothing" starts a row of its own while there is room beside a pill one row up. Here each pill goes into the
   first row that has room for it, so no row is wasted, and the order stays as it was wherever it fits. A "none" choice
   ("Nothing", "Something else", "None of these") stays last: it may only go into the last row. */

/** a choice that means none of the others; it stays at the end of its group */
export function isNoneChoice(label: string): boolean {
  return /^(nothing|none|something else|none of (these|them|those|that)|other|not sure|i do not know|no idea|skip|my own idea|add your own)\b/i.test(
    label.trim(),
  );
}

/** how many choices at the end of a list are "none" choices, which keep to the last row */
export function noneTail(labels: string[]): number {
  let n = 0;
  while (n < labels.length && isNoneChoice(labels[labels.length - 1 - n])) n++;
  return n;
}

/** rows of indexes, from widths, in as few rows as the widths allow. Each item first goes into the first row with room
    for it, in order; when that leaves more rows than needed, the fewest rows are searched for (the groups are small), and
    the in-order result wins any tie, so pills move only when moving them saves a row. Inside a row the order is kept, and
    rows are read in the order of their first item. The last `last` items only go into the last row, after everything
    else: the row with the most room for them becomes the last one. An item wider than the row gets one of its own. */
export function packRows(widths: number[], max: number, gap: number, last = 0): number[][] {
  const n = widths.length;
  const free = Math.max(0, n - Math.max(0, last));
  const fits = (used: number, w: number) => used + gap + w <= max + 0.5;
  const sum = (r: number[]) => r.reduce((a, i) => a + widths[i], 0) + gap * Math.max(0, r.length - 1);

  // in order: each item into the first row with room
  let rows: number[][] = [];
  for (let i = 0; i < free; i++) {
    const r = rows.findIndex((row) => fits(sum(row), widths[i]));
    if (r >= 0) rows[r].push(i);
    else rows.push([i]);
  }
  // fewer rows, if there are any to be had
  const floor = Math.ceil((widths.slice(0, free).reduce((a, w) => a + w + gap, 0) - 0.5) / (max + gap));
  if (rows.length > floor && free <= 14) {
    const best = fewest(widths.slice(0, free), max, gap, rows.length, floor);
    if (best) rows = best;
  }
  rows = rows.map((r) => [...r].sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]);

  // the none choices: into the row with the most room that takes them all, which then goes last; else rows of their own
  const tail = Array.from({ length: n - free }, (_, k) => free + k);
  if (tail.length) {
    const tw = sum(tail);
    let at = -1;
    rows.forEach((r, k) => {
      if (fits(sum(r), tw) && (at < 0 || sum(r) <= sum(rows[at]))) at = k;
    });
    // no row has room: pack the rest again with the tail as one more pill; if that takes no more rows, the row the tail
    // went into has room for it
    if (at < 0 && tw <= max && free <= 14) {
      const ws = widths.slice(0, free).concat([tw]);
      const again = fewest(ws, max, gap, rows.length + 1, Math.ceil((ws.reduce((x, w) => x + w + gap, 0) - 0.5) / (max + gap)));
      if (again) {
        rows = again.map((r) => r.filter((i) => i < free).sort((x, y) => x - y)).sort((x, y) => (x[0] ?? Infinity) - (y[0] ?? Infinity));
        rows.forEach((r, k) => {
          if (fits(sum(r), tw) && (at < 0 || sum(r) <= sum(rows[at]))) at = k;
        });
      }
    }
    if (at >= 0) {
      const [r] = rows.splice(at, 1);
      rows.push(r.concat(tail));
    } else {
      // the last row takes what it can, in order, then new rows
      for (const i of tail) {
        const r = rows[rows.length - 1];
        if (r && fits(sum(r), widths[i])) r.push(i);
        else rows.push([i]);
      }
    }
  }
  return rows;
}

/** the fewest rows for these widths, fewer than `than`, searched biggest first; null when none is fewer */
function fewest(widths: number[], max: number, gap: number, than: number, floor: number): number[][] | null {
  const order = widths.map((_, i) => i).sort((a, b) => widths[b] - widths[a] || a - b);
  let best: number[][] | null = null;
  let limit = than - 1;
  let steps = 0;
  const rows: number[][] = [];
  const used: number[] = [];
  const go = (k: number): boolean => {
    if (++steps > 50000) return true;
    if (k === order.length) {
      best = rows.map((r) => r.slice());
      limit = rows.length - 1;
      return rows.length <= floor;
    }
    const i = order[k];
    const w = widths[i];
    const tried: number[] = [];
    for (let r = 0; r < rows.length; r++) {
      if (used[r] + gap + w > max + 0.5 || tried.indexOf(used[r]) >= 0) continue;
      tried.push(used[r]);
      rows[r].push(i);
      used[r] += gap + w;
      const done = go(k + 1);
      rows[r].pop();
      used[r] -= gap + w;
      if (done) return true;
    }
    if (rows.length < limit) {
      rows.push([i]);
      used.push(w);
      const done = go(k + 1);
      rows.pop();
      used.pop();
      if (done) return true;
    }
    return false;
  };
  go(0);
  return best;
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
