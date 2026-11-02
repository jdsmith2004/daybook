/* The numbers behind the cards on Pattern that pattern.ts does not already give: how the days felt, what was named and the
   columns of a range. Each card says what changed, against the period before, because a chart here is for seeing yourself
   change; a number is never something to chase. The sentence is what people remember, so it comes from the log and never
   says more than the log does (docs/plan.md has the research behind this).

   Named feelings are the thinnest data in the app: many people will name one now and then, and some never. So they are
   counted only where they were really named (jnTimeline), their card waits until there are enough to be honest (FEELS_MIN),
   and the card that reads how a day felt uses what nearly everyone answers: the check-in's mood, or else the day's one
   question (day-feel.ts). */
import { addDays, fmtDate, sumDay } from './legacy/core.js';
import { dayFeelOf, type DayFeelStep } from './day-feel';
import { FEEL_MID } from './feelings';
import { jnTimeline, type Journal } from './journal-entries';
import { logStart } from './log-start';
import { inTen, patDiffs, patKeys, type PatDiff, type PatRange } from './pattern';
import { feelPos } from './slip';
import { plural } from './view';
import type { Day, DayKey, Days, Settings } from './types';

/* ---------- the range and the period before it ---------- */
export interface PatPeriod {
  /** the days shown, oldest first */
  keys: DayKey[];
  /** the days compared: the range, or on All the latest 30 */
  recent: DayKey[];
  /** the days it is compared with, or null when the log does not go back that far */
  then: DayKey[] | null;
  /** those days, inside a sentence: "the month before" */
  than: string;
  /** the range, inside a sentence: "this month" */
  word: string;
}
const rangeDays = (a: DayKey, b: DayKey): DayKey[] => {
  const out: DayKey[] = [];
  for (let k = a; k <= b; k = addDays(k, 1)) out.push(k);
  return out;
};
/** All compares a person's first month with their latest, once the two do not overlap */
const ALL_CMP = 30;
export function patPeriod(range: PatRange, days: Days, st: Settings, tk: DayKey): PatPeriod {
  const keys = patKeys(range, days, st, tk);
  const first = logStart(days, st);
  if (range === 'all') {
    const long = keys.length >= ALL_CMP * 2;
    return {
      keys,
      recent: long ? keys.slice(-ALL_CMP) : keys,
      then: long ? keys.slice(0, ALL_CMP) : null,
      than: 'in your first month',
      word: 'so far',
    };
  }
  const span = range === '7' ? 7 : range === '30' ? 30 : 90;
  const end = addDays(tk, -span);
  const start = addDays(tk, -span * 2 + 1);
  const then = end < first ? null : rangeDays(start < first ? first : start, end);
  return {
    keys,
    recent: keys,
    then,
    than: range === '7' ? 'the week before' : range === '30' ? 'the month before' : 'the months before',
    word: range === '7' ? 'this week' : range === '30' ? 'this month' : 'lately',
  };
}

