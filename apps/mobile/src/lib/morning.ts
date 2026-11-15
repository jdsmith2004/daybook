/* The morning set's link to Screen Time (app/morning.tsx, core morning-set.ts tonightLine). Adult sites wait all day now (the owner,
   November 15, 2026: "all day for adult sites"), so tonight's time is never "Adult sites wait from": it is the person's own plan,
   "Phone down at". When Screen Time is not working (core pullTrouble), the page says what is wrong (pullTroubleLine). */
import { getPullTrouble, pullOffered } from '@/lib/pull';

/** whether tonight's time starts a Screen Time wait: no longer, since adult sites wait all day */
export function nightWaitsOn(): boolean {
  return false;
}
/** what is wrong with Screen Time, in one line, or null */
export const pullTroubleLine = (): string | null => (pullOffered ? (getPullTrouble()?.line ?? null) : null);
