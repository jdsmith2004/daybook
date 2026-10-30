/* Today, one moment at a time (docs/plan.md, the Fable review, October 22, 2026). Today shows one card, picked here from
   the log and the clock, so three systems never each ask for "what next". First match wins:

    1. a pause in progress (the slim banner)
    2. in the hard hours now: SOS forward, and talk it through
    3. there is no "morning after" card (the owner, October 24, 2026): coming back is the sunrise check, and Today marks it
       by itself (sunriseDue, srDone). The count asks nothing after a slip (the owner, October 30, 2026).
    4. the day of a slip, after it: one small thing
    5. a talk-through due: decide now, it passed, look back
    6. hard hours in the next two hours: the plan
    7. days away not known: fill them in
    8. the Sunday review, Sunday and Monday
    9. one-time moments: first week done, Day 1 tell the safe person, a counting note, the comeback noticed (all
       three flames lit: it celebrates, and its button is the day's next step), a paused reminder, the first pattern
   10. a calm day: the day's next stop; everything done: "All done. Rest well."
   11. the five questions again, every 30 days (recheck.ts): low on purpose, so they wait behind the day's next stop as "and one
       more", and are the card once the day's stops are done. They never push the lesson off the flame.

   When two moments overlap, the second waits as a one-line "and one more" under the card, and becomes the card as soon as
   the first is done. The asks (account, tip, counts) are never the card. What lives only on this device (a pause, the
   days-away row, the reminders) comes in as `dev`. Checked by test/moment.test.ts. */
import { diffDays, runLedger, sumDay } from './legacy/core.js';
import { GRAD_DAYS, GRAD_WINDOW, todayMeasure } from './graduate';
import { heroNumber } from './hero';
import { formWord } from './levels';
import { openTile, stopTiles, type StopGo } from './day';
import { comebackNow, rkComebackSay, safeName, tellStartDue } from './rekindle';
import { firstPattern, riskDay, riskPlanLabel, riskStartLabel } from './risk';
import { isSunday, SUN_GOALS, sunDue, sunGoalNow } from './sunday';
import { talkDueNow } from './talk-log';
import { stepOffer } from './view';
import { firstWeekDue } from './week';
import type { DayKey, Days, Reviews, Settings } from './types';

export type MomentKind =
  | 'pause'
  | 'hard-now'
  | 'slip-day'
  | 'talk'
  | 'comeback'
  | 'hard-soon'
  | 'away'
  | 'sunday'
  | 'first-week'
  | 'tell-start'
  | 'count-note'
  | 'step-offer'
  | 'nudge'
  | 'first-pattern'
  | 'recheck'
  | 'calm'
  | 'done';

/** what the card's main button does: a stop of the day, or one of the moments' own doors */
export type MomentGo = StopGo | 'pause' | 'small' | 'talk' | 'back' | 'review' | 'week' | 'pattern' | 'recheck';

export interface Moment {
  k: MomentKind;
  /** the small words above the title */
  eb: string;
  h: string;
  p: string;
  /** the main button, or null when the card has none (or draws its own) */
  btn: string | null;
  go: MomentGo | null;
  /** what the button opens: the lesson id, the Sunday, the talk-through id */
  v?: string;
  /** a moment that celebrates and then leads on: the step its button opens ("Wanting is not liking") */
  nx?: string;
  /** the name used in "and one more", when this moment waits behind another */
  one: string;
}

export interface MomentPick {
  card: Moment;
  /** the next moment, waiting behind the card (never the calm day: Your day names the rest of the day) */
  more: Moment | null;
}

/** what only this device knows */
export interface MomentDev {
  /** a pause (the 10-minute tool) running or just finished */
  pause?: boolean;
  /** days away not known (core awayDue), once Welcome back has been closed twice: the fill-in (Welcome back itself opens on its own) */
  back?: number | null;
  /** the reminders' one word (core nudgeCard), on a phone that can remind */
  nudge?: { k: 'paused' | 'backup' | 'time'; h: string; p: string } | null;
  /** the first day the first pattern was shown as the card: it is the card on that day only */
  patternDay?: DayKey | null;
  /** signed in: lessons after the first LEARN_FREE are open (nextUp) */
  account?: boolean;
  /** the slip whose comeback was celebrated and put away (its button pressed): it is not the card again */
  comebackSeen?: DayKey | null;
  /** the five questions are due again (core bpsDue, kept on this device) */
  recheck?: boolean;
}

