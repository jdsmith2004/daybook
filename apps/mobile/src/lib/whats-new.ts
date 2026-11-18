/* What's new after an update (core whats-new.ts). The last version seen is kept on this device: it never syncs and never
   goes into a backup. It never opens by itself (the owner, November 18, 2026: "There are so many pop-ups ... they don't really add
   to the app"; the pop-ups audit, A4): once an update is due to show, a quiet line on Today says "New in 1.3.6" for a week, and a
   tap opens the page. When the rules say wait (a hard hour, the day of a slip, the day the person came back), the line comes on a
   later open. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { careLastAt, gradInfo, whatsNew, type NewItem } from '@daybook/core';
import Constants from 'expo-constants';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useCelebrating } from '@/components/celebrate';
import { useCameBack } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

const KEY = 'daybook.seenVersion';

export const appVersion = () => String(Constants.expoConfig?.version || '');

const LINE_KEY = 'daybook.newLine';
/** how long the line stays on Today, untapped */
const LINE_DAYS = 7;
type NewLine = { v: string; at: number; items: NewItem[] };
let line: NewLine | null = null;
let lineRead = false;
const heard = new Set<() => void>();
const tell = () => heard.forEach((f) => f());
const keepLine = (x: NewLine | null) => {
  line = x;
  tell();
  (x ? AsyncStorage.setItem(LINE_KEY, JSON.stringify(x)) : AsyncStorage.removeItem(LINE_KEY)).catch(() => undefined);
};

/** what the page shows: kept here while it is open */
let showing: NewItem[] = [];
export const whatsNewItems = () => showing;

/** the line on Today while it is due ("New in 1.3.6"), and the tap that opens the page and ends the line */
export function useNewLine(): { v: string; open: () => void } | null {
  const [, bump] = useState(0);
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    heard.add(f);
    if (!lineRead) {
      lineRead = true;
      AsyncStorage.getItem(LINE_KEY)
        .then((v) => {
          if (v && !line) line = JSON.parse(v) as NewLine;
          tell();
        })
        .catch(() => undefined);
    }
    return () => void heard.delete(f);
  }, []);
  const x = line;
  if (!x || !x.items?.length || x.v !== appVersion() || Date.now() - x.at > LINE_DAYS * 86_400_000) return null;
  return {
    v: x.v,
    open: () => {
      showing = x.items;
      keepLine(null);
      router.push('/whats-new');
    },
  };
}

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
  const step =
    !ready || seen === undefined
      ? null
      : whatsNew(seen, ver, { st, days: snap.days, now, sos: careLastAt(sos.mem) ?? null, back, busy, ios: Platform.OS === 'ios' });

  useEffect(() => {
    if (!step || (step.k !== 'keep' && step.k !== 'show')) return;
    /* due: the line on Today, kept as seen now, so it never comes again for this version */
    if (step.k === 'show') keepLine({ v: ver, at: Date.now(), items: step.items });
    setSeen(ver);
    void setSeenVersion(ver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.k, ver, openAt]);
}
