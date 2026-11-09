/* The flame on the Home Screen and the Lock Screen (the owner, November 9, 2026): the flame as it burns now, and one short line.
   A Home Screen is seen by others, so nothing here says what Daybook is for, and there is no count of days to protect (docs/plan.md:
   "a Home Screen widget with the day count" was ruled out). Only the fire and the next choice.

   The widget cannot run the app's rules, so the app hands it a short timeline when it opens: the fire now, and how it will burn at the
   start of each of the next days if nothing is done (flame-low.ts). So it dims on its own while the app stays closed, and the first
   thing done lights it again (the app opens, and makes the timeline again).

   Putting it on a screen earns WIDGET_PTS once (core.js totalPoints, Settings.widget), kept for good. Checked by test/flame-widget.test.ts. */
import { fireLow, LOW_OF } from './flame-low';
import { riskAt } from './risk';
import { addDays } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

export type WidgetState = 'lit' | 'warn' | 'dim' | 'embers';

export interface WidgetEntry {
  /** when it starts showing, in ms */
  at: number;
  state: WidgetState;
  /** how low it burns, 0 to 1 (the picture the app made for it) */
  low: number;
  /** the line under the flame: short, about the fire, never about what Daybook is for */
  line: string;
}

/** the line under the flame for each state */
export const WIDGET_LINE: Record<WidgetState, string> = {
  lit: 'Burning bright',
  warn: 'Burns lower tomorrow',
  dim: 'Your fire is dimming',
  embers: 'Down to embers',
};

/** the days ahead the widget is told about: past this it is as low as it goes */
export const WIDGET_DAYS = 4;

const stateOf = (f: ReturnType<typeof fireLow>): WidgetState => (f.step >= 2 ? 'embers' : f.step === 1 ? 'dim' : f.warn ? 'warn' : 'lit');

/** what the widget shows now, and at the start of each of the next days if nothing more is done */
export function widgetTimeline(days: Days, st: Settings | null, tk: DayKey, nowMs: number): WidgetEntry[] {
  const out: WidgetEntry[] = [];
  const push = (at: number, k: DayKey) => {
    const f = fireLow(days, st, k, at);
    const state = stateOf(f);
    if (out.length && out[out.length - 1].state === state) return;
    out.push({ at, state, low: f.step ? LOW_OF[f.step] : 0, line: WIDGET_LINE[state] });
  };
  push(nowMs, tk);
  for (let i = 1; i <= WIDGET_DAYS; i++) {
    const k = addDays(tk, i);
    /* the moment that day starts (the person's rollover), and a minute in */
    push(riskAt(k, st?.rollover ?? 0, st?.rollover ?? 0, 1), k);
  }
  return out;
}

/* ---------- the unlock (the owner, November 9, 2026: "widget unlocked, add it to your screen for 30 points") ----------
   It joins the unlocks (unlock.ts, on the Screen Time branch until it merges) as the last one: day 14, after Reached out (day 10) and
   UNLOCK_GAP, so it never lands near another. iPhone only, and only while it is on no screen yet. Its page shows how to add it. */
/** the day it is unlocked from (the first day is 1) */
export const WIDGET_UNLOCK_DAY = 14;
export const WIDGET_UNLOCK = {
  eb: 'Unlocked',
  h: 'Your flame on your Home Screen',
  title: 'Put your flame on your Home Screen',
  line: 'It shows no count and nothing about what Daybook is for.',
  say: 'See your fire every time you pick up your phone. When you drift, you see it dim before you open anything. Add it for 30 points.',
  btn: 'Done, I added it',
  /** how to add it, one step at a time */
  steps: ['Touch and hold an empty spot on your Home Screen.', 'Tap Edit, then Add Widget.', 'Find Daybook, and add Your flame.'],
};
