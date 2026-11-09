/* The fire burns lower when the person stops doing their part (the owner, November 8, 2026: "if they don't work hard they are giving up something";
   CLAUDE.md, "Hope is not softness: there are stakes"). The owner's calls, the same day:
   - Drifting is days in a row with none of their part done: anything that earns points (a lesson, a check-in, an urge ridden out, an honest log,
     a calm move...), a tool, a talk-through, a feeling named. Opening the app alone is not their part. A slip logged honestly is their part, so
     honesty never dims the fire.
   - It never goes all the way out. Two days with nothing done: it burns lower. Three or four: it smoulders and smokes. Five or more: it is down to
     embers, smoke and sputters, with one ember always glowing.
   - The first thing done again lights it fully, at once, with the re-light moment (components/big-flame.tsx).
   - The words are on Today only (components/hero.tsx), and they are about the next choice, never about who the person is.
   Only the fire's glow changes: level, form, points and badges never move. And never in the hours after a slip (SLIP_HOURS, the same 72 hours
   the hero shows the time since one), when the job is to bring the person back. Today itself does not count against them until it is over.
   Checked by test/flame-low.test.ts. */
import { SLIP_HOURS } from './hero';
import { addDays, dayPoints, diffDays, evMs, sumDay } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** days in a row with nothing done before the fire burns lower, smoulders, and is down to embers */
export const LOW_AT: [number, number, number] = [2, 3, 5];
/** how low each step burns, 0 burning fully and 1 as low as it goes */
export const LOW_OF = [0, 0.4, 0.7, 1] as const;
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
function lastSlipMs(days: Days, st: Settings, tk: DayKey): number | null {
  for (let i = 0; i <= 4; i++) {
    const k = addDays(tk, -i);
    if (!sumDay(days[k]).slipped) continue;
    return Math.max(...days[k].events.filter((e) => e.outcome === 'slipped').map((e) => evMs(k, e.time, st.rollover)));
  }
  return null;
}

/** how low the fire burns today */
export function fireLow(days: Days, st: Settings | null, tk: DayKey, nowMs: number): FireLow {
  const none: FireLow = { step: 0, low: 0, idle: 0, was: 0 };
  if (!st || !st.start || tk <= st.start) return none;
  /* the days before today with nothing done, back to the start */
  const back = Math.min(LOOK_BACK, diffDays(tk, st.start));
  let idle = 0;
  while (idle < back && !partDone(days, st, addDays(tk, -1 - idle))) idle++;
  const at = lastSlipMs(days, st, tk);
  const fresh = at != null && nowMs - Math.min(at, nowMs) < SLIP_HOURS * 36e5;
  const before = fresh ? 0 : stepOf(idle);
  if (partDone(days, st, tk)) return { step: 0, low: 0, idle: 0, was: before };
  return { step: before, low: LOW_OF[before], idle, was: before };
}

/** the words on Today while it burns low: firm and plain, about the next choice */
export function lowWords(f: FireLow): { h: string; p: string } | null {
  if (!f.step) return null;
  const days = f.idle + ' days with nothing done';
  if (f.step === 1) return { h: 'You are dimming your fire', p: days };
  if (f.step === 2) return { h: 'Your fire is smouldering', p: days + '. It goes lower each day.' };
  return { h: 'Your fire is down to embers', p: days + '. One ember still glows.' };
}
/** the small words over the next step while it burns low */
export const LOW_LEAD = 'This lights your fire again';
/** said when today lit it again */
export const RELIT = 'You lit your fire again';

/* ---------- the colors of a fire burning low ----------
   One map for every part of the drawing, so the fire, the body and the face dim together: each color moves toward a deep ember (red kept,
   green and blue let go), by the same share on the phone (a color matrix over the fire, components/fire-layer.native.tsx) as in the drawn
   layers (lowXml). */
const KEEP = [0.8, 0.36, 0.24];

/** the scale of red, green and blue at a low */
export function lowScale(low: number): [number, number, number] {
  'worklet';
  const k = Math.max(0, Math.min(1, low));
  return [1 - (1 - KEEP[0]) * k, 1 - (1 - KEEP[1]) * k, 1 - (1 - KEEP[2]) * k];
}
/** the same as a 4 by 5 color matrix (Skia's, and SVG's feColorMatrix) */
export function lowMatrix(low: number): number[] {
  'worklet';
  const [r, g, b] = lowScale(low);
  return [r, 0, 0, 0, 0, 0, g, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
}
/** one #RRGGBB color at a low */
export function lowHex(hex: string, low: number): string {
  const s = lowScale(low);
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v * s[i]));
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
