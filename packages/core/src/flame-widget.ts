/* The flame on the Home Screen and the Lock Screen (the owner, November 9 and 12, 2026: "the duolingo widgets look really nice i
   want more like that"). Like Duolingo's: the mascot big and full of feeling, one short line in its own voice that changes through the
   day, a week row that shows at a glance which days fed it, and a plain SOS that says where it goes.

   A Home Screen is seen by others, so nothing here says what Daybook is for, and there is no count of days to protect (docs/plan.md:
   "a Home Screen widget with the day count" was ruled out). The week row marks days the fire was fed, not days without the habit.
   Every word here is checked by test/lock-screen.test.ts (through WIDGET_LINE and WIDGET_NEXT).

   The widget cannot run the app's rules, so the app hands it a timeline when it opens: how the flame looks and what it says now, and at
   each turn of the coming days (dawn, the morning's end, noon, evening, tonight, the new day) if nothing more is done. So it dims, falls
   asleep and wakes on its own while the app stays closed, and the first thing done lights it again (the app opens and makes it again).

   In the morning (morning-set.ts morningDue) it asks the morning's first question. Free of it is a button on the Home Screen widget: the
   widget keeps the answer, and the app writes it through answerNight the next time it opens (widgetTold). It happened opens the morning
   page instead, so that answer always lands where the care is, never on a Home Screen.

   Putting it on a screen earns WIDGET_PTS once (core.js totalPoints, Settings.widget), kept for good. Checked by test/flame-widget.test.ts. */
import { changeSettings } from './actions';
import { fireLow, lastSlipMs, LOW_OF, partDone } from './flame-low';
import { SLIP_HOURS } from './hero';
import { addDays, logicalKey } from './legacy/core.js';
import { MORNING_FROM, MORNING_TO, MORNING_WORDS, morningDue, morningOf, nightAtStart } from './morning-set';
import { riskAt } from './risk';
import type { DayKey, Days, Settings } from './types';

/** how the fire burns: lit, lit but lower tomorrow, dim, down to embers */
export type WidgetState = 'lit' | 'warn' | 'dim' | 'embers';
/** the flame's face: bright (fed today, or after a hard night, warm), waiting (not fed yet), low (sad, drained), asleep (the night) */
export type WidgetMood = 'bright' | 'waiting' | 'low' | 'asleep';
/** the part of the day, for the sky and the words */
export type WidgetPart = 'morning' | 'day' | 'evening' | 'night';

export interface WidgetEntry {
  /** when it starts showing, in ms */
  at: number;
  state: WidgetState;
  mood: WidgetMood;
  part: WidgetPart;
  /** how low it burns, 0 to 1 (the picture the app made for it) */
  low: number;
  /** the flame's line: short, in its own voice, never about what Daybook is for */
  line: string;
  /** the second line the bigger widgets show: the next choice */
  next: string;
  /** the last seven days, oldest first: x fed, o not fed, - before the start, t today and not fed yet, f today and fed */
  week: string;
  /** the first letter of each of those days: "TWTFSSM" */
  wd: string;
  /** the log day whose morning is asked now ("How was last night?"), when it is */
  ask: DayKey | null;
}

/** the flame's words, by when and how it burns. Firm about the next choice, warm after a hard day, and never about who the person is */
export const WIDGET_WORDS = {
  ask: { line: MORNING_WORDS.night, next: 'One tap tells me.' },
  told: { line: 'Good morning. I am burning.', next: 'That feeds me. Today is yours.' },
  fed: { line: 'Burning bright', next: 'You fed me today. That is how I grow.' },
  /** in the hours after a slip: warm, and nothing that hints at it (never piled on, CLAUDE.md "Hope is not softness") */
  after: { line: 'Still here. Today is open.', next: 'One step today feeds me.' },
  morning: { line: 'Ready when you are', next: 'One step today feeds me.' },
  day: { line: 'Feed me today?', next: 'One step today feeds me.' },
  evening: { line: 'The day is closing. Feed me?', next: 'One step before bed feeds me.' },
  warn: { line: 'I burn lower tomorrow', next: 'One step today keeps me burning.' },
  dim: { line: 'You are letting me dim', next: 'One step today lights me again.' },
  embers: { line: 'Down to embers. Come back.', next: 'One step lights me again.' },
  night: { line: 'Sleep well. I keep watch.', next: 'See you in the morning.' },
} as const;