/** the range in words: "Oct 3 to Nov 1", with the year when it is not this one */
export function patRangeLabel(keys: DayKey[], tk: DayKey): string {
  if (!keys.length) return '';
  const a = keys[0];
  const b = keys[keys.length - 1];
  if (a === b) return b === tk ? 'Today' : fmtDate(b, { month: 'short', day: 'numeric' });
  return (
    fmtDate(a, a.slice(0, 4) === b.slice(0, 4) ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' to ' +
    fmtDate(b, { month: 'short', day: 'numeric' })
  );
}

/* ---------- the columns of a range ---------- */
/** the days of a range as columns of equal length, oldest first, so one column is not shorter than the rest: each day in a week,
    five columns up to about a month, and at most 13 after that. Counted back from today, so the last column is always whole. */
export function patChunks(keys: DayKey[]): DayKey[][] {
  const size = keys.length <= 7 ? 1 : keys.length <= 35 ? Math.ceil(keys.length / 5) : Math.max(7, Math.ceil(keys.length / 13));
  const out: DayKey[][] = [];
  for (let end = keys.length; end > 0; end -= size) out.unshift(keys.slice(Math.max(0, end - size), end));
  return out;
}
const colLabel = (c: DayKey[], tk: DayKey) => {
  if (c.length === 1) return c[0] === tk ? 'Today' : fmtDate(c[0], { weekday: 'short' });
  return fmtDate(c[0], { month: 'short', day: 'numeric' });
};

export interface PatRideCol {
  from: DayKey;
  label: string;
  rode: number;
  slipped: number;
}
/** the hard moments of a range, as columns */
export function patRideCols(days: Days, keys: DayKey[], tk: DayKey): PatRideCol[] {
  return patChunks(keys).map((c) => {
    const col: PatRideCol = { from: c[0], label: colLabel(c, tk), rode: 0, slipped: 0 };
    for (const k of c) {
      const s = sumDay(days[k]);
      col.rode += s.rode;
      col.slipped += s.slipped;
    }
    return col;
  });
}
/** what a card says first, big, and then in a plain line under it. Both come from the log and never say more than it does */
export interface PatSay {
  head: string;
  line: string;
}
/** what the riding out says. It leads with the wins, a tally that only adds up and never a share a slip can drag down. A climb is
    said as a climb and holding steady as steady; a fall is left to the card on how you are doing. */
export function patRideSay(ride: { then: number; now: number } | null, cols: PatRideCol[]): PatSay {
  const rode = cols.reduce((a, c) => a + c.rode, 0);
  const slipped = cols.reduce((a, c) => a + c.slipped, 0);
  if (!rode && !slipped) return { head: 'A quiet stretch', line: 'No hard moments logged in these days.' };
  if (!rode) return { head: 'Logged honestly', line: 'That is how the pattern shows.' };
  const head = rode + ' ridden out';
  if (ride && ride.now > ride.then + 0.05) return { head, line: 'You ride out ' + inTen(ride.now) + ' hard moments now, up from ' + inTen(ride.then) + '.' };
  if (ride && ride.now >= ride.then - 0.05) return { head, line: 'You ride out about ' + inTen(ride.now) + ' hard moments, and it is holding.' };
  return { head, line: '' };
}

/* ---------- the rays ---------- */
/** past this, a ray stands for more than one moment */
export const RAYS_MAX = 120;
/** each hard moment of a range in the order it came, as a ray of light for one ridden out and a short dim tick for a slip. It adds up and never takes away */
export function patRays(cols: PatRideCol[]): { rays: ('rode' | 'slipped')[]; per: number } {
  const total = cols.reduce((a, c) => a + c.rode + c.slipped, 0);
  const per = Math.max(1, Math.ceil(total / RAYS_MAX));
  const rays: ('rode' | 'slipped')[] = [];
  let a = 0;
  let b = 0;
  for (const c of cols) {
    a += c.rode / per;
    b += c.slipped / per;
    for (; a >= 1 - 1e-9; a--) rays.push('rode');
    for (; b >= 1 - 1e-9; b--) rays.push('slipped');
  }
  return { rays, per };
}

/* ---------- how you are doing ---------- */
/** No-slip days added up, day by day, over the days shown, with the same count from the period before as a quiet line behind it.
    Above that line is better than last time. The line can only climb: a slip is a flat step, never a fall, and what was earned
    stays on the chart. */
export const DOING_MIN = 7;
/** holding at this share of days is more than steady */
const STRONG = 0.85;
export interface PatDoing extends PatSay {
  kind: 'better' | 'harder' | 'strong' | 'steady' | null;
  /** no-slip days so far, for each day shown */
  now: number[];
  /** the same for the period before, or null when there is nothing to compare with */
  then: number[] | null;
  /** the period before, inside a sentence */
  than: string;
  /** the first day, for its label */
  first: string;
}
export function patDoing(days: Days, per: PatPeriod): PatDoing {
  const sum = (ks: DayKey[]) => {
    let n = 0;
    return ks.map((k) => (n += sumDay(days[k]).slipped ? 0 : 1));
  };
  const now = sum(per.recent);
  const n = now.length;
  const then = per.then && per.then.length === n ? sum(per.then) : null;
  const c = n ? now[n - 1] : 0;
  const t = then ? then[n - 1] : 0;
  const days_ = n === 7 || n === 30 ? 'the last ' + n + ' days' : 'your ' + n + ' days so far';
  const what = c + ' of ' + days_ + ' had no slip';
  const first = n === 7 ? '7 days ago' : n === 30 ? (per.than === 'in your first month' ? 'Day 1' : '30 days ago') : 'Day 1';
  const base = { now, then, than: per.than, first };
  if (!then)
    return {
      ...base,
      kind: null,
      head: c === n ? 'Every day' : c * 4 < n ? 'You keep showing up' : c + ' of ' + n + ' days',
      line: c === n ? 'All of ' + days_ + ' had no slip.' : c * 4 < n ? 'You logged these days honestly. That is where it starts.' : 'had no slip.',
    };
  /* a change has to be more than a day or two */
  const move = Math.max(2, Math.round(n * 0.1));
  if (c >= t + move) return { ...base, kind: 'better', head: 'Getting better', line: what + ', up from ' + t + ' ' + per.than + '.' };
  if (c <= t - move)
    return { ...base, kind: 'harder', head: 'A harder stretch', line: what + ', down from ' + t + ' ' + per.than + '. That is a signal, not a verdict.' };
  /* a person with few or no days like that hears what they did do: a count of nothing is not a finding, and it would take their hope for no gain */
  if (c * 4 < n) {
    const rode = per.recent.reduce((a, k) => a + sumDay(days[k]).rode, 0);
    return {
      ...base,
      kind: 'steady',
      head: 'You keep showing up',
      line: rode
        ? 'You rode out ' + plural(rode, 'hard moment') + ' in these days, and every one counts.'
        : 'You logged these days honestly. That is where it starts.',
    };
  }
  const strong = c >= n * STRONG;
  return { ...base, kind: strong ? 'strong' : 'steady', head: strong ? 'Holding strong' : 'Steady', line: what + ', about the same as ' + per.than + '.' };
}

/* ---------- how the days felt ---------- */
/** the check-in's mood (0 to 10), as one of the day's five steps */
export const moodStep = (v: number): DayFeelStep => (v <= 2 ? 1 : v <= 4 ? 2 : v <= 6 ? 3 : v <= 8 ? 4 : 5);
/** how a day felt. The check-in's mood comes first: it looks back over the whole day, and it is asked on a day with a slip,
    which the morning question never is, so hard days are not left out of the picture. */
export function dayStep(d: Day | null | undefined): DayFeelStep | null {
  const md = d?.checkin?.md;
  if (typeof md === 'number') return moodStep(md);
  return dayFeelOf(d)?.n ?? null;
}
export interface PatFeltCol {
  from: DayKey;
  label: string;
  /** days at each step, Rough first (index 0) to Great (index 4) */
  steps: [number, number, number, number, number];
  n: number;
}
export interface PatFelt extends PatSay {
  cols: PatFeltCol[];
  /** days at each step in the range, Rough first */
  by: [number, number, number, number, number];
  /** days with an answer in the range */
  n: number;
  /** how the days felt as a flow across the range: for each point along it, the share at each step, Rough first. Empty with no answers */
  flow: number[][];
}
/** how many points a flow is drawn from */
const FLOW_POINTS = 48;
/** The days as a flow: each point along the range is what the days around it felt like, the nearest counting most, so a band of color widens as
    days like it come more often. A day with no answer adds nothing and leaves no hole, because not answering is not a bad day. */
export function patFlow(days: Days, keys: DayKey[]): number[][] {
  const at: [number, DayFeelStep][] = [];
  keys.forEach((k, i) => {
    const n = dayStep(days[k]);
    if (n) at.push([i, n]);
  });
  if (!at.length) return [];
  const last = Math.max(1, keys.length - 1);
  const wide = Math.max(1, keys.length / 12);
  const points = Math.min(FLOW_POINTS, Math.max(2, keys.length));
  return Array.from({ length: points }, (_, p) => {
    const here = (p / (points - 1)) * last;
    const near = [0, 0, 0, 0, 0];
    /* a long way from any answer the weights all but vanish, so the nearest answer is what counts there */
    const closest = Math.min(...at.map(([i]) => Math.abs(i - here)));
    for (const [i, n] of at) {
      const d = (Math.abs(i - here) - closest) / wide;
      near[n - 1] += Math.exp((-d * d) / 2);
    }
    const sum = near.reduce((a, v) => a + v, 0);
    return near.map((v) => v / sum);
  });
}
/** at least this many answered days on a side before two periods are compared */
const FELT_CMP = 5;
export function patFelt(days: Days, per: PatPeriod, tk: DayKey): PatFelt {
  const cols = patChunks(per.keys).map((c) => {
    const col: PatFeltCol = { from: c[0], label: colLabel(c, tk), steps: [0, 0, 0, 0, 0], n: 0 };
    for (const k of c) {
      const n = dayStep(days[k]);
      if (n) {
        col.steps[n - 1]++;
        col.n++;
      }
    }
    return col;
  });
  const n = cols.reduce((a, c) => a + c.n, 0);
  const by: PatFelt['by'] = [0, 0, 0, 0, 0];
  for (const c of cols) c.steps.forEach((v, i) => (by[i] += v));
  return { cols, by, n, flow: patFlow(days, per.keys), ...feltSay(days, per, n) };
}
function feltSay(days: Days, per: PatPeriod, n: number): PatSay {
  if (!n) return { head: 'Nothing answered', line: 'A day with no answer stays blank here.' };
  const count = (ks: DayKey[]) => {
    const t = { n: 0, good: 0, hard: 0, by: [0, 0, 0, 0, 0] };
    for (const k of ks) {
      const v = dayStep(days[k]);
      if (!v) continue;
      t.n++;
      t.by[v - 1]++;
      if (v >= 4) t.good++;
      if (v <= 2) t.hard++;
    }
    return t;
  };
  const now = count(per.recent);
  const then = per.then ? count(per.then) : null;
  let steady = false;
  if (then && now.n >= FELT_CMP && then.n >= FELT_CMP) {
    const good = now.good / now.n - then.good / then.n;
    const hard = now.hard / now.n - then.hard / then.n;
    if (good >= 0.1) return { head: 'More good days', line: now.good + ' of ' + now.n + ', up from ' + then.good + ' of ' + then.n + ' ' + per.than + '.' };
    if (hard <= -0.1) return { head: 'Fewer hard days', line: now.hard + ' of ' + now.n + ', down from ' + then.hard + ' of ' + then.n + ' ' + per.than + '.' };
    if (good <= -0.1 || hard >= 0.1) return { head: 'A harder stretch', line: 'You showed up for it, and it is here in your log.' };
    steady = true;
  }
  const all = count(per.keys);
  /* a few answers are a record, not a finding */
  if (all.n < FELT_CMP) return { head: plural(all.n, 'day') + ' answered', line: '' };
  const most = Math.max(...all.by);
  const word = ['rough', 'low', 'okay', 'good', 'great'][all.by.indexOf(most)];
  if (most * 2 <= all.n)
    return { head: steady ? 'Steady' : 'A mix of days', line: steady ? 'A mix of days, about the same as ' + per.than + '.' : all.n + ' answered.' };
  return {
    head: steady ? 'Steady' : 'Mostly ' + word,
    line: most + ' of ' + all.n + (steady ? ' mostly ' + word + ', about the same as ' + per.than + '.' : ' answered.'),
  };
}

/* ---------- what was named ---------- */
/** the corners of the field of feelings, in the order they are shown */
export type FeelQuad = 'green' | 'yellow' | 'blue' | 'red';
export const QUAD_WORD: Record<FeelQuad, string> = { green: 'Calm', yellow: 'Bright', blue: 'Heavy', red: 'Charged' };
const QUADS: FeelQuad[] = ['green', 'yellow', 'blue', 'red'];
const quadOf = (r: number, c: number): FeelQuad => (r < FEEL_MID ? (c < FEEL_MID ? 'red' : 'yellow') : c < FEEL_MID ? 'blue' : 'green');
/** feelings named before the card is there, and before a share of them is said out loud */
export const FEELS_MIN = 5;
export interface PatTopFeel {
  w: string;
  r: number;
  c: number;
  n: number;
}
export interface PatFeels {
  n: number;
  /** the four corners, always in this order */
  quads: { q: FeelQuad; word: string; n: number; share: number }[];
  /** every word named in the range, the most named first */
  words: PatTopFeel[];
  /** what changed, or what came up most */
  head: string;
  line: string;
  /** a pleasant word that is new, when there is one */
  fresh: string;
  /** different words named in the whole log: it only ever grows */
  kinds: number;
}
const tallyFeels = (byDay: Map<DayKey, string[]>, ks: DayKey[]) => {
  const words: Record<string, number> = {};
  const quads: Record<FeelQuad, number> = { green: 0, yellow: 0, blue: 0, red: 0 };
  let n = 0;
  for (const k of ks)
    for (const w of byDay.get(k) || []) {
      const p = feelPos(w);
      if (!p) continue;
      words[w] = (words[w] || 0) + 1;
      quads[quadOf(p.r, p.c)]++;
      n++;
    }
  return { words, quads, n };
};
const andList = (l: string[]) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);
export function patFeels(jn: Journal | undefined, days: Days, per: PatPeriod, tk: DayKey): PatFeels {
  const byDay = new Map<DayKey, string[]>();
  for (const g of jnTimeline(jn, days, tk))
    byDay.set(
      g.k,
      g.feels.map((f) => f.w),
    );
  const all = tallyFeels(byDay, per.keys);
  const words = Object.keys(all.words)
    .sort((a, b) => all.words[b] - all.words[a] || (a < b ? -1 : 1))
    .map((w) => {
      const p = feelPos(w)!;
      return { w, r: p.r, c: p.c, n: all.words[w] };
    });
  const quads = QUADS.map((q) => ({ q, word: QUAD_WORD[q], n: all.quads[q], share: all.n ? all.quads[q] / all.n : 0 }));
  /* against the period before */
  const now = tallyFeels(byDay, per.recent);
  const then = per.then ? tallyFeels(byDay, per.then) : null;
  let head = '';
  let line = '';
  if (then && now.n >= FEELS_MIN && then.n >= FEELS_MIN) {
    const glad = (t: typeof now) => (t.quads.green + t.quads.yellow) / t.n;
    const a = glad(now);
    const b = glad(then);
    if (a >= b + 0.1) {
      head = 'More pleasant';
      line = Math.round(a * 100) + '% of what you named, up from ' + Math.round(b * 100) + '% ' + per.than + '.';
    } else if (a <= b - 0.1) {
      head = 'A heavier stretch';
      line = 'Naming it is part of what helps.';
    }
  }
  if (!head && all.n >= FEELS_MIN) {
    const big = quads.slice().sort((x, y) => y.n - x.n)[0];
    head = big.share > 0.5 ? 'Mostly ' + big.word.toLowerCase() : 'A mix of feelings';
    line = big.word + ' feelings came up most: ' + Math.round(big.share * 100) + '% of what you named.';
  }
  if (!head && all.n) head = plural(all.n, 'feeling') + ' named';
  /* a word that is new is good news only on the pleasant side: "New this month: Hopeless" is never said */
  const before = per.keys.length
    ? tallyFeels(
        byDay,
        [...byDay.keys()].filter((k) => k < per.keys[0]),
      )
    : null;
  const fresh =
    before && before.n >= FEELS_MIN
      ? words
          .filter((x) => x.c >= FEEL_MID && !before.words[x.w])
          .slice(0, 3)
          .map((x) => x.w)
      : [];
  const kinds = Object.keys(tallyFeels(byDay, [...byDay.keys()]).words).length;
  return { n: all.n, quads, words, head, line, fresh: fresh.length ? 'New ' + per.word + ': ' + andList(fresh) + '.' : '', kinds };
}

