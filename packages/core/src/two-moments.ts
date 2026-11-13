/* Two moments a day (docs/review-plan.md, C3 and WP5; the owner's D3 (a), November 12, 2026). The day is Morning, a lesson, Good night:

   - The morning is one page (app/morning.tsx, morning-set.ts): a tap on Free of it or It happened is the answer, and tonight is set.
   - Good night is one page (app/night.tsx): the phone goes to bed, the night's waits are armed (Screen Time, lib/pull.ts), the time is
     kept (p.po, day.ts phoneAway) and the flame sleeps. "N nights put to bed" only grows.
   - Today follows the clock: its sky is dawn, day, dusk or night (skyPhase), and after the night hour (tonight's time, morning-set.ts
     tonightOf) Today is the night page: one card, Phone to bed, and the care row (afterNightHour).

   New people start without the evening check-in and without "How are you feeling today?" (freshSettings); both stay as switches, and
   people who had them keep them. Faith shows in the two moments only when the person said faith plays a part (faithOn, D10 (a)).
   Checked by test/two-moments.test.ts. */
import { addDays, defaultSettings, fmtClock, isTime, sumDay } from './legacy/core.js';
import { gradInfo, GRAD_DAYS } from './graduate';
import { phoneNights } from './day';
import { morningOf, tonightOf } from './morning-set';
import type { Clock, DayKey, Days, Settings } from './types';

/** minutes after the new day starts (the rollover hour), so 1 AM sorts after 11 PM on the same log day */
const rel = (min: number, roll: number) => (((min - roll * 60) % 1440) + 1440) % 1440;
const clockMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const nowMin = (now: number) => {
  const d = new Date(now);
  return d.getHours() * 60 + d.getMinutes();
};

/** the night hour: when tonight starts, as the morning set it (or the last time chosen) */
export const nightHour = (days: Days, st: Settings, tk: DayKey): Clock => tonightOf(days, st, tk).at;

/** whether now is after the night hour, until the new day starts. Today is then the night page. */
export function afterNightHour(days: Days, st: Settings, tk: DayKey, now: number): boolean {
  const at = nightHour(days, st, tk);
  if (!isTime(at)) return false;
  const roll = st.rollover ?? 4;
  return rel(nowMin(now), roll) >= rel(clockMin(at), roll);
}

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';
/** Today's sky, by the clock (D3): dawn from the new day until 9 AM, day until 5 PM, dusk until the night hour, then night. So the sky
    says which of the two moments the person is in, with no words; the flame's form carries the level. */
export function skyPhase(days: Days, st: Settings, tk: DayKey, now: number): SkyPhase {
  if (afterNightHour(days, st, tk, now)) return 'night';
  const roll = st.rollover ?? 4;
  const r = rel(nowMin(now), roll);
  if (r < rel(9 * 60, roll)) return 'dawn';
  if (r < rel(17 * 60, roll)) return 'day';
  return 'dusk';
}

/** the sky's three colors for each phase, top to bottom, and whether the words on it are light */
export const PHASE_SKY: Record<SkyPhase, { sky: [string, string, string]; stars: boolean; light: boolean }> = {
  dawn: { sky: ['#4A3A8C', '#C27A9E', '#FFC59A'], stars: false, light: true },
  day: { sky: ['#3FA2FF', '#86CCFF', '#CFEBFF'], stars: false, light: false },
  dusk: { sky: ['#3B2C7A', '#8E4F8F', '#F09A7A'], stars: false, light: true },
  night: { sky: ['#120E3A', '#2B1F6B', '#5B3A8E'], stars: true, light: true },
};

/* ---------- Good night ---------- */

/** whether the phone was put to bed on this log day (Good night, or the wind-down's Goodnight before it) */
export const putToBed = (days: Days, tk: DayKey): boolean => !!days[tk]?.p?.po;