/** every line the widget can show, for the lock-screen test */
export const WIDGET_LINE: Record<keyof typeof WIDGET_WORDS, string> = Object.fromEntries(Object.entries(WIDGET_WORDS).map(([k, v]) => [k, v.line])) as Record<
  keyof typeof WIDGET_WORDS,
  string
>;
export const WIDGET_NEXT: Record<keyof typeof WIDGET_WORDS, string> = Object.fromEntries(Object.entries(WIDGET_WORDS).map(([k, v]) => [k, v.next])) as Record<
  keyof typeof WIDGET_WORDS,
  string
>;

/** the SOS widget and the SOS button: where it goes, plainly, with nothing about why */
export const WIDGET_SOS = { label: 'SOS', line: 'A hard moment?', next: 'Tap. I am here.' } as const;

/** the sky behind the flame, top to bottom: dawn, a rich day blue (Duolingo's), dusk, the campfire's night, and a cold charcoal while
    it burns low, a cold ash light enough that the drained flame still stands out (the owner, November 12, 2026: the flame is never hidden) */
export const WIDGET_SKY: Record<WidgetPart | 'low', string[]> = {
  morning: ['#2A2470', '#5B3C8C', '#B85A78', '#E89A5C'],
  day: ['#16226B', '#1F3A9E', '#2D55C8'],
  evening: ['#1B1650', '#3A2368', '#7A3354', '#B0522E'],
  night: ['#120E30', '#221A4E', '#4A2346', '#8A3A2A'],
  low: ['#3C4256', '#545B6F', '#6E7486'],
};
/** the sky for one entry */
export const widgetSky = (e: Pick<WidgetEntry, 'part' | 'mood'>): string[] => WIDGET_SKY[e.mood === 'low' ? 'low' : e.part];

/** the days ahead the widget is told about: past this it is as low as it goes */
export const WIDGET_DAYS = 4;
/** where the day turns, in hours: noon (morning to day) and evening */
const NOON = 12;
const EVENING = 18;

const stateOf = (f: ReturnType<typeof fireLow>): WidgetState => (f.step >= 2 ? 'embers' : f.step === 1 ? 'dim' : f.warn ? 'warn' : 'lit');
const minOf = (c: string) => +c.slice(0, 2) * 60 + +c.slice(3, 5);

/** the part of the day at a moment, by the phone's clock: night runs from tonight's time (morning-set.ts nightAtStart) to MORNING_FROM */
export function widgetPart(at: number, st: Settings | null): WidgetPart {
  const d = new Date(at);
  const m = d.getHours() * 60 + d.getMinutes();
  const night = minOf(st ? nightAtStart(st) : '22:30');
  const dawn = MORNING_FROM * 60;
  /* a night time after midnight (00:30) starts in the small hours */
  const asleep = night < NOON * 60 ? m >= night && m < dawn : m >= night || m < dawn;
  if (asleep) return 'night';
  return m < NOON * 60 ? 'morning' : m < EVENING * 60 ? 'day' : 'evening';
}

/** the week row for log day k: the six days before it and k itself */
export function widgetWeek(days: Days, st: Settings | null, k: DayKey): { week: string; wd: string } {
  let week = '';
  let wd = '';
  for (let i = 6; i >= 0; i--) {
    const d = addDays(k, -i);
    const [y, m, dd] = d.split('-').map(Number);
    wd += 'SMTWTFS'[new Date(y, m - 1, dd).getDay()];
    const fed = !!st && partDone(days, st, d);
    if (!st || !st.start || d < st.start) week += '-';
    else if (i === 0) week += fed ? 'f' : 't';
    else week += fed ? 'x' : 'o';
  }
  return { week, wd };
}

/** what the widget shows at one moment, if nothing more is done before it */
export function widgetAt(days: Days, st: Settings | null, at: number): Omit<WidgetEntry, 'at'> {
  const k = logicalKey(at, st?.rollover ?? 4);
  const f = fireLow(days, st, k, at);
  const state = stateOf(f);
  const part = widgetPart(at, st);
  const fed = !!st && partDone(days, st, k);
  const slipAt = st ? lastSlipMs(days, st, k) : null;
  const fresh = slipAt != null && at - Math.min(slipAt, at) < SLIP_HOURS * 36e5;
  const ask = st && morningDue(days, st, k, at) && !morningOf(days[k])?.n ? k : null;
  const low = f.step ? LOW_OF[f.step] : 0;
  const w =
    part === 'night'
      ? WIDGET_WORDS.night
      : ask
        ? WIDGET_WORDS.ask
        : fed
          ? WIDGET_WORDS.fed
          : fresh
            ? WIDGET_WORDS.after
            : state !== 'lit'
              ? WIDGET_WORDS[state]
              : WIDGET_WORDS[part];
  const mood: WidgetMood = part === 'night' ? 'asleep' : fed || fresh ? 'bright' : low > 0 ? 'low' : 'waiting';
  return { state, mood, part, low, line: w.line, next: w.next, ask, ...widgetWeek(days, st, k) };
}