/** every moment that applies now, in order. The calm day (or done) comes last, but for the five questions. */
export function moments(days: Days, st: Settings, reviews: Reviews, tk: DayKey, now: number, dev: MomentDev = {}): Moment[] {
  const out: Moment[] = [];
  const m = (k: MomentKind, eb: string, h: string, p: string, btn: string | null, go: MomentGo | null, one: string, v?: string, nx?: string) =>
    out.push({ k, eb, h, p, btn, go, one, ...(v ? { v } : {}), ...(nx ? { nx } : {}) });

  /* 1. a pause in progress */
  if (dev.pause) m('pause', 'A pause', 'Your pause', 'One tap back to it.', 'Resume', 'pause', 'your pause');

  /* 2 and 6. the hard hours (risk.ts), now or in the next two hours */
  const risk = riskDay(days, st, tk, now);
  const hard = risk && (risk.phase === 'during' || risk.phase === 'soon') ? risk : null;
  const hardEb = hard ? 'Your hard hours · ' + hard.win.label : '';
  if (hard && hard.phase === 'during')
    hard.talked
      ? m('hard-now', hardEb, 'You planned for this.', 'If it gets hard anyway, SOS is one tap.', null, null, 'your hard hours')
      : m(
          'hard-now',
          hardEb,
          'You are in your hard hours.',
          'SOS is one tap. A short plan helps too.',
          riskPlanLabel(hard.win.start),
          'talk',
          'your hard hours',
        );

  /* 4. the day of a slip */
  const today = days[tk];
  if (sumDay(today).slipped && (today?.events || []).some((e) => e.outcome === 'slipped' && !e.recovered))
    m(
      'slip-day',
      'After a slip',
      'Logged. That took honesty.',
      'What you built stays. One small thing now: water, a step outside, or a text to someone.',
      'I did one small thing',
      'small',
      'one small thing',
    );

  /* 5. a talk-through due; and a comeback that still has steps */
  const t = talkDueNow(days, st, tk, now);
  if (t && (t.due === 'decide' || t.due === 'passed' || t.due === 'look')) {
    const w =
      t.due === 'decide'
        ? ['Time to decide.', 'You chose to wait. Now choose, with your eyes open.', 'Decide now']
        : t.due === 'passed'
          ? ['You waited.', 'No slip since. If it faded, that is a win.', 'It passed']
          : ['Look back.', 'One minute. Honest is what counts.', 'Look back'];
    m('talk', 'Talk it through', w[0], w[1], w[2], 'talk', t.due === 'look' ? 'a look back' : 'a choice to make', t.talk.id);
  }
  if (hard && hard.phase === 'soon')
    hard.talked
      ? m('hard-soon', hardEb, 'You are ready.', 'You made your plan. If it gets hard anyway, SOS is one tap.', null, null, 'your hard hours')
      : m(
          'hard-soon',
          hardEb,
          'Your hard hours start at ' + riskStartLabel(hard.win.start) + '.',
          'A short plan now, while it is quiet, makes them easier.',
          riskPlanLabel(hard.win.start),
          'talk',
          'a plan for your hard hours',
        );

  /* 7. days away not known */
  if (dev.back)
    m(
      'away',
      'While you were away',
      dev.back + (dev.back === 1 ? ' day' : ' days') + ' not known yet',
      'A few taps fill them in. Nothing is guessed.',
      'Fill in',
      'back',
      'the days away',
    );

  /* 8. the Sunday review */
  const sd = sunDue(reviews, st, tk);
  if (sd)
    m(
      'sunday',
      sd.late ? 'Last week' : 'Sunday',
      sd.late ? 'Last week’s review is still open' : 'Your Sunday review',
      'Your week, one thing at a time, and one small goal for the next.',
      sd.late ? 'Look back on last week' : 'Look back on my week',
      'review',
      'your Sunday review',
      sd.sun,
    );

  /* 9. one-time moments */
  if (firstWeekDue(st, tk))
    m('first-week', 'One week', 'Your first week is done', 'A one-minute look back at what you did with it.', 'See my first week', 'week', 'your first week');
  if (tellStartDue(st, tk))
    m(
      'tell-start',
      'Day 1',
      'Day 1. Tell ' + safeName(st) + ' you started?',
      'One short message. A start someone else knows about is easier to keep.',
      null,
      null,
      'a text to ' + safeName(st),
    );
  if (st.cleanNote) m('count-note', 'How days count', 'A note about counting', '', null, null, 'a note about counting');
  else if (stepOffer(days, st, tk)) m('step-offer', 'How days count', 'Slips on most days lately?', '', null, null, 'a gentler plan');
  /* the comeback celebrates, then leads on (the owner, October 25, 2026: a finish always has an action, never a card that
     only takes room): its button is the day's next step, or "Nice" once the day is done, and either puts it away */
  const cb = comebackNow(days, st, tk);
  if (cb && dev.comebackSeen !== cb.k) {
    const nx = openTile(days, st, tk, now, dev.account !== false);
    m(
      'comeback',
      'Your comeback',
      rkComebackSay(cb.n),
      '',
      nx ? nx.btn : 'Nice',
      nx ? nx.go : null,
      'your comeback',
      nx ? nx.id : undefined,
      nx ? nx.head : undefined,
    );
  }
  if (dev.nudge && dev.nudge.k === 'paused') m('nudge', 'Reminders', dev.nudge.h, dev.nudge.p, null, null, 'a word about reminders');
  const pat = firstPattern(days, st, tk);
  if (pat && (!dev.patternDay || dev.patternDay === tk))
    m('first-pattern', 'Your pattern', 'A first pattern', pat, 'See my pattern', 'pattern', 'your first pattern');

  /* 10. a calm day */
  const d = stopTiles(days, st, tk, now);
  /* without an account, a lesson that waits behind one is never the card: a re-read instead (day.ts openTile, which Your
     day uses for its open stop too, so both open the same thing) */
  const cur = openTile(days, st, tk, now, dev.account !== false);
  if (cur) m('calm', cur.eyebrow, cur.head, cur.body, cur.btn, cur.go, 'the day', cur.id);
  if (dev.recheck)
    m('recheck', 'One month on', 'Five questions, one minute', 'The same five from your setup. See where you are now.', 'Start', 'recheck', 'five questions');
  if (cur) return out;
  if (dev.nudge && dev.nudge.k !== 'paused') m('nudge', 'Reminders', dev.nudge.h, dev.nudge.p, null, null, 'a word about reminders');
  else
    m(
      'done',
      d.tiles.length ? 'All done' : 'Today',
      d.tiles.length ? 'All done. Rest well.' : 'A day of your own.',
      d.tiles.length ? 'Every part of today is done. That is who you are now: someone who shows up.' : 'Nothing is planned for today. SOS is one tap.',
      null,
      null,
      'the day',
    );
  return out;
}

