/* The fire burns lower when the person stops doing their part (the owner, November 8, 2026: "if they don't work hard they are giving up something";
   CLAUDE.md, "Hope is not softness: there are stakes"). The owner's calls, the same day:
   - Drifting is days in a row with none of their part done: anything that earns points (a lesson, a check-in, an urge ridden out, an honest log,
     a calm move...), a tool, a talk-through, a feeling named. Opening the app alone is not their part. A slip logged honestly is their part, so
     honesty never dims the fire.
   - It never goes all the way out. One day with nothing done: a warning, and the fire still burns fully. Two days: it burns lower. Three or more:
     it is down to embers, smokes and sputters, with one ember always glowing. (First 2, 3 and 5 days; the owner found that too slow, November 9,
     2026, and wanted what showed at six days to show at three, so the smouldering step between is passed straight through.)
   - The first thing done again lights it fully, at once, with the re-light moment (components/big-flame.tsx).
   - The words are on Today only (components/hero.tsx), and they are about the next choice, never about who the person is.
   Only the fire's glow changes: level, form, points and badges never move. And never in the hours after a slip (SLIP_HOURS, the same 72 hours
   the hero shows the time since one), when the job is to bring the person back. Today itself does not count against them until it is over.
   Checked by test/flame-low.test.ts. */
import { SLIP_HOURS } from './hero';
import { addDays, dayPoints, diffDays, evMs, sumDay } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** days in a row with nothing done before the fire burns lower, smoulders, and is down to embers */
export const LOW_AT: [number, number, number] = [2, 3, 3];
/** how low each step burns, 0 burning fully and 1 as low as it goes */
export const LOW_OF = [0, 0.6, 0.8, 1] as const;
/** the farthest back it looks: past this it is as low as it goes anyway */
const LOOK_BACK = 14;

export type LowStep = 0 | 1 | 2 | 3;
export interface FireLow {
  /** how low it burns now */
  step: LowStep;
  low: number;
  /** whole days in a row before today with nothing done */
  idle: number;
  /** how low it was burning before what was done today: above 0 when today lit it again */
  was: LowStep;
  /** the day before it burns lower: nothing done yesterday and nothing yet today. Today warns, and so does the day's reminder. */
  warn: boolean;
  /** it burns lower because the hard hours' notes were ignored (Screen Time, pull.ts pullDrift), not for days with nothing done */
  pull?: boolean;
}

/** whether the person did their part on a day: anything that earns points, a tool, a talk-through or a feeling named */
export function partDone(days: Days, st: Settings, k: DayKey): boolean {
  const d = days[k];
  if (!d) return false;
  if (dayPoints(days, k, st).total > 0) return true;
  const p = d.p;
  return !!p && ((p.tl?.length ?? 0) > 0 || (p.tt?.length ?? 0) > 0 || (p.fe?.length ?? 0) > 0);
}

const stepOf = (idle: number): LowStep => (idle >= LOW_AT[2] ? 3 : idle >= LOW_AT[1] ? 2 : idle >= LOW_AT[0] ? 1 : 0);

/** the latest slip logged, in ms, looking back far enough for SLIP_HOURS */
export function lastSlipMs(days: Days, st: Settings, tk: DayKey): number | null {
  for (let i = 0; i <= 4; i++) {
    const k = addDays(tk, -i);
    if (!sumDay(days[k]).slipped) continue;
    return Math.max(...days[k].events.filter((e) => e.outcome === 'slipped').map((e) => evMs(k, e.time, st.rollover)));
  }
  return null;
}

/** how low the fire burns today */
export function fireLow(days: Days, st: Settings | null, tk: DayKey, nowMs: number): FireLow {
  const none: FireLow = { step: 0, low: 0, idle: 0, was: 0, warn: false };
  if (!st || !st.start || tk <= st.start) return none;
  /* the days before today with nothing done, back to the start */
  const back = Math.min(LOOK_BACK, diffDays(tk, st.start));
  let idle = 0;
  while (idle < back && !partDone(days, st, addDays(tk, -1 - idle))) idle++;
  const at = lastSlipMs(days, st, tk);
  const fresh = at != null && nowMs - Math.min(at, nowMs) < SLIP_HOURS * 36e5;
  const before = fresh ? 0 : stepOf(idle);
  if (partDone(days, st, tk)) return { step: 0, low: 0, idle: 0, was: before, warn: false };
  return { step: before, low: LOW_OF[before], idle, was: before, warn: !fresh && idle === LOW_AT[0] - 1 };
}

