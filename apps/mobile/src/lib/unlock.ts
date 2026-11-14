/* The first week and the bigger parts after it (core unlock.ts): which part is today's, from this device's memory, and marking it
   seen and opened. The memory is kept with the SOS memory (lib/sos.tsx), on this device only. What only the phone knows (Health,
   the night pack, the lock) is read here; while the lock or Health is still loading, nothing is picked, so a part is never
   skipped only because the phone had not said yet. */
import { normUnlockMem, packLitCount, unlockNow, type UnlockId, type UnlockMem } from '@daybook/core';
import { Platform } from 'react-native';

import { lockOffered } from '@/components/lock';
import { useFuture } from '@/lib/future';
import { healthOffered, useNights } from '@/lib/health';
import { packOffered, usePack } from '@/lib/night-pack';
import { useLockPref, useReminderPrefs } from '@/lib/prefs';
import { pullOffered, usePullPrefs } from '@/lib/pull';
import { useQuietAsks } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

/** today's part, or null */
export function useUnlock(): UnlockId | null {
  const { snap, tk } = useStore();
  const sos = useSos();
  const quiet = useQuietAsks();
  const pull = usePullPrefs();
  const rem = useReminderPrefs();
  const future = useFuture();
  const health = useNights();
  const pack = usePack();
  const lock = useLockPref();
  const st = snap.settings;
  if (!st) return null;
  /* the phone has been put to bed once (the wind-down done, or the phone put away), or its note is on */
  const bedUsed = rem.wind || Object.values(snap.days).some((d) => !!(d && d.p && (d.p.wd || d.p.po)));
  return unlockNow(snap.days, st, tk, normUnlockMem(sos.mem.unl), {
    bedUsed,
    voiceUsed: future.notes.length > 0,
    pull: pullOffered && pull.asked !== 'picked',
    quiet,
    health: healthOffered() && !health.on,
    night: packOffered && packLitCount(pack) === 0,
    /* the lock is for a phone: on the web there is nothing to lock it with */
    lock: lockOffered && Platform.OS !== 'web' && lock === false,
    loading: lock === null || (healthOffered() && !health.ready),
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

/** the lock's page can follow a first written journal entry (components/journal-page.tsx): a phone with the lock off, that page
    never shown before (here or as a part of the first week), and not in the quiet hours after an SOS or a slip */
export function useLockOffer(): boolean {
  const sos = useSos();
  const quiet = useQuietAsks();
  const lock = useLockPref();
  return lockOffered && Platform.OS !== 'web' && lock === false && !quiet && !normUnlockMem(sos.mem.unl).lock;
}
