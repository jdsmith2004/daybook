/* What's new after an update (core whats-new.ts). The last version seen is kept on this device: it never syncs and never
   goes into a backup. Each open (the launch, and each return from the background) may show the page once, and only in its
   first few seconds, while Today is in front with nothing on it, so it never comes up in the middle of something. When the
   rules say wait (a hard hour, the day of a slip, the day the person came back), a later open shows it. It is kept as seen
   as soon as it opens, so it opens once, even if the app is closed on it. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gradInfo, urLastAt, whatsNew, type NewItem } from '@daybook/core';
import Constants from 'expo-constants';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { noteSheet, useCelebrating } from '@/components/celebrate';
import { sheetOnTop } from '@/lib/nav';
import { useCameBack } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

const KEY = 'daybook.seenVersion';
/** an open may show the page only this soon after it; after that, it waits for the next open */
const WINDOW = 6000;
/** the wait after Today comes up, so Welcome back, graduation or a celebration can claim the open first */
const SETTLE = 400;

export const appVersion = () => String(Constants.expoConfig?.version || '');

/** what the page shows: kept here while it is open */
let showing: NewItem[] = [];
export const whatsNewItems = () => showing;

/** sets the version seen (the simulator check sets it back to pretend an update) */
export const setSeenVersion = (v: string | null) => (v ? AsyncStorage.setItem(KEY, v) : AsyncStorage.removeItem(KEY)).catch(() => undefined);

/** watches the opens and shows the page when it is due. Used once, in the root layout. */
export function useWhatsNew() {
  const { ready, snap, tk, now } = useStore();
  const sos = useSos();
  const back = useCameBack();
  const celebrating = useCelebrating();
  const path = usePathname();
  const [seen, setSeen] = useState<string | null | undefined>(undefined);
  const [openAt, setOpenAt] = useState(() => Date.now());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setSeen(v || null))
      .catch(() => setSeen(null));
    let away = false;
    const s = AppState.addEventListener('change', (a) => {
      if (a === 'background') away = true;
      else if (a === 'active' && away) {
        away = false;
        setOpenAt(Date.now());
      }
    });
    return () => s.remove();
  }, []);

  const st = snap.settings;
  const busy = path !== '/' || celebrating || (!!st && gradInfo(snap.days, st, tk).ready);
  const ver = appVersion();
  const step = !ready || seen === undefined ? null : whatsNew(seen, ver, { st, days: snap.days, now, sos: urLastAt(sos.mem) ?? null, back, busy });
  const late = useRef<() => boolean>(() => false);
  late.current = () => Date.now() - openAt > WINDOW || celebrating || sheetOnTop();

  useEffect(() => {
    if (!step) return;
    if (step.k === 'keep') {
      setSeen(ver);
      void setSeenVersion(ver);
      return;
    }
    if (step.k !== 'show' || Date.now() - openAt > WINDOW) return;
    const t = setTimeout(() => {
      if (late.current()) return;
      showing = step.items;
      setSeen(ver);
      void setSeenVersion(ver);
      /* the day-feel question never comes on the same open (it treats this like a celebration sheet) */
      noteSheet();
      router.push('/whats-new');
    }, SETTLE);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.k, ver, openAt]);
}
