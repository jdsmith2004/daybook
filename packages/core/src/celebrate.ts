/* What gets a full moment (components/earned.tsx) and what is one short toast.
   October 30, 2026, the owner: levels come every day or two, and "Level up" stopped meaning anything by week two, with most opens
   starting on something to dismiss. November 13, 2026, the owner: "the level ups and stuff should be inspired by duolingos
   celebrations" (and November 12: "constant celebrations"). Both hold: a new form of the flame and a badge always get the full
   moment, and the first plain level of a day gets one too (`levelMoment`), the way Duolingo gives its streak screen once a day.
   A second plain level on the same day, and a full ring, are one short toast, with the hero's level bar carrying the rest. This
   changes only what is shown: points, the ladder and what was earned are untouched (miles.ts, levels.ts). November 18, 2026, the owner: "There are so many pop-ups ... they don't really add to the app" (the pop-ups audit, B1 and B3): a plain
   level is now always the toast, only a new form of the flame gets the full moment every time, and badges get one full moment a day,
   with any more that day said in the toast. Checked by test/celebrate.test.ts. */
import type { CelItem } from './miles';

const plainLevel = (it: CelItem) => it.type === 'level' && !it.evolve && it.from > 0;
const isBadge = (it: CelItem) => it.type === 'badge';

/** what is waiting, as one moment and one toast. `badgeMoment`: no badge has had its own moment today, so one may. A new form of the
    flame always has its moment. With a moment to show, a plain level (and the day's other badges) ride on it as rows; on their own,
    they are the toast. */
export function celSplit(items: CelItem[], badgeMoment = false): { sheet: CelItem[]; toast: string | null } {
  const shown = items.filter((it) => it.type !== 'perfect' && it.type !== 'quest');
  const big = shown.filter((it) => (!plainLevel(it) && !isBadge(it)) || (isBadge(it) && badgeMoment));
  if (big.length) {
    /* two plain levels at once are one row, for the higher one */
    const levels = items.filter(plainLevel);
    const top = levels.reduce<CelItem | null>((a, b) => (!a || (b.type === 'level' && a.type === 'level' && b.level.n > a.level.n) ? b : a), null);
    return { sheet: shown.filter((it) => !plainLevel(it) || it === top), toast: null };
  }
  const levels = items.flatMap((it) => (it.type === 'level' ? [it.level.n] : []));
  const words = [
    levels.length ? 'Level ' + Math.max(...levels) : '',
    ...items.flatMap((it) => (it.type === 'badge' ? ['New badge: ' + it.b.name] : [])),
    ...items.flatMap((it) => (it.type === 'perfect' ? ['All ' + it.n + ' wins today'] : [])),
  ].filter(Boolean);
  return { sheet: [], toast: words.length ? words.join(' · ') : null };
}

/** whether a moment that is about to show spends the day's one badge moment */
export const celSpendsDay = (sheet: CelItem[]) => sheet.some(isBadge);
