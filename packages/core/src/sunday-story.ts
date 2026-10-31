/* The Sunday review as a walk through the week, one thing at a time, like a year-in-review story: the seven days, the urges
   ridden out, when it came, what set it off, what helped, the slips (honestly, and kindly), the foundations under it all
   (sleep, the phone at night, check-ins, lessons), last week's goal, and the long view over eight weeks. Each screen has
   one line of science with its source and a lesson to read, and one longer card is picked for the hardest pattern of the
   week. Then the person gets ready for the next week (sunday.ts): one small goal, and if they want more, an if-then plan
   for the hardest moment, the hard days ahead, and a note to their future self.

   Hope first: a hard week is never shown as a fall. The trend over the weeks says when a week was better, and on a harder
   week it says what held instead. Every number here is one the log already has; nothing is guessed. Checked by
   test/sunday-story.test.ts. */
import { addDays, didText, eventsOf, evMs, slipMoments, trigText } from './legacy/core.js';
import { logStart } from './log-start';
import { patWhen, type PatWhen } from './pattern';
import { urTool } from './sos';
import { sunChange, sunLastGoal, sunWeek, type SunWeek } from './sunday';
import { plural } from './view';
import type { DayKey, Days, Reviews, Settings } from './types';

const dateOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekKeys = (sun: DayKey) => Array.from({ length: 7 }, (_, i) => addDays(sun, i - 6));

/* ---------- the seven days ---------- */
export type StoryDayState = 'clean' | 'slip' | 'ahead' | 'before';
export interface StoryDay {
  k: DayKey;
  /** "M", and "Monday" */
  l: string;
  name: string;
  state: StoryDayState;
  rode: number;
  slipped: number;
}
export function storyDays(days: Days, st: Settings, sun: DayKey, tk: DayKey): StoryDay[] {
  const first = logStart(days, st);
  return weekKeys(sun).map((k) => {
    const ev = days[k]?.events || [];
    const slipped = ev.filter((e) => e.outcome === 'slipped').length;
    const name = WEEKDAY[dateOf(k).getDay()];
    return {
      k,
      l: name[0],
      name,
      state: k > tk ? 'ahead' : k < first ? 'before' : slipped ? 'slip' : 'clean',
      rode: ev.length - slipped,
      slipped,
    };
  });
}

/** the longest stretch with no slip inside the week (from Monday's start up to now, or the end of Sunday), in hours */
export function storyBest(days: Days, st: Settings, sun: DayKey, now: number): number {
  const roll = st.rollover;
  const at = (k: DayKey) => evMs(k, String(roll).padStart(2, '0') + ':00', roll);
  const a = Math.max(at(addDays(sun, -6)), at(logStart(days, st)));
  const b = Math.min(now, at(addDays(sun, 1)));
  if (b <= a) return 0;
  const sl = slipMoments(days, st, b).filter((t) => t >= a && t <= b);
  let best = 0;
  let from = a;
  for (const t of sl) {
    best = Math.max(best, t - from);
    from = t;
  }
  best = Math.max(best, b - from);
  return best / 3600000;
}
/** "3 days, 4 hours", "18 hours", "under an hour" */
export function storyStretch(h: number): string {
  if (h < 1) return 'under an hour';
  const d = Math.floor(h / 24);
  const r = Math.floor(h - d * 24);
  if (!d) return plural(r, 'hour');
  return plural(d, 'day') + (r ? ', ' + plural(r, 'hour') : '');
}

/** how long the urges ridden out in SOS took, in the middle (minutes), when there are two or more */
export function storyRideMins(days: Days, sun: DayKey, tk: DayKey): number | null {
  const ms = eventsOf(days, addDays(sun, -6))
    .filter((e) => e.key <= sun && e.key <= tk && e.outcome === 'rode' && Number.isInteger(e.m) && (e.m as number) > 0 && (e.m as number) <= 120)
    .map((e) => e.m as number)
    .sort((x, y) => x - y);
  return ms.length >= 2 ? ms[Math.floor(ms.length / 2)] : null;
}

