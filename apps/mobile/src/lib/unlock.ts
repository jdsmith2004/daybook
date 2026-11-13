/* The first week (core unlock.ts): which part is today's, from this device's memory, and marking it seen and opened. The memory
   is kept with the SOS memory (lib/sos.tsx), on this device only. */
import { normUnlockMem, unlockNow, type UnlockId, type UnlockMem } from '@daybook/core';

import { useFuture } from '@/lib/future';
import { useReminderPrefs } from '@/lib/prefs';
import { pullOffered, usePullPrefs } from '@/lib/pull';
import { useQuietAsks } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

/** today's first-week part, or null */
export function useUnlock(): UnlockId | null {
  const { snap, tk } = useStore();
  const sos = useSos();
  const quiet = useQuietAsks();
  const pull = usePullPrefs();
  const rem = useReminderPrefs();
  const future = useFuture();
  const st = snap.settings;
  if (!st) return null;
  /* the phone has been put to bed once (the wind-down done, or the phone put away), or its note is on */
  const bedUsed = rem.wind || Object.values(snap.days).some((d) => !!(d && d.p && (d.p.wd || d.p.po)));
  return unlockNow(snap.days, st, tk, normUnlockMem(sos.mem.unl), {
    bedUsed,
    voiceUsed: future.notes.length > 0,
    pull: pullOffered && pull.asked !== 'picked',
    quiet,
  });
}

/** what to keep: the day it was first the card, and once its page is opened */
export function useUnlockMark() {
  const sos = useSos();
  const { tk } = useStore();
  const set = (id: UnlockId, opened: boolean) =>
    sos.setMem((m) => {
      const u: UnlockMem = normUnlockMem(m.unl);
      const was = u[id];
      if (was && (was.o || !opened)) return m;
      u[id] = opened ? { d: was?.d || tk, o: 1 } : { d: tk };
      return { ...m, unl: u };
    });
  return { shown: (id: UnlockId) => set(id, false), opened: (id: UnlockId) => set(id, true) };
}
