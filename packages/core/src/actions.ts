/* Changes to settings, as pure functions: each takes the settings and returns new ones, with what to tell the person.
   They follow the legacy action handlers exactly (see legacy/index.html, the 'clean-mode', 'step-on' ... cases). */
import { addDays, diffDays, fmtDate, isKey, isTime, normRoutine, normSettings, phaseOf, ROUTINE_KEYS, TOOLS } from './legacy/core.js';
import type { CountMode, DayKey, Settings } from './types';

/** the next change time for a record: now, and always later than the last change (legacy nextU) */
export function nextU(prev: { u?: number } | null | undefined, now = Date.now()): number {
  return Math.max(now, ((prev && prev.u) || 0) + 1);
}

/** a change to settings, saved the way the legacy saveSettings does: cleaned up, with a new change time */
export function changeSettings(prev: Settings, fn: (s: Settings) => void, now = Date.now()): Settings {
  const cur = JSON.parse(JSON.stringify(prev)) as Settings;
  fn(cur);
  const u = nextU(prev, now);
  const out = normSettings(cur);
  out.u = u;
  return out;
}

export interface Change {
  st: Settings;
  toast?: string;
}

export const COUNT_TOAST: Record<CountMode, string> = {
  strict: 'Counting strictly. A day counts with no slip.',
  gentle: 'Counting gently. A day counts with one slip or fewer.',
  step: 'Step down is on: longer stretches between slips, fewer slips each week.',
};

/** Settings: how days are counted */
export function setCountMode(st: Settings, mode: string, tk: DayKey): Change {
  const m: CountMode = mode === 'gentle' || mode === 'step' ? mode : 'strict';
  return {
    st: changeSettings(st, (s) => {
      if (s.cleanMode !== 'step' && m === 'step') s.stepAt = tk;
      s.cleanMode = m;
      s.cleanNote = null;
      s.cleanHold = m === 'step' ? null : tk;
    }),
    toast: COUNT_TOAST[m],
  };
}

/** Settings: switch to step down by itself in a rough stretch */
export function setCleanAuto(st: Settings, on: boolean): Change {
  return { st: changeSettings(st, (s) => void (s.cleanAuto = on)) };
}

/** Today: "Try step down" on the offer */
export function stepOn(st: Settings, tk: DayKey): Change {
  return {
    st: changeSettings(st, (s) => {
      s.cleanMode = 'step';
      s.stepAt = tk;
      s.cleanNote = null;
      s.cleanHold = null;
    }),
    toast: COUNT_TOAST.step,
  };
}

/** Today: "Not now" on the offer. It waits two weeks. */
export function stepNo(st: Settings, tk: DayKey): Change {
  return { st: changeSettings(st, (s) => void (s.stepNo = tk)), toast: 'Okay. You can turn it on any time in Settings.' };
}

/** Today: "Start counting days" once step down is done */
export function stepGrad(st: Settings, tk: DayKey): Change {
  return {
    st: changeSettings(st, (s) => {
      s.cleanMode = 'strict';
      s.cleanHold = tk;
      s.stepGrad = tk;
      s.cleanNote = null;
    }),
    toast: 'Counting days now. Your run starts from your last slip.',
  };
}

/** Today: "Okay" on the note after counting changed by itself */
export function cleanOk(st: Settings): Change {
  return { st: changeSettings(st, (s) => void (s.cleanNote = null)) };
}

/** Today: "Keep counting days" on that note. It holds for two weeks. */
export function cleanKeep(st: Settings, tk: DayKey): Change {
  return {
    st: changeSettings(st, (s) => {
      s.cleanMode = 'strict';
      s.cleanNote = null;
      s.cleanHold = tk;
    }),
    toast: 'Okay. Counting strictly.',
  };
}

/** the switch to step down that shouldAutoStep asks for (legacy cleanAutoCheck), with the note Today shows once */
export function autoStep(st: Settings, tk: DayKey): Change {
  return {
    st: changeSettings(st, (s) => {
      s.cleanMode = 'step';
      s.stepAt = tk;
      s.cleanNote = { on: tk, m: 'step' };
    }),
  };
}

