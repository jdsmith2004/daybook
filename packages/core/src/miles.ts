/* Milestones: badges, the forms of the flame, and what Milestones shows. Ported from the legacy rewardsBody, sheetBadge,
   sheetGrowth and badgeDone. */
import type { Badge } from './legacy/core.js';
import type { Settings } from './types';

/** a badge stays earned once it was seen earned, even if an old entry is changed later */
export const badgeDone = (b: Badge, st: Settings | null) => b.done || !!(st && st.seen && st.seen.badges.indexOf(b.id) >= 0);