/** the words on Today while it burns low: a big line for what is happening, then what it cost and the one thing that lights it again, firm
    and plain, about the next choice. Big and few, after Duolingo's lapsed screens: the flame carries the feeling, the words say why. */
export function lowWords(f: FireLow): { h: string; p: string; fix: string } | null {
  if (!f.step) return null;
  const p = f.pull ? 'You stayed on it through your hard hours.' : f.idle + ' days with nothing done.';
  const fix = 'One lesson today lights it again.';
  if (f.step === 1) return { h: 'You are dimming your fire', p, fix };
  if (f.step === 2) return { h: 'Your fire is smouldering', p, fix };
  return { h: 'Your fire is down to embers', p, fix };
}
/** the words on Today the day before it burns lower, while the flame still burns fully */
export const LOW_WARN = { h: 'Your fire burns lower tomorrow', p: 'Nothing done yesterday.', fix: 'One lesson today keeps it burning.' };
/** the day's reminder, the day before it burns lower */
export const LOW_WARN_NOTE = { t: 'Your fire burns lower tomorrow 🔥', b: 'Do one thing today to keep it burning. Today’s lesson takes a few minutes.' };
/** the evening note, a last call, on a day the fire is about to burn lower and nothing is done yet (Duolingo's streak saver) */
export const LOW_SAVE: Record<'warn' | 'dim', { t: string; b: string }> = {
  warn: { t: 'Last call for your fire 🔥', b: 'Nothing done yesterday or today. One lesson before bed keeps it burning.' },
  dim: { t: 'Embers tomorrow 🔥', b: 'Your fire is already dimming. One lesson tonight keeps it from going down to embers.' },
};
/** the days after the app was last open that a come-back note comes while the fire burns low: often at first, then spaced out, after
    Duolingo's run, and the last says it goes quiet */
export const LOW_BACK_DAYS = [2, 3, 5, 7, 14, 30] as const;
/** a come-back note while it burns low, in the flame's own voice: how low it is and the one thing that lights it, about the fire and the
    next choice, never about who the person is. before: how low it was at the note before. (Never after a slip or a hard week: nudges.ts
    sends the tender notes then.) */
export function lowBack(day: number, f: FireLow, before: LowStep): { t: string; b: string } {
  const n = f.idle + ' days';
  if (day <= 3) {
    if (f.step < 3) return { t: 'Your fire is burning lower 🔥', b: n + ' with nothing done. One lesson today keeps it burning.' };
    if (before === 3) return { t: 'Still down to embers 🔥', b: n + ' with nothing done. One lesson lights me again.' };
    return { t: 'Down to embers 🔥', b: 'It is your flame. ' + n + ' with nothing done, and I am down to embers. One lesson lights me again.' };
  }
  if (day <= 5) return { t: 'One ember left 🕯️', b: n + ' now. One ember is still glowing. A few minutes today lights me again.' };
  if (day <= 7) return { t: 'A week of embers 🕯️', b: 'One ember is still glowing. Today’s lesson takes a few minutes and lights it again.' };
  if (day <= 14) return { t: 'Your flame here 👋', b: 'Two weeks, and one ember still glows. Everything you built is kept. One lesson lights it again.' };
  return {
    t: 'I will stop these for now 🌙',
    b: 'These reminders do not seem to be helping, so I will go quiet. Your ember stays lit, and everything you built is kept.',
  };
}

/** the small words over the next step while it burns low */
export const LOW_LEAD = 'This lights your fire again';
/** said when today lit it again */
export const RELIT = 'You lit your fire again';

/* ---------- the colors of a fire burning low ----------
   One map for every part of the drawing, so the fire, the body and the face dim together: each color drains toward a dark ash, the same
   share on the phone (a color matrix over the fire, components/fire-layer.native.tsx) as in the drawn
   layers (lowXml). */
/* a fire with water on it: its color drained to a dark, warm ash, so it reads as less fire, with only the heart's ember still glowing orange.
   (Tried first as a darker red, then a burnt orange: on the phone both read as a red fire, not a fire going out; the owner, November 9, 2026.) */
const EMBER = [0.24, 0.24, 0.08, 0.19, 0.2, 0.1, 0.16, 0.17, 0.14];