/** when it came this week: the 24-hour clock, and the hard hours Today uses */
export const storyWhen = (days: Days, st: Settings, sun: DayKey, tk: DayKey): PatWhen =>
  patWhen(
    days,
    st,
    weekKeys(sun).filter((k) => k <= tk),
    tk < sun ? tk : sun,
  );

/** what set it off, most first (on a tie, the one that led to slips): each with the urges ridden out and the slips */
export function storyTrig(w: SunWeek, st: Settings): { id: string; t: string; rode: number; slipped: number }[] {
  return Object.keys(w.trig)
    .map((id) => ({ id, t: trigText(id, st.opts), ...w.trig[id] }))
    .filter((x) => x.t)
    .sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped) || b.slipped - a.slipped)
    .slice(0, 4);
}
/** what helped: SOS tools that worked, then what the person did when they rode one out */
export function storyHelp(w: SunWeek, st: Settings): { id: string; t: string; ev: string; ic: string }[] {
  const out: { id: string; t: string; ev: string; ic: string }[] = [];
  Object.keys(w.tools)
    .filter((id) => w.tools[id].w > 0)
    .sort((a, b) => w.tools[b].w - w.tools[a].w)
    .forEach((id) => {
      const t = urTool(id)!;
      const { w: won, n } = w.tools[id];
      const ev = won < n ? 'worked ' + won + ' of ' + n + ' times' : n === 1 ? 'worked the time you used it' : 'worked all ' + n + ' times';
      out.push({ id: 'tool:' + id, t: t.name, ev, ic: t.ic });
    });
  Object.keys(w.did)
    .sort((a, b) => w.did[b] - w.did[a])
    .forEach((id) => {
      const t = didText(id, st.opts);
      const tool = urTool(id === 'reach' ? 'message' : id);
      /* the same move as a tool already listed (Breathe and "Breathed", Reach a person and "Texted or called someone") is
         not listed twice */
      if (t && !out.some((o) => o.t.toLowerCase() === t.toLowerCase() || (tool && o.id === 'tool:' + tool.id)))
        out.push({ id: 'did:' + id, t, ev: plural(w.did[id], 'time'), ic: tool ? tool.ic : 'check' });
    });
  return out.slice(0, 4);
}

/** the slips, honestly: how many, how many came after waiting first, and what came before them most */
export function storySlips(days: Days, st: Settings, sun: DayKey, tk: DayKey) {
  const ev = eventsOf(days, addDays(sun, -6)).filter((e) => e.key <= sun && e.key <= tk && e.outcome === 'slipped');
  const waited = ev.filter((e) => (e.wt || 0) >= 5).length;
  const tr: Record<string, number> = {};
  ev.forEach((e) => {
    if (e.trigger && e.trigger !== 'other' && e.trigger !== 'none') tr[e.trigger] = (tr[e.trigger] || 0) + 1;
  });
  const top = Object.keys(tr).sort((a, b) => tr[b] - tr[a])[0];
  const at = (k: DayKey) => evMs(k, String(st.rollover).padStart(2, '0') + ':00', st.rollover);
  const ms = slipMoments(days, st).filter((t) => t >= at(addDays(sun, -6)) && t < at(addDays(sun, 1)));
  /* two slips within a day of each other: the "I already blew it" snowball */
  let close = false;
  for (let i = 1; i < ms.length; i++) if (ms[i] - ms[i - 1] <= 24 * 3600000) close = true;
  return { n: ev.length, waited, top: top ? trigText(top, st.opts) : null, topN: top ? tr[top] : 0, close };
}

/** the foundations: sleep, the phone at night, winding down, checking in, lessons */
export function storyBase(w: SunWeek) {
  const sleep = w.sleep.length ? Math.round((w.sleep.reduce((a, b) => a + b, 0) / w.sleep.length) * 10) / 10 : null;
  return {
    days: w.days,
    sleep,
    sleepN: w.sleep.length,
    phone: w.phone,
    checkins: w.checkins,
    lessons: w.lessons,
    any: w.sleep.length + w.phone + w.checkins + w.lessons > 0,
  };
}

