/* The night pack (docs/big-ideas.md, idea 5; WP21, November 12, 2026). At the hour the morning chose, the whole phone goes quiet,
   in the ordinary store build, with no Screen Time entitlement. Apple lets only the person make an automation, so Daybook cannot
   install one: it gives three actions to Shortcuts (apps/mobile/plugins/night-pack, App Intents) and a page that walks the person
   through four automations, one light each.

   - grey: the screen goes grey at tonight's start and colour comes back at 6 AM. Apple's own Set Color Filters action; Daybook is
     not in it at all.
   - wait: opening a chosen app at night opens Daybook's wait first (app/pause.tsx with `pk=1`). By day the action does nothing.
     After the wait, "Open it" lets the apps through for a few minutes; without that the automation would bring the wait back each
     time the app opened (no Shortcuts-only setup can break that loop, which is why this is an action and not a link).
   - bed: plugging into the charger in the late evening opens Good night. Once a night.
   - wake: stopping an alarm in the morning opens the morning.

   The actions decide by the same rule as here (`packActs`), from tonight's start, which the app writes on the phone each time it
   opens (`packNightAt`). Nothing of it leaves the phone, and nothing on the lock screen names the habit: the actions' names are
   plain ("Wait first at night", "Good night, if it is late", "Open the morning"). It is free (B6), like all care. */
import { tonightOf } from './morning-set';
import { PULL_NIGHT_END } from './pull';
import type { Clock, DayKey, Days, Settings } from './types';

export type PackKind = 'grey' | 'wait' | 'bed' | 'wake';
export const PACK_KINDS: PackKind[] = ['grey', 'wait', 'bed', 'wake'];

const clockMin = (t: Clock) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
/** the morning's end of the night, in minutes after midnight (6 AM) */
export const PACK_END = clockMin(PULL_NIGHT_END);
/** Good night from the charger: from an hour before tonight's start until 4 AM */
export const PACK_BED_EARLY = 60;
export const PACK_BED_END = 4 * 60;
/** the morning from the alarm: 4 AM to noon */
export const PACK_WAKE = [4 * 60, 12 * 60] as const;

/** tonight's start, in minutes after midnight, for the actions to read */
export function packNightAt(days: Days, st: Settings, tk: DayKey): number {
  return clockMin(tonightOf(days, st, tk).at);
}

/** whether minute m (after midnight) is in [from, to), across midnight when from > to */
const inSpan = (m: number, from: number, to: number) => (from > to ? m >= from || m < to : m >= from && m < to);

/** whether an action acts at minute `m` of the day, given tonight's start `at` (minutes). The Swift side
   (apps/mobile/plugins/night-pack/NightPackIntents.swift) runs this same rule; keep the two together. */
export function packActs(k: Exclude<PackKind, 'grey'>, m: number, at: number): boolean {
  if (k === 'wait') return inSpan(m, at, PACK_END);
  if (k === 'bed') return inSpan(m, (at - PACK_BED_EARLY + 1440) % 1440, PACK_BED_END);
  return inSpan(m, PACK_WAKE[0], PACK_WAKE[1]);
}

/** what the page keeps: which automations the person said are set, and when each action last ran (ms) */
export interface PackState {
  said: Partial<Record<PackKind, boolean>>;
  seen: Partial<Record<PackKind, number>>;
}

/** a light is lit once the person says the automation is set, or once Daybook has seen its action run */
export function packLit(s: PackState, k: PackKind): boolean {
  return !!s.said[k] || !!s.seen[k];
}

export function packLitCount(s: PackState): number {
  return PACK_KINDS.filter((k) => packLit(s, k)).length;
}

/** each automation's name, what it does, and how to make it, in the person's own night time */
export function packWords(k: PackKind, at: string): { title: string; line: string; steps: string[] } {
  const run = 'Pick Run Immediately and turn off Notify When Run.';
  if (k === 'grey')
    return {
      title: 'The screen goes grey',
      line: 'At ' + at + ' every colour leaves the phone, and it comes back at 6 AM. A grey feed is a dull one.',
      steps: [
        'In Settings, open Accessibility, then Display & Text Size, then Color Filters. Pick Grayscale, then turn Color Filters off again.',
        'In Shortcuts, open Automation and tap +. Pick Time of Day, set ' + at + ', Daily. ' + run,
        'Add the action Set Color Filters, and set it to On.',
        'Make one more at 6:00 AM with Set Color Filters set to Off.',
      ],
    };
  if (k === 'wait')
    return {
      title: 'Feeds wait first',
      line: 'From ' + at + ', opening one of them opens Daybook first, with a short wait. By day nothing changes.',
      steps: [
        'In Shortcuts, open Automation and tap +. Pick App, choose the apps that pull you in, and keep Is Opened. ' + run,
        'Add the action Wait first at night, from Daybook.',
      ],
    };
  if (k === 'bed')
    return {
      title: 'Plugging in says good night',
      line: 'Put the phone on the charger late in the evening, and Good night opens. Once a night.',
      steps: [
        'In Shortcuts, open Automation and tap +. Pick Charger, and keep Is Connected. ' + run,
        'Add the action Good night, if it is late, from Daybook.',
      ],
    };
  return {
    title: 'The alarm opens the morning',
    line: 'Stop your alarm, and the morning is the first thing you see.',
    steps: ['In Shortcuts, open Automation and tap +. Pick Alarm, then Is Stopped, and Any Alarm. ' + run, 'Add the action Open the morning, from Daybook.'],
  };
}
