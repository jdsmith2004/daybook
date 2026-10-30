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
  'lessons-week',
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
  'recheck',
];

/** the full-screen moments: the X closes one, Done (closeAll) closes every one on top at once */
const SCENE = /^(sos|tool\/\[id\]|log|checkin|talk|review|wind|night|lesson\/\[id\]|lwrite\/\[n\]|setup|graduated|week|back)$/;

/** the routes open now, bottom to top (Expo Router keeps the app's stack inside one "__root" route) */
function openRoutes(): Route[] {
  let st = rootState();
  while (st && st.routes.length === 1 && st.routes[0].name === '__root' && st.routes[0].state) st = st.routes[0].state;
  return st ? st.routes.slice(0, (st.index ?? st.routes.length - 1) + 1) : [];
}

/** back to where the person started: every full-screen moment on top closes. The setup stays when SOS was opened from it, and
    so does Rekindle (the log): the comeback still has its plan to make, on the page where it was left. */
function leave(routes: Route[]) {
  let n = 0;
  while (n < routes.length - 1 && SCENE.test(routes[routes.length - 1 - n].name) && !(n > 0 && /^(setup|log)$/.test(routes[routes.length - 1 - n].name))) n++;
  if (n > 0) router.dismiss(n);
  else if (router.canDismiss()) router.dismissAll();
  else if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** the X on a full-screen moment: one step back. A lesson opened a writing page, a trace opened from the sunrise, a lesson opened
    from the Sunday review: the X returns to the screen the person came from, never past it. SOS opened from inside the setup
    closes back to the setup, on the page where it was left; Talk it through opened from SOS closes back to SOS, where the urge
    is still open. Opened directly (a web link), it goes to Today. (The log after a slip replaces SOS rather than sitting on it,
    since that SOS has ended, so its X does not go back to an SOS. SOS opened from Rekindle sits on it, and closes back to it.) */
export function close() {
  const routes = openRoutes();
  if (routes.length >= 2 && SCENE.test(routes[routes.length - 1].name)) {
    router.dismiss(1);
    return;
  }
  leave(routes);
}

/** finish a full-screen moment: every full-screen moment on top closes at once (SOS under it too), back to where the
    person started. close() is for the X, which goes one step back; this is for Done and the other finishing buttons. */
export function closeAll() {
  leave(openRoutes());
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