/* ---------- what is different on hard days ---------- */
/** the answers that come before or beside a slip. Mood, stress, urges and the like are left out here: a slip moves them too, so
    the log cannot say which came first, and the card would only be showing the slip back to the person. */
const LEADS: PatDiff['k'][] = ['h', 'so', 'ro'];
/** check-in days on each side before anything is said */
export const LEADS_MIN = 5;
export function patLeads(days: Days, keys: DayKey[]): { list: PatDiff[]; cleanN: number; slipN: number } {
  const r = patDiffs(days, keys);
  return { ...r, list: r.cleanN >= LEADS_MIN && r.slipN >= LEADS_MIN ? r.list.filter((d) => LEADS.includes(d.k)) : [] };
}

/* ---------- the hillside ---------- */
/** how many points a ridge is drawn from: enough to follow a log, few enough to stay a soft line */
const RIDGE_POINTS = 40;
/** how many days can each have a star of their own */
const STAR_DAYS = 60;
export interface PatRidge {
  /** for each point, oldest first: the share of recent days with no slip, 0 to 1 */
  now: number[];
  /** the same for the period before, or null when there is nothing to compare with */
  then: number[] | null;
  /** a star for each day, or on a long log each stretch, with a win in it, by its place along the ridge from 0 to 1 */
  stars: number[];
}
/** The hill on the first card: how many of the recent days had no slip, day by day. A slip is a dip that fills back in, so it never
    drops to nothing, and the top of the hill reads as getting better, holding or a harder stretch at a glance. It looks back a
    week, or a month on the whole log, and only as far as the log goes. */