/* ---------- where I am: tracking week, just tracking, quitting, or stepping down ---------- */
export interface ModeInfo {
  k: 'before' | 'step' | 'quit' | 'week' | 'track';
  title: string;
  line: string;
}
/** the "Where I am" sheet's first line (legacy modeInfo) */
export function modeInfo(st: Settings, tk: DayKey): ModeInfo {
  const ph = phaseOf(tk, st);
  const d1 = st.day1;
  const long = (d: DayKey) => fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' });
  if (ph.p === 'before') return { k: 'before', title: 'Not started yet', line: 'Tracking starts ' + long(st.start) + '.' };
  if (ph.p === 'quitting')
    return st.cleanMode === 'step'
      ? { k: 'step', title: 'Stepping down', line: 'Day ' + ph.n + '. Day 1 was ' + long(d1!) + '.' }
      : { k: 'quit', title: 'Quitting', line: 'Day ' + ph.n + '. Day 1 was ' + long(d1!) + '.' };
  if (d1) {
    const len = diffDays(d1, st.start);
    return { k: 'week', title: len === 7 ? 'Tracking week' : 'Tracking', line: 'Day ' + ph.n + ' of ' + len + '. Day 1 is ' + long(d1) + '.' };
  }
  return { k: 'track', title: 'Just tracking', line: 'Day ' + ph.n + '. No Day 1 is set, so no days are being counted.' };
}
/** the buttons the sheet offers, for where you are */
export function modeActs(st: Settings, tk: DayKey, k: ModeInfo['k']): [string, 'none' | 'later' | 'today' | 'tomorrow' | 'week'][] {
  const d1 = st.day1;
  const tom = addDays(tk, 1);
  if (k === 'before') return [];
  if (k === 'quit' || k === 'step') return [['Just track for now', 'none']];
  if (k === 'week')
    return [
      ...(d1 && d1 > tom ? ([['Start Day 1 tomorrow', 'tomorrow']] as [string, 'tomorrow'][]) : []),
      ['A week later', 'later'],
      ['Just track, no Day 1', 'none'],
    ];
  return [...(tk > st.start ? ([['Start Day 1 today', 'today']] as [string, 'today'][]) : []), ['Start Day 1 tomorrow', 'tomorrow'], ['In a week', 'week']];
}
/** a Day 1 button (legacy 'day1' action) */
export function setDay1(st: Settings, v: 'none' | 'later' | 'today' | 'tomorrow' | 'week', tk: DayKey): Change {
  const next = changeSettings(st, (s) => {
    if (v === 'none') s.day1 = null;
    else if (v === 'later') s.day1 = addDays(s.day1 || addDays(s.start, 7), 7);
    else if (v === 'today') {
      if (tk > s.start) s.day1 = tk;
    } else if (v === 'tomorrow') s.day1 = addDays(tk, 1);
    else if (v === 'week') s.day1 = addDays(tk, 7);
  });
  const d1 = next.day1;
  return {
    st: next,
    toast: !d1
      ? 'Just tracking. Nothing is counted, and you can start a Day 1 any time.'
      : d1 <= tk
        ? 'Day 1 is today. Days with no slip logged will count.'
        : 'Day 1 is ' + fmtDate(d1, { weekday: 'long', month: 'short', day: 'numeric' }) + '.',
  };
}
/** a date picked for Day 1 (it has to come after the tracking start), or for the tracking start */
export function setDate(st: Settings, k: 'start' | 'day1', v: string | null): Change {
  if (k === 'start') {
    if (!v || !isKey(v)) return { st };
    return {
      st: changeSettings(st, (s) => {
        s.start = v;
        if (s.day1 && s.day1 <= v) s.day1 = addDays(v, 7);
      }),
    };
  }
  if (!v) return { st: changeSettings(st, (s) => void (s.day1 = null)) };
  if (isKey(v) && v > st.start) return { st: changeSettings(st, (s) => void (s.day1 = v)) };
  return { st, toast: 'Day 1 has to come after the tracking start.' };
}
export const MODE_LEGEND = (st: Settings): [ModeInfo['k'], string, string][] => [
  [
    'week',
    st.day1 && diffDays(st.day1, st.start) !== 7 ? 'Tracking' : 'Tracking week',
    'You only log and look. Nothing is counted, so there is nothing to fail. The first week always works this way.',
  ],
  [
    'quit',
    'Quitting',
    'Starts on Day 1. A day with no slip logged counts, and your run grows. The first slip in any 7 days can be saved: finish the Rekindle quest by the next night and the run keeps going. Your points, badges and longest run always stay.',
  ],
  [
    'step',
    'Stepping down',
    'For when slips happen most days. Instead of a run you lose every day or two, you aim for longer stretches between slips and fewer slips each week. When you are ready, Daybook offers to start counting days.',
  ],
  [
    'track',
    'Just tracking',
    'For when you are not ready to quit. Urges, check-ins, lessons and tools all work the same. No Day 1 and no count. Start one whenever you like, or never.',
  ],
];

/* ---------- Settings (the legacy rt-set, data-set, data-urpin and celebrate handlers) ---------- */
/** the usual routine: one part of the day on or off */
export const setRoutine = (st: Settings, k: string, on: boolean): Settings =>
  ROUTINE_KEYS.indexOf(k) < 0
    ? st
    : changeSettings(st, (s) => {
        s.routine = normRoutine(s.routine) as Settings['routine'];
        (s.routine as Record<string, boolean>)[k] = on;
      });
/** screens off by, as HH:MM. Anything that is not a time is ignored. */
export const setScreensOffTime = (st: Settings, v: string): Settings => (isTime(v) ? changeSettings(st, (s) => void (s.screensOff = v)) : st);
/** the hour a new day starts, 0 (midnight) to 6 */
export const setRollover = (st: Settings, h: number): Settings => changeSettings(st, (s) => void (s.rollover = h));
/** the tool SOS suggests first, or null for the best fit */
export const setUrPin = (st: Settings, id: string | null): Settings =>
  changeSettings(st, (s) => void (s.urPin = id && (TOOLS as { id: string }[]).some((t) => t.id === id) ? id : null));
export const setCelebrate = (st: Settings, on: boolean): Settings => changeSettings(st, (s) => void (s.celebrate = on));
/** a clock time moved by some minutes, around the clock (for the screens-off stepper) */
export function stepClock(t: string, d: number): string {
  const [h, m] = t.split(':').map(Number);
  const x = (((h * 60 + m + d) % 1440) + 1440) % 1440;
  return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
}
