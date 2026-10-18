/* When something happened. The person picks a moment the way they think of it: a day on the calendar and a time on the
   clock ("Yesterday, 11:40 PM"). The log files it under its log day, which starts at the rollover hour, so a slip at
   1:30 AM on Sunday is part of Saturday's day, with the time 01:30. These rules turn one into the other, and give the
   words and the quick picks for the time picker. Checked by test/when.test.ts. */
import { addDays, clockOf, evMs, keyOfDate, logicalKey } from './legacy/core.js';
import type { DayKey } from './types';

/** a moment as the person picks it: the calendar day, and the hour (0 to 23) and minute */
export interface When {
  day: DayKey;
  h: number;
  m: number;
}

export const whenOf = (ms: number): When => {
  const d = new Date(ms);
  return { day: keyOfDate(d), h: d.getHours(), m: d.getMinutes() };
};
export function whenMs(w: When): number {
  const [y, mo, d] = w.day.split('-').map(Number);
  return new Date(y, mo - 1, d, w.h, w.m).getTime();
}
/** where the log keeps it: the log day and the time */
export function whenEntry(w: When, roll: number): { key: DayKey; time: string } {
  const ms = whenMs(w);
  return { key: logicalKey(ms, roll), time: clockOf(ms) };
}
/** an entry's moment, from its log day and time. An entry with no time is placed at the time given (now's, by default). */
export function whenFromEntry(key: DayKey, time: string | null, roll: number, fallback?: string): When {
  return whenOf(evMs(key, time || fallback || null, roll));
}
/** the moment a new entry starts at: now, or on an earlier log day, that day at the time it is now */
export function whenStart(key: DayKey, now: number, roll: number): When {
  const w = whenFromEntry(key, clockOf(now), roll);
  return whenMs(w) > now ? whenOf(now) : w;
}
export const whenFuture = (w: When, now: number) => whenMs(w) > now + 60000;

/** "9:47 PM" */
export function whenClock(w: When): string {
  return (w.h % 12 || 12) + ':' + String(w.m).padStart(2, '0') + ' ' + (w.h < 12 ? 'AM' : 'PM');
}
/** "Today", "Yesterday", or "Sat, Oct 17" */
export function whenDayWord(day: DayKey, now: number): string {
  const today = keyOfDate(new Date(now));
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
/** "Today · 9:47 PM" */
export const whenLabel = (w: When, now: number) => whenDayWord(w.day, now) + ' · ' + whenClock(w);
/** when the log keeps it under the day before (a moment after midnight, before the rollover): that log day, in words */
export function whenFiledUnder(w: When, roll: number): DayKey | null {
  const { key } = whenEntry(w, roll);
  return key === w.day ? null : key;
}

/** the days to pick from: today first, then back, n in all */
export function whenDays(now: number, n = 14): DayKey[] {
  const today = keyOfDate(new Date(now));
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}
/** the quick picks: just now, an hour or two ago, and last night (in the morning and afternoon) */
export function whenQuick(now: number, roll: number): { id: string; label: string; w: When }[] {
  const out = [
    { id: 'now', label: 'Just now', w: whenOf(now) },
    { id: '1h', label: '1 hour ago', w: whenOf(now - 3600000) },
    { id: '2h', label: '2 hours ago', w: whenOf(now - 2 * 3600000) },
  ];
  const h = new Date(now).getHours();
  if (h >= roll && h < 18) out.push({ id: 'night', label: 'Last night', w: { day: addDays(keyOfDate(new Date(now)), -1), h: 23, m: 0 } });
  return out;
}
/** the same moment, to the minute */
export const whenSame = (a: When, b: When) => a.day === b.day && a.h === b.h && a.m === b.m;