export function patRidge(days: Days, per: PatPeriod, st: Settings): PatRidge {
  const first = logStart(days, st);
  const long = per.keys.length >= ALL_CMP * 2;
  const back = long ? ALL_CMP : 7;
  const noSlip = (k: DayKey) => !sumDay(days[k]).slipped;
  const line = (ks: DayKey[]) => {
    const last = per.keys[per.keys.length - 1];
    const out = ks.map((k) => {
      /* near the start of a log there are not enough days to look back on, so it looks ahead instead: one good first day is not a peak to fall from */
      let from = addDays(k, 1 - back);
      if (from < first) from = first;
      let to = k;
      let n = 0;
      let clean = 0;
      for (let d = from; d <= to; d = addDays(d, 1)) {
        n++;
        if (noSlip(d)) clean++;
        if (d === to && n < back && to < last) to = addDays(to, 1);
      }
      return n ? clean / n : 1;
    });
    if (out.length <= RIDGE_POINTS) return out;
    return Array.from({ length: RIDGE_POINTS }, (_, i) => out[Math.round((i / (RIDGE_POINTS - 1)) * (out.length - 1))]);
  };
  /* a star is a win: a day with no slip, or a hard moment ridden out on any day */
  const won = (k: DayKey) => noSlip(k) || sumDay(days[k]).rode > 0;
  const stretch = Math.ceil(per.keys.length / STAR_DAYS);
  const stars: number[] = [];
  for (let i = 0; i < per.keys.length; i += stretch) {
    if (per.keys.slice(i, i + stretch).some(won)) stars.push(per.keys.length > 1 ? (i + (stretch - 1) / 2) / (per.keys.length - 1) : 1);
  }
  const compare = per.than !== 'in your first month' && per.then && per.then.length === per.keys.length;
  return { now: line(per.keys), then: compare ? line(per.then!) : null, stars };
}

