/* Changes to settings, as pure functions: each takes the settings and returns new ones, with what to tell the person.
   They follow the legacy action handlers exactly (see legacy/index.html, the 'clean-mode', 'step-on' ... cases). */
import { normSettings } from './legacy/core.js';
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
