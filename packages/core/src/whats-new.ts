/* What's new (the owner, November 2, 2026): after an update, one page says briefly what was added. It opens once, on the
   first open of the new version where nothing else should come first, and it is kept as the last version seen on this
   device (never synced). Never for someone who just installed (they meet it all in setup), never before or during setup,
   never in the hours after an SOS or on the day of a slip, never on the day the person came back, and never on top of
   another full-screen moment. Several versions skipped: only what is new since the last one seen, newest first, three at
   most. A store build with no entry here is recorded quietly. Before each store build, the entry for its version is
   written here (docs/launch.md). Checked by test/whats-new.test.ts. */
import { eventsOf, logicalKey } from './legacy/core.js';
import { tipQuiet } from './support';
import type { Days, Settings } from './types';

/** the picture beside an item: the flame by default, or a small drawing of the part it is about */
export type NewArt = 'flame' | 'week' | 'plan' | 'when';

export interface NewItem {
  t: string;
  line: string;
  art?: NewArt;
}

/** newest version first. Each version names what people would notice most, in the order the page shows them. */
export const WHATS_NEW: { v: string; items: NewItem[] }[] = [
  {
    v: '1.3.1',
    items: [
      {
        t: 'A Sunday review that reads your week',
        line: 'It says how the week really went, in plain numbers, and ends with one step for next week from your own pattern.',
        art: 'week',
      },
      {
        t: 'Your plan for next time, in your words',
        line: 'After a slip, Rekindle ends on your own sentence, and the flame reminds you when the hour comes.',
        art: 'plan',
      },
      {
        t: 'When it happened, in a moment',
        line: 'The new day and time picker turns like the clock and reaches back a whole month.',
        art: 'when',
      },
    ],
  },
];

/** the version before this page existed: a person with a log and no version kept has updated from it */
export const NEW_BASE = '1.3.0';
/** the most a page says, however many versions were skipped */
export const NEW_MAX = 3;

/** compares two versions like 1.3.0 and 1.10.2, part by part */
export function verCmp(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** what was added after `seen`, up to and including `now`: the newest version first, NEW_MAX items at most */
export function newSince(seen: string, now: string, list = WHATS_NEW): NewItem[] {
  return [...list]
    .filter((e) => verCmp(e.v, seen) > 0 && verCmp(e.v, now) <= 0)
    .sort((a, b) => verCmp(b.v, a.v))
    .flatMap((e) => e.items)
    .slice(0, NEW_MAX);
}

export interface NewNear {
  /** the settings, or null before setup is finished */
  st: Settings | null;
  days: Days;
  now: number;
  /** when SOS was last opened (core urLastAt), or null */
  sos: number | null;
  /** the person came back today after days away */
  back: boolean;
  /** something else is on the screen or about to open: a page, a sheet, a celebration, Welcome back, graduation */
  busy: boolean;
}

/** what to do on this open: `keep` records the version with nothing shown, `show` opens the page (and records the version
    once it is open), `wait` leaves it for a later open, and `none` has nothing to do */
export type NewStep = { k: 'none' } | { k: 'keep' } | { k: 'wait' } | { k: 'show'; items: NewItem[] };

export function whatsNew(seen: string | null, now: string, near: NewNear, list = WHATS_NEW): NewStep {
  if (!now) return { k: 'none' };
  /* a new install, or setup not finished yet: everything is new, and setup shows it, so this version counts as seen */
  if (!near.st) return seen === now ? { k: 'none' } : { k: 'keep' };
  const from = seen ?? NEW_BASE;
  if (verCmp(from, now) >= 0) return seen === now ? { k: 'none' } : { k: 'keep' };
  const items = newSince(from, now, list);
  if (!items.length) return { k: 'keep' };
  if (near.busy || near.back || newQuiet(near.days, near.st, near.now, near.sos)) return { k: 'wait' };
  return { k: 'show', items };
}

/** the hours after an SOS or a slip (core tipQuiet), and the rest of a day with a slip in it */
function newQuiet(days: Days, st: Settings, now: number, sos: number | null): boolean {
  if (tipQuiet(days, st, { now, sos })) return true;
  return eventsOf(days, logicalKey(now, st.rollover)).some((e) => e.outcome === 'slipped');
}