/** what the widget shows now, and at each turn of the next days if nothing more is done */
export function widgetTimeline(days: Days, st: Settings | null, tk: DayKey, nowMs: number): WidgetEntry[] {
  const out: WidgetEntry[] = [];
  const same = (a: Omit<WidgetEntry, 'at'>, b: WidgetEntry) =>
    a.line === b.line && a.mood === b.mood && a.part === b.part && a.low === b.low && a.week === b.week && a.ask === b.ask;
  const push = (at: number) => {
    const e = widgetAt(days, st, at);
    if (out.length && same(e, out[out.length - 1])) return;
    out.push({ at, ...e });
  };
  push(nowMs);
  const roll = st?.rollover ?? 4;
  const night = st ? nightAtStart(st) : '22:30';
  const turns: number[] = [];
  for (let i = 0; i <= WIDGET_DAYS; i++) {
    const k = addDays(tk, i);
    /* the new log day, a minute in; dawn; the morning's end; noon; evening; tonight */
    turns.push(riskAt(k, roll, roll, 1), riskAt(k, MORNING_FROM, roll), riskAt(k, MORNING_TO, roll), riskAt(k, NOON, roll));
    turns.push(riskAt(k, EVENING, roll), riskAt(k, +night.slice(0, 2), roll, +night.slice(3, 5)));
  }
  for (const t of [...new Set(turns)].sort((a, b) => a - b)) if (t > nowMs) push(t);
  return out;
}

/* ---------- the morning's answer from the Home Screen (WP20) ---------- */

/** an answer the widget kept: the log day whose morning it answers, and when it was tapped */
export interface WidgetTold {
  k: DayKey;
  at: number;
}

/** the answers the widget kept that still need writing: only Free of it, only for a morning not answered yet (in the app, or before),
    only from the last two days, the latest tap for each day. The app writes each through answerNight. */
export function widgetTold(days: Days, st: Settings | null, kept: { told?: unknown; toldK?: unknown; toldAt?: unknown }[], tk: DayKey): WidgetTold[] {
  if (!st) return [];
  const by = new Map<DayKey, number>();
  for (const p of kept) {
    if (p.told !== 'free' || typeof p.toldK !== 'string' || typeof p.toldAt !== 'number') continue;
    const k = p.toldK as DayKey;
    if (k > tk || k < addDays(tk, -1) || k <= st.start || morningOf(days[k])?.n) continue;
    by.set(k, Math.max(by.get(k) ?? 0, p.toldAt));
  }
  return [...by].map(([k, at]) => ({ k, at })).sort((a, b) => (a.k < b.k ? -1 : 1));
}

/* ---------- the ask (the owner, November 12, 2026: like Duolingo's "Add the widget" page) ---------- */
/** the earliest day it is offered (the first day is 1): once a few days have shown what the flame is */
export const WIDGET_ASK_DAY = 3;
/** offered once, iPhone only, while it is on no screen, on a day the fire was fed, never in the hours after a slip */
export function widgetAskDue(days: Days, st: Settings | null, tk: DayKey, now: number): boolean {
  if (!st || !st.start || st.widget || st.widgetAsk) return false;
  if (addDays(st.start, WIDGET_ASK_DAY - 1) > tk || !partDone(days, st, tk)) return false;
  const slipAt = lastSlipMs(days, st, tk);
  return !(slipAt != null && now - Math.min(slipAt, now) < SLIP_HOURS * 36e5);
}

/** the ask was shown: never again */
export const widgetAsked = (st: Settings, tk: DayKey, now = Date.now()): Settings => changeSettings(st, (s) => void (s.widgetAsk = tk), now);

export const WIDGET_ASK = {
  title: 'Your flame, on your Home Screen',
  say: 'It wakes with you, asks about the night, and dims when you drift. SOS is one tap away.',
  line: 'It shows no count and nothing about what Daybook is for.',
  btn: 'Add the widget',
  done: 'Done, I added it',
  pts: 'Add it for 30 points.',
  /** how to add it, one step at a time */
  steps: ['Touch and hold an empty spot on your Home Screen.', 'Tap Edit, then Add Widget.', 'Find Daybook, and add Your flame.'],
};
