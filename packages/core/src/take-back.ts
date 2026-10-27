/* The Undo right after a mistaken log (the store's take-back): its points go with it, because they were never really
   earned, and so does what that log alone made new: a badge (Honest log, after a slip logged by mistake) or a level it
   reached. Only what was marked seen in the last few minutes, by the change being undone (fresh), and only when it is
   no longer earned without that log: a badge earned from a real log is never taken from anyone (miles.ts badgeDone keeps
   seen badges for good). Checked by test/take-back.test.ts. */
import { changeSettings } from './actions';
import { gameCompute } from './legacy/core.js';
import type { DayKey, Days, Reviews, Settings } from './types';

/** what a change marked seen: the badges it added, and the level it moved from (null when the level did not move) */
export interface FreshSeen {
  badges: string[];
  level: number | null;
}

/** the settings with what the undone log made new taken back off the seen list, the badges taken back, and whether the
    level was; null when nothing changes */
export function unseeTakenBack(
  days: Days,
  st: Settings,
  reviews: Reviews,
  tk: DayKey,
  fresh: FreshSeen,
): { st: Settings; badges: string[]; level: boolean } | null {
  const seen = st.seen;
  if (!seen) return null;
  /* the level as the log stands now, from where it was before the undone change (the seen level is a floor for the points) */
  const g = gameCompute(days, fresh.level != null ? { ...st, seen: { ...seen, level: fresh.level } } : st, reviews, tk);
  const done = new Set(g.badges.filter((b) => b.done).map((b) => b.id));
  const gone = fresh.badges.filter((id) => seen.badges.indexOf(id) >= 0 && !done.has(id));
  const level = fresh.level != null && seen.level > g.level.n ? g.level.n : null;
  if (!gone.length && level == null) return null;
  const next = changeSettings(st, (s) => {
    const sn = s.seen!;
    sn.badges = sn.badges.filter((id) => gone.indexOf(id) < 0);
    if (level != null) sn.level = level;
  });
  return { st: next, badges: gone, level: level != null };
}

/** what one change marked seen, from the settings before and after it */
export function freshSeen(before: Settings, after: Settings): FreshSeen {
  const a = before.seen;
  const b = after.seen;
  if (!b) return { badges: [], level: null };
  return { badges: b.badges.filter((id) => !a || a.badges.indexOf(id) < 0), level: a && b.level > a.level ? a.level : null };
}
