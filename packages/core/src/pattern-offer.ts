/* Daybook Pattern, the part that reads the log (supporter.ts holds the record and who has what).

   The ask leads with something true about this person: patPreview makes one line from their own log, and with no true line
   to say, the product is not offered at all. It is never asked for in the days after a slip or the hours after an SOS
   (askCalm), and never of someone who already has it.

   What changed this month: on the 1st, a short read of the month before against the one before that, made on the device from
   the log. It looks for what got better, and says a harder month plainly and without shame. Nothing is stored: a month's read
   is worked out when it is opened, so it stays whatever happens to the plan (patMonthOpen says who can open it). */
import { addDays, eventsOf, optText } from './legacy/core.js';
import { urWorks } from './journal';
import { logStart } from './log-start';
import { inTen, patKeys, patSlipTrig, patTriggerLines, patTriggers, patWhen, SLIP_TRIG_WORDS } from './pattern';
import { riskLabel } from './risk';
import { askCalm, type TipNear } from './support';
import { patOpen, PATTERN_FROM } from './supporter';
import { plural } from './view';
import type { DayKey, Days, Settings } from './types';

/* ---------- the line from their own log ---------- */

/** one true line about this person's pattern, and what the product shows behind it; null while there is not enough to say */
export function patPreview(days: Days, st: Settings, tk: DayKey): string | null {
  const keys = patKeys('90', days, st, tk);
  if (!keys.length) return null;
  const when = patWhen(days, st, keys, tk);
  const hard = when.hard.weekdays || when.hard.weekends;
  if (when.day && hard) return when.day.name + 's are your hardest day, and ' + hard.label + ' your hardest hours. See what sets them off.';
  if (hard) return hard.label + ' are your hardest hours. See what sets them off.';
  if (when.day) return when.day.name + 's are your hardest day. See what sets it off.';
  const slip = patSlipTrig(days, st, tk);
  if (slip) return slip.line.split('. ')[0] + '. See what else your log shows.';
  const top = patTriggerLines(patTriggers(days, st, keys, tk).list)[0];
  return top ? top + ' See what else your log shows.' : null;
}

/** the line to lead the ask with, when the product can be asked for now; null when it cannot: not on sale, already open, not
    a good moment, or nothing true to say yet */
export function patOffer(days: Days, st: Settings, tk: DayKey, near: TipNear | null, from: number | null = PATTERN_FROM): string | null {
  if (from == null || patOpen(st, near?.now, from) || !askCalm(days, st, tk, near)) return null;
  return patPreview(days, st, tk);
}

/* ---------- what changed this month ---------- */

const ymOf = (k: DayKey) => k.slice(0, 7);
const ymDate = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
};
const ymShift = (ym: string, by: number) => {
  const d = ymDate(ym);
  d.setMonth(d.getMonth() + by);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};
const ymName = (ym: string) => ymDate(ym).toLocaleDateString('en-US', { month: 'long' });
/** the moment a month was over, ms */
export const monthEnd = (ym: string): number => ymDate(ymShift(ym, 1)).getTime();

interface Tally {
  slips: number;
  rode: number;
  /** the longest stretch of days in the month with no slip */
  longest: number;
  trig: Record<string, number>;
  hours: number[];
  timed: number;
}
function tally(days: Days, st: Settings, ym: string): Tally {
  const t: Tally = { slips: 0, rode: 0, longest: 0, trig: {}, hours: Array(24).fill(0), timed: 0 };
  const first = ym + '-01';
  const start = logStart(days, st);
  const slipDays = new Set<DayKey>();
  for (const e of eventsOf(days, first) as { key: DayKey; time?: string | null; outcome: string; trigger?: string | null }[]) {
    if (ymOf(e.key) !== ym) continue;
    if (e.outcome === 'slipped') {
      t.slips++;
      slipDays.add(e.key);
      if (e.trigger && e.trigger !== 'other' && e.trigger !== 'none' && optText('trig', e.trigger, st.opts)) t.trig[e.trigger] = (t.trig[e.trigger] || 0) + 1;
    } else t.rode++;
    if (e.time && /^\d\d:\d\d$/.test(e.time)) {
      t.timed++;
      t.hours[+e.time.slice(0, 2)]++;
    }
  }
  let run = 0;
  for (let k = first < start ? start : first; ymOf(k) === ym; k = addDays(k, 1)) {
    run = slipDays.has(k) ? 0 : run + 1;
    if (run > t.longest) t.longest = run;
  }
  return t;
}
const entries = (t: Tally) => t.slips + t.rode;
/** a month needs this many entries before it can say anything */
export const MONTH_MIN = 3;
/** the hardest two hours of a month, once it has enough times to tell */
const MONTH_TIMED = 4;
function hardStart(t: Tally): number | null {
  if (t.timed < MONTH_TIMED) return null;
  let best = 0;
  let start = 0;
  for (let h = 0; h < 24; h++) {
    const v = t.hours[h] + t.hours[(h + 1) % 24];
    /* on a tie, the window that starts where things happen, as risk.ts does */
    if (v > best || (v === best && t.hours[h] > t.hours[start])) {
      best = v;
      start = h;
    }
  }
  return start;
}
const whatCame = (st: Settings, k: string) => SLIP_TRIG_WORDS[k] || '“' + optText('trig', k, st.opts) + '”';

