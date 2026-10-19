/* Closing the setup part way keeps the place, so opening it again picks up there (legacy ui.obKeep). New people see the setup
   first, once per launch; closing it shows the welcome page, which can open it again (legacy obAuto and ui.obShut).
   A new person's place is also kept on this device, so a phone that closes Daybook in the background (or a restart) does
   not send them back to the first question. It is never synced, and it is let go once the setup is saved. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SetupAnswers } from '@daybook/core';

export interface SetupFlow {
  redo: boolean;
  i: number;
  a: SetupAnswers;
  hg: number | 'skip' | null;
  keep: string[] | null;
  saved: boolean;
  changed: number;
}
export const setupKeep: { flow: SetupFlow | null; shut: boolean } = { flow: null, shut: false };

const KEY = 'daybook.setup';
let loaded = false;
/** the place kept on this device, read once at launch; the setup page may open before it is in */
export const setupStored: Promise<SetupFlow | null> = AsyncStorage.getItem(KEY)
  .then((raw) => {
    const v = raw ? (JSON.parse(raw) as SetupFlow) : null;
    return v && typeof v === 'object' && !v.redo && !v.saved && typeof v.i === 'number' && v.a ? v : null;
  })
  .catch(() => null)
  .then((v) => {
    loaded = true;
    if (v && !setupKeep.flow) setupKeep.flow = v;
    return v;
  });

/** keep a new person's place on this device (or let it go, with null). Nothing is written before the kept place is read. */
export function storeSetup(flow: SetupFlow | null) {
  if (!loaded) return;
  (flow && !flow.redo && !flow.saved ? AsyncStorage.setItem(KEY, JSON.stringify(flow)) : AsyncStorage.removeItem(KEY)).catch(() => undefined);
}