/* ---------- things in a mosaic ---------- */
export interface MosaicBlock {
  i: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
/** the share no block goes under, so its words fit: the words beside it say the real number */
const BLOCK_FLOOR = 0.07;
/** the room divided into a block for each amount, the biggest first and as near to square as it can get. The rows are laid along the short side. */
export function mosaic(values: number[], W: number, H: number): MosaicBlock[] {
  const list = values.map((v, i) => ({ v, i })).filter((x) => x.v > 0);
  if (!list.length || W <= 0 || H <= 0) return [];
  const raw = list.reduce((a, x) => a + x.v, 0);
  const lifted = list.map((x) => ({ i: x.i, v: Math.max(x.v, raw * BLOCK_FLOOR) })).sort((a, b) => b.v - a.v || a.i - b.i);
  const total = lifted.reduce((a, x) => a + x.v, 0);
  const area = W * H;
  const items = lifted.map((x) => ({ i: x.i, a: (x.v / total) * area }));
  const out: MosaicBlock[] = [];
  let x = 0;
  let y = 0;
  let w = W;
  let h = H;
  const worst = (row: number[], side: number) => {
    const sum = row.reduce((a, b) => a + b, 0);
    return Math.max(...row.map((a) => Math.max((side * side * a) / (sum * sum), (sum * sum) / (side * side * a))));
  };
  for (let n = 0; n < items.length; ) {
    const side = Math.min(w, h);
    let end = n + 1;
    while (
      end < items.length &&
      worst(
        items.slice(n, end + 1).map((t) => t.a),
        side,
      ) <=
        worst(
          items.slice(n, end).map((t) => t.a),
          side,
        )
    )
      end++;
    const row = items.slice(n, end);
    const sum = row.reduce((a, t) => a + t.a, 0);
    const thick = sum / side;
    let along = 0;
    for (const t of row) {
      const len = t.a / thick;
      out.push(w >= h ? { i: t.i, x, y: y + along, w: thick, h: len } : { i: t.i, x: x + along, y, w: len, h: thick });
      along += len;
    }
    if (w >= h) {
      x += thick;
      w -= thick;
    } else {
      y += thick;
      h -= thick;
    }
    n = end;
  }
  return out;
}

/* ---------- round things in a room ---------- */
export interface RoomCircle {
  x: number;
  y: number;
  r: number;
}
/** room for round things that want to sit too close: each is pushed away from the ones it touches, as little as it takes, and stays inside the room.
    What does not touch anything stays where it was. Same answer every time */
export function spreadCircles(list: RoomCircle[], w: number, h: number, gap = 0): RoomCircle[] {
  const out = list.map((p) => ({ ...p }));
  const inside = (p: RoomCircle) => {
    p.x = Math.max(p.r, Math.min(w - p.r, p.x));
    p.y = Math.max(p.r, Math.min(h - p.r, p.y));
  };
  out.forEach(inside);
  for (let round = 0; round < 200; round++) {
    let moved = false;
    for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        const want = a.r + b.r + gap;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= want - 0.01) continue;
        /* two on the same spot part sideways, the same way each time */
        if (d < 0.01) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const push = (want - Math.hypot(b.x - a.x, b.y - a.y)) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        inside(a);
        inside(b);
        moved = true;
      }
    if (!moved) break;
  }
  return out;
}
/** how much of the room the feelings together fill, at most: round things leave gaps, so past this they cannot all sit apart */
const FIELD_FILL = 0.66;
/** feelings as round things in the room: each near where it lives on the field (u and v, 0 to 1), sized by how often it was named and at least `min` across
    to hold its word, all together as big as the room allows with none over another. When they cannot all fit at that, the least they may be gives way first. */