/** the 3 by 3 color map at a low: from none at 0 to the ember at 1 */
export function lowScale(low: number): number[] {
  'worklet';
  const k = Math.max(0, Math.min(1, low));
  const out: number[] = [];
  for (let i = 0; i < 9; i++) out.push((i % 4 === 0 ? 1 : 0) * (1 - k) + EMBER[i] * k);
  return out;
}
/** the same as a 4 by 5 color matrix (Skia's, and SVG's feColorMatrix) */
export function lowMatrix(low: number): number[] {
  'worklet';
  const m = lowScale(low);
  return [m[0], m[1], m[2], 0, 0, m[3], m[4], m[5], 0, 0, m[6], m[7], m[8], 0, 0, 0, 0, 0, 1, 0];
}
/** one #RRGGBB color at a low */
export function lowHex(hex: string, low: number): string {
  const m = lowScale(low);
  const n = parseInt(hex.slice(1), 16);
  const x = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const c = [0, 1, 2].map((r) => Math.max(0, Math.min(255, Math.round(m[r * 3] * x[0] + m[r * 3 + 1] * x[1] + m[r * 3 + 2] * x[2]))));
  return (
    '#' +
    c
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}
/** a drawing with every color at a low (three-digit colors and named white too) */
export function lowXml(xml: string, low: number): string {
  if (!xml || low <= 0) return xml;
  return xml
    .replace(/#([0-9A-Fa-f]{6})\b/g, (m) => lowHex(m, low))
    .replace(/#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])\b(?![0-9A-Fa-f])/g, (_, r: string, g: string, b: string) => lowHex('#' + r + r + g + g + b + b, low))
    .replace(/(fill|stroke|stop-color)="(white|#fff)"/gi, (_, a: string) => `${a}="${lowHex('#FFFFFF', low)}"`);
}

/* ---------- the face of a fire burning low ----------
   While it burns low the flame is sad, not smiling: its brows lift in the middle and its smile turns down (the owner, November 9, 2026). The
   face is drawn the same way in every form (flame-art.ts, face()), so its brows and mouth are swapped where they are. When it is lit again it
   smiles again. */
const FACE_SAD: [string, string][] = [
  ['M-27 63Q-20 57.5 -12 60', 'M-27 64Q-20 61.5 -12 56.5'],
  ['M12 60Q20 57.5 27 63', 'M12 56.5Q20 61.5 27 64'],
  ['M-6.5 101Q0 107.5 6.5 101', 'M-6.5 105Q0 99 6.5 105'],
];
/** a drawing with the flame's face made sad */
export function sadXml(xml: string): string {
  if (!xml) return xml;
  let out = xml;
  for (const [a, b] of FACE_SAD) out = out.split('"' + a + '"').join('"' + b + '"');
  return out;
}

/* ---------- smoke ----------
   A few soft wisps rise from the top of the fire while it burns low, sway, swell and thin out. More of them, and thicker, the lower it burns. */
export const SMOKE_N = 6;
/** a wisp at a moment, [x, y, r, alpha] in the drawing's units, from the top of the fire; alpha 0 while it is not showing */
export function smokeAt(i: number, t: number, low: number, x0: number, y0: number, size: number): [number, number, number, number] {
  'worklet';
  const dur = 4.2 + (i % 3) * 0.9;
  const raw = (t + i * 1.37) / dur;
  const p = raw - Math.floor(raw);
  /* the first wisps come at the first step, all of them only at the lowest */
  const shown = i < Math.ceil(SMOKE_N * Math.min(1, low * 1.15)) ? 1 : 0;
  const rise = 34 * size * p;
  const sway = Math.sin(p * 5.1 + i * 1.9) * 3.2 * size * p + Math.sin(t * 0.7 + i) * 1.2 * size * p;
  const r = size * (1.6 + 5.4 * p);
  const a = shown * Math.min(1, low * 1.4) * 0.46 * Math.sin(Math.PI * Math.min(1, p * 1.1)) * (1 - 0.35 * p);
  return [x0 + sway, y0 - rise, r, a];
}
/** how hard a fire burning low is burning at a moment: it sputters, dips and catches, and never quite settles */
export function sputterAt(t: number, low: number): number {
  'worklet';
  if (low <= 0) return 1;
  /* a slow sag, and now and then a quick drop and a catch */
  const sag = 0.5 + 0.5 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1);
  const cyc = (t * 0.45) % 1;
  const drop = cyc < 0.12 ? Math.sin((cyc / 0.12) * Math.PI) : 0;
  return Math.max(0.15, 1 - low * (0.45 + 0.2 * sag) - low * 0.35 * drop);
}