/* ---------- the long view ---------- */
export interface StoryWeek {
  sun: DayKey;
  days: number;
  noSlip: number;
  slipped: number;
  rode: number;
}
/** up to n weeks ending with this one, oldest first, from the week the log starts */
export function storyWeeks(days: Days, st: Settings, sun: DayKey, tk: DayKey, n = 8): StoryWeek[] {
  const out: StoryWeek[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const s = addDays(sun, -7 * i);
    const w = sunWeek(days, st, s, tk);
    if (w.days) out.push({ sun: s, days: w.days, noSlip: w.noSlip, slipped: w.slipped, rode: w.rode });
  }
  return out;
}
export type StoryTrendKind = 'first' | 'best' | 'up' | 'same' | 'held';
/** the trend, kindly framed: better weeks are named, and a harder week says what held */
export function storyTrend(weeks: StoryWeek[]): { kind: StoryTrendKind; line: string } {
  const cur = weeks[weeks.length - 1];
  if (!cur) return { kind: 'first', line: '' };
  if (weeks.length < 2) return { kind: 'first', line: 'Your first week on the chart. Next Sunday, there is a line to compare.' };
  const prev = weeks[weeks.length - 2];
  const before = weeks.slice(0, -1);
  if (weeks.length >= 3 && cur.noSlip > Math.max(...before.map((x) => x.noSlip)))
    return { kind: 'best', line: 'Your best week in ' + weeks.length + ' weeks: ' + plural(cur.noSlip, 'day') + ' with no slip.' };
  if (cur.noSlip > prev.noSlip) return { kind: 'up', line: 'Up from ' + plural(prev.noSlip, 'day') + ' with no slip last week to ' + cur.noSlip + '.' };
  if (cur.noSlip === prev.noSlip) return { kind: 'same', line: 'As steady as last week: ' + plural(cur.noSlip, 'day') + ' with no slip.' };
  const held = cur.rode
    ? 'you still rode out ' + plural(cur.rode, 'urge')
    : cur.noSlip
      ? 'you still had ' + plural(cur.noSlip, 'day') + ' with no slip'
      : 'you still showed up and logged it honestly';
  return { kind: 'held', line: 'A harder week, and ' + held + '. Hard weeks are part of every climb.' };
}

/* ---------- the science ---------- */
export type StoryScreen = 'intro' | 'days' | 'ride' | 'clock' | 'trig' | 'help' | 'slips' | 'base' | 'last' | 'long' | 'deep';
export interface StoryTeach {
  t: string;
  src: string[];
  /** the lesson to read for more */
  l: string;
}
/** one line of science for each screen, with its source and its lesson */
export function storyTeach(screen: StoryScreen, o: { slipDays?: number } = {}): StoryTeach | null {
  switch (screen) {
    case 'days':
      return o.slipDays
        ? {
            t: 'One missed day barely matters. In a study of people building a new daily habit, missing a single day made little difference to how it grew.',
            src: ['lally'],
            l: 'l21',
          }
        : { t: 'A new habit took about 66 days to feel automatic for the typical person. Every day like these is one of them.', src: ['lally'], l: 'l12' };
    case 'ride':
      return {
        t: 'An urge rises, peaks, and passes. Smokers who learned to watch their urges rise and fall smoked fewer cigarettes, even though the urges stayed as strong.',
        src: ['bowen'],
        l: 'l2',
      };
    case 'clock':
      return {
        t: 'Habits run on cues, like the hour and the place. When students moved to a new university, old habits broke where the new setting was very different.',
        src: ['wood'],
        l: 'l10',
      };
    case 'trig':
      return {
        t: 'Putting a feeling into words quieted the brain’s alarm center. Naming what sets it off is the first step to planning for it.',
        src: ['lieberman'],
        l: 'l13',
      };
    case 'help':
      return {
        t: 'In a review of 138 experiments, tracking progress helped people reach their goals, and it helped more when the progress was written down. That is what your log does.',
        src: ['harkin'],
        l: 'l40',
      };
    case 'slips':
      return {
        t: 'After a slip, “I blew it” is the risky thought. Seeing a slip as one event, not a verdict, is how one slip stays one slip.',
        src: ['larimer'],
        l: 'l3',
      };
    case 'base':
      return {
        t: 'After a night without sleep, the brain’s reward system overreacted. A tired brain makes any quick reward look bigger than it is.',
        src: ['gujar'],
        l: 'l4',
      };
    case 'last':
      return { t: 'Small goals kept build trust in yourself. Each one is a vote for who you are becoming.', src: ['clearvote'], l: 'l37' };
    case 'long':
      return { t: 'Change is a run of small returns, not a straight line. What counts is the direction over the weeks.', src: [], l: 'l12' };
    default:
      return null;
  }
}

