/* The clean-up for the morning set's record on a day (Play.ms, morning-set.ts), kept in a file of its own with no imports, because
   legacy/core.js normP calls it while the day is being cleaned and morning-set.ts itself needs core.js. */
import type { MorningSet } from './types';

const isClock = (t: unknown): t is string => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const isMs = (n: unknown): n is number => typeof n === 'number' && isFinite(n) && n > 0;

/** the longest reason kept, in characters (a reason is a short line in the person's own words) */
export const MORNING_REASON_MAX = 120;

/** a morning set record cleaned up, or undefined when nothing in it is usable */
export function normMorning(x: unknown): MorningSet | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const s = x as Record<string, unknown>;
  const o: MorningSet = { at: isMs(s.at) ? s.at : 0 };
  if (s.n === 'free' || s.n === 'slip') o.n = s.n;
  if (typeof s.ev === 'string' && s.ev) o.ev = s.ev.slice(0, 40);
  if (s.f === 1 || s.f === 2 || s.f === 3) o.f = s.f;
  if (typeof s.r === 'string' && s.r.trim()) o.r = s.r.trim().slice(0, MORNING_REASON_MAX);
  if (isClock(s.nt)) o.nt = s.nt;
  if (isMs(s.set)) o.set = s.set;
  if (isMs(s.x)) o.x = s.x;
  if (!o.n && !o.f && !o.r && !o.nt && !o.set && !o.x) return undefined;
  if (!o.at) o.at = o.set || o.x || 1;
  return o;
}