/** the one card, the one waiting behind it, and the rest of the day */
export function pickMoment(days: Days, st: Settings, reviews: Reviews, tk: DayKey, now: number, dev: MomentDev = {}): MomentPick {
  const all = moments(days, st, reviews, tk, now, dev);
  const card = all[0];
  const second = all[1];
  const more = second && second.k !== 'calm' && second.k !== 'done' ? second : null;
  /* no "Then: …" line under the card: Your day already lists the rest (the owner, October 23, 2026) */
  return { card, more };
}

/* ---------- the standing row: one number, one line, and a quieter note ----------
   Today shows the number on the flame's sky (heroNumber), so it uses only the note, under the next step. */
export interface StandRow {
  /** the one number, with its few words: "6 of your first 7 days", "23 hours" */
  big: string;
  /** one line under it: "with no slip · a Torch" */
  line: string;
  /** a quieter line, when there is something: "1 logged today · 2 of 5 nights this week" (the Sunday goal, Monday to
      Saturday). Empty when there is nothing. */
  note: string;
  /** all of it, for a screen reader */
  say: string;
}
/** the mode's one count (heroNumber), with the flame's form */
export function standRow(days: Days, st: Settings, reviews: Reviews, tk: DayKey, now: number, form: string): StandRow | null {
  const h = heroNumber(days, st, tk, now);
  if (!h) return null;
  const f = formWord(form);
  /* today's entries (the rest is in Pattern, Days) and the week's goal, set on Sunday, while it can still be counted */
  const n = sumDay(days[tk]).n;
  const g = isSunday(tk) ? null : sunGoalNow(days, reviews, tk);
  const goal = g && g.g.k && g.g.n && g.done != null ? g.done + ' of ' + g.g.n + ' ' + SUN_GOALS[g.g.k].unit + ' this week' : '';
  const note = [n ? n + ' logged today' : '', goal].filter(Boolean).join(' · ');
  const row = (big: string, ...line: (string | null | undefined)[]): StandRow => {
    const l = [...line.filter(Boolean), f].join(' · ');
    return { big, line: l, note, say: big + ', ' + l + '.' + (note ? ' ' + note + '.' : '') };
  };
  if (st.cleanMode === 'step') return row(h.n + ' ' + h.unit, 'this stretch', h.chip ? h.chip.charAt(0).toLowerCase() + h.chip.slice(1) : null);
  if (st.cleanMode !== 'gentle' && st.day1 && tk >= st.day1 && st.day1 !== tk) {
    const cur = runLedger(days, st, tk).cur;
    return row(
      cur + (cur === 1 ? ' day' : ' days'),
      cur > 1 ? 'in a row with no slip' : 'with no slip',
      h.chip ? h.chip.charAt(0).toLowerCase() + h.chip.slice(1) : null,
    );
  }
  const t = todayMeasure(days, st, tk);
  if (t && t.k === 'week') {
    if (t.of === 'Day 1 is today') return row('Day 1', 'is today');
    if (t.of === 'Today counts') return row('Today counts', 'a fresh day');
    const m = /^of the last (\d+) days? with no slip$/.exec(t.of);
    const first = st.day1 && m && diffDays(tk, st.day1) <= +m[1];
    return row(t.n + (m ? (first ? ' of your first ' : ' of the last ') + m[1] + (m[1] === '1' ? ' day' : ' days') : ' ' + t.of), 'with no slip');
  }
  if (t && t.k === 'way') return row(t.n + ' of ' + GRAD_DAYS, 'toward graduation');
  if (t && t.k === 'grad') return row(t.n + ' of the last ' + GRAD_WINDOW + ' days', 'graduated, still going');
  return row(h.n + (h.unit ? ' ' + h.unit : ''), h.eb.toLowerCase(), h.chip ? h.chip.charAt(0).toLowerCase() + h.chip.slice(1) : null);
}