export type StoryDeepId = 'snowball' | 'clean' | 'late' | 'lonely' | 'stress' | 'bored' | 'scroll' | 'weekend' | 'review';
export interface StoryDeep {
  id: StoryDeepId;
  title: string;
  ic: string;
  paras: string[];
  src: string[];
  l: string;
}
const DEEP: Record<StoryDeepId, Omit<StoryDeep, 'id'>> = {
  snowball: {
    title: 'Why one slip snowballs',
    ic: 'leaf',
    paras: [
      'Some slips this week came close together. That pattern has a name, and it can be undone.',
      'After a slip, “I already blew it” is the risky thought. Psychologists call it the abstinence violation effect: one slip feels like proof, and proof makes the next one easier.',
      'The way out is the next good move. Log it, be kind to yourself, and do one small thing: SOS if it still pulls, or a few lines in your journal.',
    ],
    src: ['larimer'],
    l: 'l3',
  },
  clean: {
    title: 'Becoming someone who is free of this',
    ic: 'sun',
    paras: [
      'A week with no slips. That is real, and it is yours.',
      'In a study of people building a new daily habit, the typical person took 66 days before it felt automatic, and missing a single day barely mattered.',
      'Every honest day is a vote for who you are becoming. This week was seven of them.',
    ],
    src: ['lally', 'clearvote'],
    l: 'l37',
  },
  late: {
    title: 'Why nights are harder',
    ic: 'moon',
    paras: [
      'The hardest moments this week came late. That is common, and it is not a lack of willpower.',
      'After a night without sleep, the brain’s reward system overreacted to pleasant pictures. Late and tired, a quick reward looks bigger than it is.',
      'In a study of everyday temptations, people with strong self-control mostly had fewer fights to win: they set things up so there was less to resist. A phone that sleeps in another room is that kind of setup.',
    ],
    src: ['gujar', 'hofmann'],
    l: 'l20',
  },
  lonely: {
    title: 'Lonely, and the pull',
    ic: 'heart',
    paras: [
      'Feeling lonely or low came before the hard moments this week.',
      'In a survey of 1,247 adults, the lonelier people were, the more porn they tended to use. It can run in a loop: feel lonely, reach for porn, feel more cut off.',
      'The way out is people. One text to someone you trust breaks the loop.',
    ],
    src: ['butler'],
    l: 'l8',
  },
  stress: {
    title: 'Stress, and a faster way down',
    ic: 'bolt',
    paras: [
      'Stress came up the most this week.',
      'In a review of studies, short bouts of exercise eased cigarette cravings in the short term. You do not need a workout: a brisk two-minute walk counts.',
      'A slow breath with a long breath out is the other quick, free tool. Next time, pick one before the urge peaks.',
    ],
    src: ['haasova'],
    l: 'l15',
  },
  bored: {
    title: 'Plan the empty hour',
    ic: 'dice',
    paras: [
      'Boredom set it off the most this week.',
      'Empty, unplanned time is where an old habit fills the gap. Planning things that matter to you, and doing them, is a well-tested way to lift low mood.',
      'Pick the hour that tends to be empty, and put one thing in it.',
    ],
    src: ['ba'],
    l: 'l23',
  },
  scroll: {
    title: 'The cue comes first',
    ic: 'phone',
    paras: [
      'Scrolling came before the hard moments this week.',
      'Habits run on cues. When students moved to a new university, old habits broke where the new setting was very different.',
      'Change the setting before the urge: the apps off the home screen, the phone out of reach at night.',
    ],
    src: ['wood'],
    l: 'l34',
  },
  weekend: {
    title: 'Weekends need a plan',
    ic: 'calendar',
    paras: [
      'The weekend was harder this week. Open, unplanned hours are when a habit runs on autopilot.',
      'Across many studies, people who made if-then plans followed through on their goals more than people who only set the goal.',
      'One plan for Saturday night is enough: “If it is late and I am alone, then I go to bed and leave the phone outside.”',
    ],
    src: ['gollwitzer'],
    l: 'l9',
  },
  review: {
    title: 'Why looking back works',
    ic: 'chart',
    paras: [
      'In a review of 138 experiments, prompting people to track progress toward a goal helped them reach it.',
      'It helped more when the progress was written down or shared. That is what this review is.',
      'One small goal for the week ahead turns what you saw into a next step.',
    ],
    src: ['harkin'],
    l: 'l40',
  },
};
/** the one longer card, for the hardest pattern of the week */
export function storyDeep(w: SunWeek, st: Settings, slips: { close: boolean }): StoryDeep {
  const pick = (id: StoryDeepId): StoryDeep => ({ id, ...DEEP[id] });
  if (w.slipped >= 2 && slips.close) return pick('snowball');
  if (!w.slipped && w.days >= 5) return pick('clean');
  for (const c of sunChange(w, st)) {
    const id = c.id;
    if (id === 'late' || id === 'screens' || id === 'sleep' || id === 'trig:late' || id === 'trig:tired') return pick('late');
    if (id === 'trig:lonely') return pick('lonely');
    if (id === 'trig:stress') return pick('stress');
    if (id === 'trig:bored') return pick('bored');
    if (id === 'trig:scroll') return pick('scroll');
    if (id === 'weekend') return pick('weekend');
  }
  return pick('review');
}

