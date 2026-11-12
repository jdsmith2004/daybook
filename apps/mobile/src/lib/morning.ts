/* The morning set's link to Screen Time (app/morning.tsx, core morning-set.ts tonightLine). When Screen Time's night wait is on
   (core pull.ts nightWaitOn: adult sites wait from tonight's time), the morning page names it: "Adult sites wait from 10:30 PM".
   Otherwise tonight's time is the person's own plan: "Phone down tonight at". */
import { nightWaitOn } from '@daybook/core';

import { getPullPrefs, pullOffered } from '@/lib/pull';

export function nightWaitsOn(): boolean {
  return pullOffered && nightWaitOn(getPullPrefs());
}