/** "9 nights put to bed": every night the phone went to bed, ever. It only grows. */
export const bedNights = (days: Days): number => phoneNights(days);

/** the words on Good night (mockup m2). `wait` is the morning time the night's waits hold until, when Screen Time armed them; the
    line under the title says only what is true. After it: the nights so far, and the person's own words. */
export function goodNightWords(o: { days: Days; st: Settings; tk: DayKey; wait?: string | null; faith?: string | null }): {
  title: string;
  sub: string;
  doneTitle: string;
  doneSub: string;
  own: string;
} {
  const n = bedNights(o.days);
  const slipped = sumDay(o.days[o.tk]).slipped > 0;
  const own = String(o.st.becoming || '').trim();
  return {
    title: 'Phone to bed.',
    sub: o.wait ? `Feeds and adult sites wait until ${fmtClock(o.wait)}.` : 'Phone on its charger, away from your bed.',
    doneTitle: 'Good night.',
    doneSub: slipped
      ? 'You came back to this tonight. That is the part that lasts.'
      : n <= 1
        ? 'Your first night put to bed. This is the part that lasts.'
        : `${n} nights put to bed. This is the part that lasts.`,
    own: (o.faith || '').trim() || own,
  };
}

/* ---------- one person (WP7's first rung, D6 (a)) ---------- */

/** the good-night text to the person's one person. It never says why, never names the habit, a slip, a count or a time. */
export const goodNightText = (name: string): string =>
  `Good night${name.trim() ? ', ' + name.trim() : ''}. Phone is on the charger and I am heading to bed. Thank you for being in my corner.`;

/** the row on Good night: "Text Dana good night" */
export const goodNightRow = (name: string): string => `Text ${name.trim() || 'them'} good night`;

/* ---------- who starts with what ---------- */

/** whether "How are you feeling today?" is on. People who had it keep it; new people start with it off (freshSettings). */
export const dayFeelOn = (st: Settings | null | undefined): boolean => !!st && st.dayFeel !== false;

/** a new person's settings: the day is Morning, a lesson, Good night. The evening check-in and "How are you feeling today?" start off
    and stay as switches (Daily routine). */
export function freshSettings(tk: DayKey): Settings {
  const st = defaultSettings(tk);
  return { ...st, routine: { ...st.routine, checkin: false }, dayFeel: false };
}

/** faith plays a part, by the person's own answer (D10 (a): faith in the two moments when it is on, nothing anywhere when it is off) */
export function faithOn(st: Settings | null | undefined): boolean {
  const a = st?.onb?.a as { faith?: string } | undefined;
  return !!a && (a.faith === 'big' || a.faith === 'some');
}
/** the morning reason that faith adds */
export const FAITH_REASON = 'My faith';

/* ---------- the finish line, in the hero ---------- */

/** one line in the hero, only once the person has had a clean week (the owner's rule on long goals): "23 of 90 toward graduation".
    Once graduated, nothing: the award has its own place. */
export function finishLine(days: Days, st: Settings, tk: DayKey): string | null {
  const g = gradInfo(days, st, tk);
  if (g.at || !g.show) return null;
  return `${g.count} of ${GRAD_DAYS} toward graduation`;
}

/* ---------- the morning, told ---------- */

/** whether last night was told this morning (Free of it or It happened) */
export const morningTold = (days: Days, tk: DayKey): boolean => !!morningOf(days[tk])?.n;

/** the reply line under the answer (mockup m1). Plain and sure; It happened gets no ceremony, only that telling is done. */
export function morningReply(n: 'free' | 'slip', alreadyLogged: boolean): string {
  if (n === 'slip') return alreadyLogged ? 'Last night is logged. Today is open.' : 'Logged. Telling it is your part, and it is done.';
  return 'A free night. That one is yours for good.';
}

/** the log day before tk, for callers that only have tk */
export const nightBefore = (tk: DayKey): DayKey => addDays(tk, -1);