/* ---------- the next week ---------- */
/** the days of the week that have been hardest over the last 60 days: up to two, with two slips or more each, in the
    order they come in the week (Monday first) */
export function storyHardDays(days: Days, tk: DayKey): { d: number; name: string; slips: number; of: number }[] {
  const n = Array(7).fill(0);
  let of = 0;
  for (const e of eventsOf(days, addDays(tk, -59))) {
    if (e.key > tk || e.outcome !== 'slipped') continue;
    n[dateOf(e.key).getDay()]++;
    of++;
  }
  return n
    .map((slips, d) => ({ d, name: WEEKDAY[d], slips, of }))
    .filter((x) => x.slips >= 2 && x.slips >= of * 0.25)
    .sort((a, b) => b.slips - a.slips)
    .slice(0, 2)
    .sort((a, b) => (a.d || 7) - (b.d || 7));
}
const WHEN_TRIG: Record<string, string> = {
  late: 'I am in bed late with my phone',
  lonely: 'I feel lonely or low',
  bored: 'I am bored and on my own',
  stress: 'I feel stressed',
  tired: 'I am tired',
  scroll: 'I catch myself scrolling',
};
/** the moments an if-then plan can be for: the hard hours, the trigger that comes up most, the weekend, any urge */
export function storyIfWhen(days: Days, st: Settings, tk: DayKey): string[] {
  const out: string[] = [];
  const pw = patWhen(
    days,
    st,
    Array.from({ length: 60 }, (_, i) => addDays(tk, i - 59)),
    tk,
  );
  const hard = pw.hard.weekdays || pw.hard.weekends;
  if (hard) out.push('it gets to ' + ((hard.start % 12 || 12) + (hard.start < 12 ? ' AM' : ' PM')));
  const tr: Record<string, number> = {};
  for (const e of eventsOf(days, addDays(tk, -29)))
    if (e.trigger && WHEN_TRIG[e.trigger]) tr[e.trigger] = (tr[e.trigger] || 0) + (e.outcome === 'slipped' ? 3 : 1);
  Object.keys(tr)
    .sort((a, b) => tr[b] - tr[a])
    .slice(0, 2)
    .forEach((k) => out.push(WHEN_TRIG[k]));
  if (storyHardDays(days, tk).some((x) => x.d === 6 || x.d === 0)) out.push('it is Saturday night');
  out.push('an urge hits');
  return out.filter((x, i) => out.indexOf(x) === i).slice(0, 4);
}
/** what to do instead: the tool that helped most, then the moves that work for most people */
export function storyIfThen(w: SunWeek, st: Settings): string[] {
  const out: string[] = [];
  const best = Object.keys(w.tools).sort((a, b) => w.tools[b].w - w.tools[a].w)[0];
  if (best && w.tools[best].w > 0) out.push('open SOS and start ' + urTool(best)!.name);
  out.push('put my phone in another room');
  const nm = String(st.safePerson || '')
    .trim()
    .split(/\s+/)[0];
  out.push(nm ? 'text ' + nm : 'text someone I trust');
  out.push('go for a short walk');
  out.push('open SOS and breathe');
  return out.filter((x, i) => out.indexOf(x) === i).slice(0, 4);
}
/** "When it gets to 10 PM, I will put my phone in another room." */
export const storyIfLine = (it: { w: string; t: string }) => 'When ' + it.w + ', I will ' + it.t + '.';