export interface MonthLine {
  k: 'slips' | 'ride' | 'stretch' | 'trig' | 'hours' | 'helped';
  icon: string;
  t: string;
}
export interface MonthRead {
  ym: string;
  name: string;
  /** one line for the month */
  head: string;
  lines: MonthLine[];
}

/** the finished months with enough in them to read, newest first */
export function monthList(days: Days, st: Settings, tk: DayKey): string[] {
  const out: string[] = [];
  const last = ymShift(ymOf(tk), -1);
  const first = ymOf(logStart(days, st));
  for (let ym = last; ym >= first; ym = ymShift(ym, -1)) if (entries(tally(days, st, ym)) >= MONTH_MIN) out.push(ym);
  return out;
}
/** when the next read comes, for someone waiting on their first: "November 1" */
export const monthNext = (tk: DayKey): string => ymName(ymShift(ymOf(tk), 1)) + ' 1';

/** a month's read against the month before it, when that one has enough in it to compare; null when this one does not */
export function monthRead(days: Days, st: Settings, ym: string): MonthRead | null {
  const t = tally(days, st, ym);
  if (entries(t) < MONTH_MIN) return null;
  const prevYm = ymShift(ym, -1);
  const pt = tally(days, st, prevYm);
  const p = entries(pt) >= MONTH_MIN ? pt : null;
  const name = ymName(ym);
  const was = ymName(prevYm);
  const lines: MonthLine[] = [];
  const rate = t.rode / entries(t);
  const pRate = p ? p.rode / entries(p) : null;

  const inM = ' in ' + name;
  if (!t.slips) lines.push({ k: 'slips', icon: 'sunrise', t: p?.slips ? 'No slips' + inM + ', down from ' + p.slips + '.' : 'No slips' + inM + '.' });
  else if (!p) lines.push({ k: 'slips', icon: 'sunrise', t: plural(t.slips, 'slip') + ' logged' + inM + '.' });
  else if (t.slips < p.slips) lines.push({ k: 'slips', icon: 'sunrise', t: plural(t.slips, 'slip') + inM + ', down from ' + p.slips + '.' });
  else if (t.slips === p.slips) lines.push({ k: 'slips', icon: 'sunrise', t: plural(t.slips, 'slip') + inM + ', the same as ' + was + '.' });
  else
    lines.push({
      k: 'slips',
      icon: 'sunrise',
      t: plural(t.slips, 'slip') + inM + ', up from ' + p.slips + '. Every one is logged, so what comes next starts from what is true.',
    });

  /* the share ridden out, when it rose or is already most of them: this read looks for what is going right */
  if (t.slips && t.rode) {
    if (pRate != null && rate >= pRate + 0.1)
      lines.push({ k: 'ride', icon: 'heart', t: 'You rode out ' + inTen(rate) + ' hard moments, up from ' + inTen(pRate) + '.' });
    else if (rate >= 0.5) lines.push({ k: 'ride', icon: 'heart', t: 'You rode out ' + inTen(rate) + ' hard moments.' });
  }

  if (t.longest >= 2 && (!p || t.longest > p.longest))
    lines.push({
      k: 'stretch',
      icon: 'timer',
      t: 'Your longest stretch with no slip: ' + plural(t.longest, 'day') + (p ? ', up from ' + p.longest + '.' : '.'),
    });

  const fell = p
    ? Object.keys(p.trig)
        .map((k) => ({ k, c: t.trig[k] || 0, d: p.trig[k] - (t.trig[k] || 0) }))
        .filter((x) => x.d >= 2)
        .sort((a, b) => b.d - a.d)[0]
    : undefined;
  const topTrig = Object.keys(t.trig).sort((a, b) => t.trig[b] - t.trig[a])[0];
  if (fell)
    lines.push({
      k: 'trig',
      icon: 'bolt',
      t: whatCame(st, fell.k) + ' came before ' + (fell.c || 'none') + ' of your slips, down from ' + p!.trig[fell.k] + '.',
    });
  else if (topTrig && t.trig[topTrig] >= 2)
    lines.push({
      k: 'trig',
      icon: 'bolt',
      t:
        whatCame(st, topTrig) +
        ' came before ' +
        (t.trig[topTrig] === t.slips ? 'each' : t.trig[topTrig]) +
        ' of your ' +
        t.slips +
        ' slips. That is the moment to plan for.',
    });

  const hard = hardStart(t);
  if (hard != null) {
    const pHard = p ? hardStart(p) : null;
    lines.push({
      k: 'hours',
      icon: 'timer',
      t: 'Your hardest hours were ' + riskLabel(hard) + '.' + (pHard != null && pHard !== hard ? ' In ' + was + ' they were ' + riskLabel(pHard) + '.' : ''),
    });
  }

  const helped = urWorks(days, addDays(ymShift(ym, 1) + '-01', -1)).find((x) => x.n >= 3 && x.passed * 2 >= x.n);
  if (helped)
    lines.push({ k: 'helped', icon: 'sparkle', t: helped.name + ' helps you most: the urge passed ' + helped.passed + ' of ' + helped.n + ' times.' });

  const head = !t.slips
    ? name + ' had no slips at all.'
    : p && t.slips < p.slips
      ? name + ' was lighter than ' + was + '.'
      : pRate != null && rate >= pRate + 0.1
        ? 'You rode out more of it in ' + name + '.'
        : p && t.slips > p.slips
          ? name + ' was harder, and you stayed with it.'
          : 'You stayed with it all through ' + name + '.';
  return { ym, name, head, lines };
}

