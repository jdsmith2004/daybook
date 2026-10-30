/* What gets a sheet (the owner, October 30, 2026): levels come every day or two, and "Level up" stopped meaning anything by
   week two, with most opens starting on something to dismiss. So a new form of the flame and a badge get the sheet (a
   comeback has its own card on Today, moment.ts); a plain level and a full ring are one short toast, with the hero's level bar carrying the rest. This changes only
   what is shown: points, the ladder and what was earned are untouched (miles.ts, levels.ts). Checked by test/celebrate.test.ts. */
import type { CelItem } from './miles';

const plain = (it: CelItem) => (it.type === 'level' && !it.evolve && it.from > 0) || it.type === 'perfect';

/** what is waiting, as one sheet and one toast. With a sheet to show, a plain level rides on it as a row, so nothing else
    is said; on its own, it is the toast. */
export function celSplit(items: CelItem[]): { sheet: CelItem[]; toast: string | null } {
  const big = items.filter((it) => !plain(it) && it.type !== 'quest');
  if (big.length) return { sheet: items.filter((it) => it.type !== 'perfect' && it.type !== 'quest'), toast: null };
  const levels = items.flatMap((it) => (it.type === 'level' ? [it.level.n] : []));
  const words = [
    levels.length ? 'Level ' + Math.max(...levels) : '',
    ...items.flatMap((it) => (it.type === 'perfect' ? ['All ' + it.n + ' wins today'] : [])),
  ].filter(Boolean);
  return { sheet: [], toast: words.length ? words.join(' · ') : null };
}
