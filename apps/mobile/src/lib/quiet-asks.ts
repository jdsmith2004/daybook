/* When Daybook asks for nothing (CLAUDE.md: never ask in the hours after an SOS or a slip; the UX audit of October 27,
   2026: never on the day the person came back). No tip, no account card, no counts question, inside a celebration or
   on Today, on those days and in those hours. Coming back is the day Welcome back opened (kept on this device, Today's
   backAsk), or the day right after a gap away that is still unanswered (core awayDue). */
import { addDays, awayDue, careLastAt, tipQuiet } from '@daybook/core';
import { useEffect } from 'react';

import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

/** came back today after days away */
export function useCameBack(): boolean {
  const { snap, tk } = useStore();
  const sos = useSos();
  const st = snap.settings;
  const asked = sos.mem.backAsk && typeof sos.mem.backAsk === 'object' ? (sos.mem.backAsk as { d?: string }) : null;
  if (asked && asked.d === tk) return true;
  const due = st ? awayDue(snap.days, st, tk) : null;
  return !!due && due.to === addDays(tk, -1);
}

/** no asks now: the person came back today, or an SOS, Talk it through, Walk it through or a slip was in the last hours (core tipQuiet,
    careLastAt) */
export function useQuietAsks(): boolean {
  const { snap, now } = useStore();
  const sos = useSos();
  const back = useCameBack();
  const st = snap.settings;
  return back || (!!st && tipQuiet(snap.days, st, { now, sos: careLastAt(sos.mem) }));
}

/** a care tool other than SOS is open (Talk it through, Walk it through): marked as it opens and as it closes, so every ask waits
    the same quiet hours after it as after an SOS (core careLastAt) */
export function useCareOpen(on = true) {
  const { setMem } = useSos();
  useEffect(() => {
    if (!on) return;
    setMem((m) => ({ ...m, careAt: Date.now() }));
    return () => setMem((m) => ({ ...m, careAt: Date.now() }));
  }, [on, setMem]);
}
