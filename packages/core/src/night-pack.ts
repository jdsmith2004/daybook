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

/** one page of the walk: the app it happens in, what to do in big words, and the taps in order (the picture: the rows the
    person will see, top to bottom) */
export interface PackStep {
  app: 'Settings' | 'Shortcuts';
  say: string;
  taps: string[];
}

/** the next automation to set up after `from` (or the first one), skipping those already lit; null when every one is lit */
export function packNext(s: PackState, from?: PackKind): PackKind | null {
  const start = from ? PACK_KINDS.indexOf(from) + 1 : 0;
  return PACK_KINDS.slice(start).find((k) => !packLit(s, k)) ?? null;
}

/** the automations still to set up, in order */
export function packLeft(s: PackState): PackKind[] {
  return PACK_KINDS.filter((k) => !packLit(s, k));
}

/** each automation's name, what it does, and its walk (one step a page), in the person's own night time. Apple lets only the
    person make an automation, so every step is theirs; Daybook opens the right app for each one. */
export function packWords(k: PackKind, at: string): { title: string; line: string; walk: PackStep[] } {
  const auto = (when: string[]): PackStep => ({
    app: 'Shortcuts',
    say: 'In Shortcuts, start a new automation.',
    taps: ['Automation', 'The + at the top', ...when, 'Run Immediately', 'Notify When Run: off'],
  });
  const add = (action: string, extra: string[] = []): PackStep => ({
    app: 'Shortcuts',
    say: 'Add the action ' + action + ', then tap Done.',
    taps: ['Add Action', action, ...extra, 'Done'],
  });
  if (k === 'grey')
    return {
      title: 'The screen goes grey',
      line: 'At ' + at + ' every colour leaves the phone, and it comes back at 6 AM. A grey feed is a dull one.',
      walk: [
        {
          app: 'Settings',
          say: 'In Settings, choose grey as the colour filter.',
          taps: ['Accessibility', 'Display & Text Size', 'Color Filters', 'Grayscale'],
        },
        { app: 'Settings', say: 'Now turn Color Filters off again. The automation turns it on at night.', taps: ['Color Filters: off'] },
        { ...auto(['Time of Day', at + ', Daily']), say: 'In Shortcuts, start a new automation for ' + at + '.' },
        add('Set Color Filters', ['Set it to On']),
        { ...auto(['Time of Day', '6:00 AM, Daily']), say: 'One more, so colour comes back at 6 AM.' },
        add('Set Color Filters', ['Set it to Off']),
      ],
    };
  if (k === 'wait')
    return {
      title: 'Feeds wait first',
      line: 'From ' + at + ', opening one of them opens Daybook first, with a short wait. By day nothing changes.',
      walk: [
        { ...auto(['App', 'The apps that pull you in', 'Is Opened']), say: 'In Shortcuts, start a new automation for the apps that pull you in.' },
        add('Wait first at night', ['Open When Run: on']),
      ],
    };
  if (k === 'bed')
    return {
      title: 'Plugging in says good night',
      line: 'Put the phone on the charger late in the evening, and Good night opens. Once a night.',
      walk: [
        { ...auto(['Charger', 'Is Connected']), say: 'In Shortcuts, start a new automation for the charger.' },
        add('Good night, if it is late', ['Open When Run: on']),
      ],
    };
  return {
    title: 'The alarm opens the morning',
    line: 'Stop your alarm, and the morning is the first thing you see.',
    walk: [
      { ...auto(['Alarm', 'Is Stopped', 'Any Alarm']), say: 'In Shortcuts, start a new automation for your alarm.' },
      add('Open the morning', ['Open When Run: on']),
    ],
  };
}