/* ---------- the whole story ---------- */
export interface Story {
  sun: DayKey;
  w: SunWeek;
  days: StoryDay[];
  best: number;
  rideMins: number | null;
  when: PatWhen;
  trig: ReturnType<typeof storyTrig>;
  help: ReturnType<typeof storyHelp>;
  slips: ReturnType<typeof storySlips>;
  base: ReturnType<typeof storyBase>;
  last: ReturnType<typeof sunLastGoal>;
  weeks: StoryWeek[];
  trend: ReturnType<typeof storyTrend>;
  pts: number;
  deep: StoryDeep;
  screens: StoryScreen[];
}
/** everything the walk through the week shows, and which screens it has: one is left out when there is nothing to show */
export function story(days: Days, st: Settings, reviews: Reviews, sun: DayKey, tk: DayKey, now: number, perDay: Record<DayKey, number>): Story {
  const w = sunWeek(days, st, sun, tk);
  const d = storyDays(days, st, sun, tk);
  const when = storyWhen(days, st, sun, tk);
  const trig = storyTrig(w, st);
  const help = storyHelp(w, st);
  const slips = storySlips(days, st, sun, tk);
  const base = storyBase(w);
  const last = sunLastGoal(days, reviews, sun, tk);
  const weeks = storyWeeks(days, st, sun, tk);
  const pts = weekKeys(sun).reduce((a, k) => a + (perDay[k] || 0), 0);
  const screens: StoryScreen[] = ['intro', 'days'];
  if (w.rode) screens.push('ride');
  if (when.timed >= 2) screens.push('clock');
  if (trig.length) screens.push('trig');
  if (help.length) screens.push('help');
  if (w.slipped) screens.push('slips');
  if (base.any) screens.push('base');
  if (last) screens.push('last');
  if (weeks.length >= 2) screens.push('long');
  screens.push('deep');
  return {
    sun,
    w,
    days: d,
    best: storyBest(days, st, sun, now),
    rideMins: storyRideMins(days, sun, tk),
    when,
    trig,
    help,
    slips,
    base,
    last,
    weeks,
    trend: storyTrend(weeks),
    pts,
    deep: storyDeep(w, st, slips),
    screens,
  };
}