/* ---------- the words ---------- */

export const PAT_WORDS = {
  name: 'Daybook Pattern',
  /** the card on the locked part of Pattern */
  card: {
    h: 'The rest of your pattern',
    go: 'See Daybook Pattern',
    /** with nothing true to say yet, or at a moment when nothing is asked: no price and no button */
    soon: 'The rest of your pattern fills in as you log. Keep adding a time and a reason, and Daybook shows you what it finds.',
    rest: 'The rest of your pattern is here when you want it.',
  },
  /** the row on More */
  row: { title: 'Daybook Pattern' },
  rowHave: { title: 'You have Daybook Pattern', sub: 'Thank you. See what is open for you.' },
  /** the sheet */
  sheet: {
    title: 'Daybook Pattern',
    line: 'See what sets it off, what helps you most, and what is changing, all from your own log.',
    monthly: 'Monthly',
    monthlySub: 'Renews each month. Cancel any time.',
    lifetime: 'Lifetime',
    lifetimeSub: 'Paid once, yours for good.',
    badge: 'Our pick',
    web: 'Prefer to pay on the web? Apple Pay works there too.',
    webTitle: 'Pay on the web',
    webLine: 'A secure Stripe page opens, for the lifetime plan. Apple Pay works there too.',
    tip: 'Or leave a tip',
    restore: 'Restore a purchase',
    restoreNone: 'No earlier purchase was found on this Apple Account. If you paid on the web, sign in with that account first.',
    restoreNoneWeb: 'No earlier purchase was found here. If you paid while signed in, sign in with that account first.',
    manage: 'Manage or cancel',
    /** what Apple asks to be said beside a subscription (Guideline 3.1.2) */
    terms:
      'Monthly is one month of Daybook Pattern at the price shown, charged to your Apple Account. It renews each month unless you cancel at least 24 hours before the month ends, in your Apple Account settings.',
    termsWeb: 'Lifetime is paid once and does not renew.',
    termsLink: 'Terms of use',
    privacyLink: 'Privacy',
    cancelled: 'No purchase was made, and nothing was charged.',
    waiting: 'Waiting for approval. Nothing is charged until it is approved, and your pattern opens on its own when it is.',
    webClosed: 'The page closed before a purchase was made, so nothing was charged.',
    already: 'You already have this, so nothing was charged.',
    appleOff: 'Daybook Pattern is not open through Apple yet, and nothing was charged.',
    appleFailed: 'Apple could not take the payment, and nothing was charged. Try again in a moment.',
    approved: 'Thank you. Your purchase was approved, and your whole pattern is open.',
    unconfirmed:
      'Your payment went through. Daybook could not confirm it yet, so it is kept on this phone and Daybook tries again. You were not charged twice.',
    doneTitle: 'Your whole pattern is open',
    doneLine: 'Thank you. This just opened for you:',
    haveTitle: 'Thank you',
    haveLine: 'You have Daybook Pattern. This is open for you:',
    done: 'Done',
    since: 'Since ',
    renews: 'This month runs until ',
  },
  /** the card and page for the month read */
  month: {
    title: 'What changed this month',
    in: 'What changed in ',
    waiting: 'Your first read comes on ',
    waitingEnd: ', once the month has enough in it to read.',
    earlier: 'Earlier months',
  },
};
