import { router, useNavigation, useRoute } from 'expo-router';

/* The root stack's state, kept by the layout (NavKeeper in app/_layout.tsx), so close() can see what is open. */
type Route = { key: string; name: string; state?: { index?: number; routes: Route[] } };
export type NavState = { index?: number; routes: Route[] };
type State = NavState;
let rootState: () => State | undefined = () => undefined;
export function keepRootState(get: () => State | undefined) {
  rootState = get;
}

/** the sheets: one thing, over everything (on iOS a card that slides up below the status bar) */
export const SHEETS = [
  'points',
  'mode',
  'growth',
  'day/[date]',
  'entry',
  'badge/[id]',
  'privacy',
  'account',
  'counts',
  'feedback',
  'stats',
  'tip',
  'today-feel',
];

/** the full-screen moments: closing one goes back past all of them at once */
const SCENE = /^(sos|tool\/\[id\]|log|sunrise|checkin|talk|review|deeper|wind|night|lesson\/\[id\]|lwrite\/\[n\]|setup|graduated|week|back)$/;

/** leave a full-screen moment (legacy closeScene): every full-screen moment on top closes, and the person is back where they
    started it (a tab, or a page like My plan). Opened directly (a web link), it goes to Today. SOS opened from inside the
    setup closes back to the setup, on the page where it was left. Talk it through opened from SOS closes back to SOS. */
export function close() {
  let st = rootState();
  /* Expo Router keeps the app's stack inside one "__root" route */
  while (st && st.routes.length === 1 && st.routes[0].name === '__root' && st.routes[0].state) st = st.routes[0].state;
  const routes = st ? st.routes.slice(0, (st.index ?? st.routes.length - 1) + 1) : [];
  /* Talk it through opened from SOS closes back to SOS, where the urge is still open (to log, or to pick a tool) */
  if (routes.length >= 2 && routes[routes.length - 1].name === 'talk' && routes[routes.length - 2].name === 'sos') {
    router.back();
    return;
  }
  let n = 0;
  while (n < routes.length - 1 && SCENE.test(routes[routes.length - 1 - n].name) && !(n > 0 && routes[routes.length - 1 - n].name === 'setup')) n++;
  if (n > 0) router.dismiss(n);
  else if (router.canDismiss()) router.dismissAll();
  else if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** finish a full-screen moment: every full-screen moment on top closes at once (SOS under it too), back to where the
    person started. close() is for the X, which may go one step back; this is for Done and the other finishing buttons. */
export function closeAll() {
  let st = rootState();
  while (st && st.routes.length === 1 && st.routes[0].name === '__root' && st.routes[0].state) st = st.routes[0].state;
  const routes = st ? st.routes.slice(0, (st.index ?? st.routes.length - 1) + 1) : [];
  let n = 0;
  while (n < routes.length - 1 && SCENE.test(routes[routes.length - 1 - n].name) && !(n > 0 && routes[routes.length - 1 - n].name === 'setup')) n++;
  if (n > 0) router.dismiss(n);
  else if (router.canDismiss()) router.dismissAll();
  else if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** whether a sheet is open on top: Today shows through behind it, so Today keeps its place */
export function sheetOnTop(): boolean {
  let st = rootState();
  while (st && st.routes.length === 1 && st.routes[0].name === '__root' && st.routes[0].state) st = st.routes[0].state;
  const top = st?.routes[st.index ?? st.routes.length - 1];
  return !!top && SHEETS.includes(top.name);
}

/** the tab showing under the pages (kept by the tab bar) */
let lastTab = 'index';
export function keepTab(path: string) {
  const m = /^\/(pattern|learn|more)?$/.exec(path);
  if (m) lastTab = m[1] || 'index';
}

/** what a Back button on a page should say: the page underneath it */
const NAMES: Record<string, string> = {
  index: 'Today',
  pattern: 'Pattern',
  journal: 'Journal',
  learn: 'Learn',
  more: 'More',
  plan: 'My plan',
  settings: 'Settings',
  miles: 'Milestones',
  reasons: 'My reasons',
  'help/index': 'Get help',
  'help/[id]': 'Back',
  'lesson/[id]': 'The lesson',
  'lwrite/[n]': 'Back',
  setup: 'Back',
  sos: 'SOS',
  'tool/[id]': 'Back',
};
export function useBackLabel(fallback: string): string {
  const nav = useNavigation();
  const route = useRoute();
  try {
    const st = nav.getState() as State | undefined;
    if (!st) return fallback;
    const i = st.routes.findIndex((r) => r.key === route.key);
    const under = i > 0 ? st.routes[i - 1] : null;
    if (!under) return fallback;
    if (under.name === '(tabs)') return NAMES[lastTab] || 'Back';
    return NAMES[under.name] || 'Back';
  } catch {
    return fallback;
  }
}

/** whether this page was opened on top of a sheet or a full-screen moment. iOS then shows it as a card that slides up below
    the status bar (like a sheet), so it needs no room for the clock and the battery. */
export function useOverModal(): boolean {
  const nav = useNavigation();
  const route = useRoute();
  try {
    const st = nav.getState() as State | undefined;
    if (!st) return false;
    const i = st.routes.findIndex((r) => r.key === route.key);
    return st.routes.slice(0, Math.max(0, i)).some((r) => SHEETS.includes(r.name) || SCENE.test(r.name));
  } catch {
    return false;
  }
}
