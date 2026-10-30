/* The five questions again (the owner, October 30, 2026): the Brief Pornography Screen from the setup, asked again every
   BPS_EVERY days, with the score next to the last one. The trials count reduction as success, so a lower score is a win the
   person can see even while slips still happen. It waits for a good moment, by the same quiet rules as the asks (support.ts):
   never within TIP_CALM days of a slip or TIP_QUIET hours of an SOS. A check closed unanswered waits BPS_WAIT days.
   Only the score is kept, on this device (`mem`, like the SOS memory: never synced, never sent, not in PULSE_KEYS). The
   setup's own score, in st.onb.hist, is the first one to compare with. Checked by test/recheck.test.ts. */
import { diffDays, isKey } from './legacy/core.js';
import { tipCalm, tipQuiet, type TipNear } from './support';
import type { DayKey, Days, Settings } from './types';

export const BPS_EVERY = 30;
export const BPS_WAIT = 7;
/** the setup asks about six months; here it is the time since the last one, so the score can move */
export const BPS_STEM = 'In the last 30 days, how often is this true for you?';

export interface BpsScore {
  d: DayKey;
  s: number;
}
/** what this device keeps: the scores, and the day a check was last closed unanswered */
export type BpsMem = Record<string, unknown>;

const okScore = (x: unknown): x is BpsScore => {
  const h = x as BpsScore | null;
  return !!h && isKey(h.d) && Number.isInteger(h.s) && h.s >= 0 && h.s <= 10;
};
/** every score there is, oldest first: the setup's, then the ones kept on this device */
export function bpsScores(st: Settings | null | undefined, mem: BpsMem): BpsScore[] {
  const a = ((st && st.onb && st.onb.hist) || []).filter(okScore);
  const b = (Array.isArray(mem.bps) ? mem.bps : []).filter(okScore);
  return [...a, ...b].sort((x, y) => x.d.localeCompare(y.d));
}

/** whether a check is due now. near: the time and the last SOS. */
export function bpsDue(days: Days, st: Settings, tk: DayKey, mem: BpsMem, near: TipNear | null = null): boolean {
  const list = bpsScores(st, mem);
  const from = list.length ? list[list.length - 1].d : st.start;
  if (diffDays(tk, from) < BPS_EVERY) return false;
  if (isKey(mem.bpsNo) && diffDays(tk, mem.bpsNo as DayKey) < BPS_WAIT) return false;
  if (!tipCalm(days, tk)) return false;
  return !(near && tipQuiet(days, st, near));
}

/** the five answers (each 0, 1 or 2) as a score out of 10 */
export const bpsScore = (answers: number[]) => answers.reduce((a, b) => a + b, 0);

/** the memory with a new score in it (one a day, the latest kept; at most 24) */
export function bpsKeep<M extends BpsMem>(mem: M, tk: DayKey, s: number): M & { bps: BpsScore[] } {
  const old = (Array.isArray(mem.bps) ? mem.bps : []).filter(okScore).filter((x) => x.d !== tk);
  return { ...mem, bps: [...old, { d: tk, s }].slice(-24) };
}

/** what the result says: the score next to the last one, and a line of hope. A lower score is the win; a higher one is never a fault. */
export function bpsResult(s: number, last: number | null): { h: string; p: string } {
  if (last == null) return { h: s + ' of 10', p: 'This is your starting line. In a month you can see it next to this one, and a lower number is a win.' };
  if (s < last)
    return {
      h: 'Down from ' + last + ' to ' + s,
      p: 'A lower score is a win, and a real one. The trials count this as success, long before anyone stops for good. You did that.',
    };
  if (s === last)
    return {
      h: 'Still ' + s + ' of 10',
      p: 'You came back and answered honestly. That is how this number starts to move. The next one has a month to show it.',
    };
  return {
    h: 'Up from ' + last + ' to ' + s,
    p: 'A hard stretch shows up here, and it does not stay. Nothing you built is gone. An honest number is how you find what helps next.',
  };
}

/** the line under its row in Pattern */
export function bpsRow(list: BpsScore[]): string {
  if (!list.length) return 'The five questions from your setup. One minute.';
  const last = list[list.length - 1].s;
  return list.length === 1 ? 'Your score: ' + last + ' of 10' : 'From ' + list[0].s + ' to ' + last + ' of 10';
}