export function feelBubbles(list: { u: number; v: number; n: number; min?: number }[], w: number, h: number, gap = 4): RoomCircle[] {
  if (!list.length || w <= 0 || h <= 0) return [];
  const weight = list.map((x) => Math.sqrt(0.6 + Math.min(x.n, 12)));
  const sum = weight.reduce((a, v) => a + v * v, 0);
  /* a few feelings do not stretch to fill a room: one word is not a planet */
  const top = (Math.min(w, h) * 0.34) / Math.max(...weight);
  const apart = (l: RoomCircle[]) => l.every((a, i) => l.slice(i + 1).every((b) => Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r + gap - 0.5));
  let fill = FIELD_FILL;
  let least = 1;
  for (;;) {
    const unit = Math.min(Math.sqrt((w * h * fill) / (Math.PI * sum)), top);
    const out = spreadCircles(
      /* the small nudge is so that feelings in one row can step out of it, up and down and not only along it */
      list.map((x, i) => ({ x: x.u * w, y: x.v * h + ((i % 3) - 1) * 2, r: Math.max(weight[i] * unit, ((x.min || 0) / 2) * least) })),
      w,
      h,
      gap,
    );
    if (least < 0.2 || apart(out)) return out;
    fill = Math.max(0.1, fill - 0.03);
    if (fill < 0.4) least *= 0.92;
  }
}
/** the whole field of feelings in the room: what was named, big enough to hold its word, and every other feeling a small dot where it lives, so the field fills the room and the named ones stand out of it */
export function feelMap(
  named: { r: number; c: number; n: number; min?: number }[],
  size: number,
  w: number,
  h: number,
): { named: RoomCircle[]; dots: (RoomCircle & { row: number; col: number })[] } {
  const at = (v: number) => (v + 0.5) / size;
  const big = feelBubbles(
    named.map((x) => ({ u: at(x.c), v: at(x.r), n: x.n, min: x.min })),
    w,
    h,
    3,
  );
  const taken = new Set(named.map((x) => x.r + ',' + x.c));
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) if (!taken.has(row + ',' + col)) cells.push({ row, col });
  const small = (Math.min(w, h) / size) * 0.2;
  /* a dot under a big one is simply not there: the field stays an even field around them */
  const dots = cells
    .map((p) => ({ ...p, x: at(p.col) * w, y: at(p.row) * h, r: small }))
    .filter((p) => big.every((b) => Math.hypot(p.x - b.x, p.y - b.y) >= b.r + small + 3));
  return { named: big, dots };
}
