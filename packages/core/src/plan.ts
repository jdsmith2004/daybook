/* My plan: my reasons, my slip plan and my urge plan. Each change is a pure function on the settings, with the word to show,
   following the legacy reasonSave, reasonAdd, reasonMove, reasonRemove, lessonReasonSave, slipSave and the data-plan input.
   Checked by test/plan.test.ts. */
import { cleanReason, REASON_MAX, reasonCat, reasonGuess, sameReason, SLIP_STEPS, slipClean } from './legacy/core.js';
import { changeSettings, type Change } from './actions';
import type { Settings } from './types';

export const RIDEAS: [string, string][] = [
  ['Being fully present with the people I love', 'rel'],
  ['Being ready for a real, honest relationship', 'rel'],
  ['Clear mornings and steady energy', 'foc'],
  ['Doing my best work without a fog', 'foc'],
  ['Sleeping well and waking up rested', 'foc'],
  ['Keeping my word to myself', 'val'],
  ['Becoming someone I am proud of', 'val'],
  ['Not carrying a secret', 'oth'],
  ['Feeling at peace with myself', 'oth'],
];
/** up to four ideas the person does not have yet */
export const reasonIdeas = (rs: string[]) => {
  const have = rs.map((x) => x.toLowerCase());
  return RIDEAS.map((x, k) => [x, k] as [[string, string], number])
    .filter((p) => have.indexOf(p[0][0].toLowerCase()) < 0)
    .slice(0, 4);
};

export type ReasonResult = { ok: true; st: Settings; toast: string; at: number } | { ok: false; toast: string };

/** a changed reason (was is its old text), or a new one when was is null. cat is the group; null lets Daybook guess. */
export function saveReason(st: Settings, was: string | null, draft: string, cat: string | null, from: 'page' | 'lesson' = 'page'): ReasonResult {
  const txt = cleanReason(draft);
  const at = was != null ? st.reasons.indexOf(was) : -1;
  if (!txt)
    return { ok: false, toast: from === 'lesson' ? 'Write a few words first.' : was != null ? 'A reason needs some words. To remove it, use the trash button.' : 'Write a few words first.' };
  /* adding on the reasons page checks for room first, like the legacy reasonAdd */
  if (from === 'page' && was == null && st.reasons.length >= REASON_MAX) return { ok: false, toast: 'The list is full. Remove one first.' };
  if (st.reasons.some((x, k) => k !== at && sameReason(x, txt))) return { ok: false, toast: 'You already have that one.' };
  if (at < 0 && st.reasons.length >= REASON_MAX)
    return { ok: false, toast: from === 'lesson' ? 'The list is full (' + REASON_MAX + '). Edit one instead.' : 'The list is full. Remove one first.' };
  const c = cat || (from === 'lesson' && at >= 0 ? reasonCat(st, was!).id : reasonGuess(txt).id);
  const next = changeSettings(st, (s) => {
    const k = was != null ? s.reasons.indexOf(was) : -1;
    if (k < 0) s.reasons.push(txt);
    else s.reasons[k] = txt;
    s.rmeta = (s.rmeta || []).filter((m) => m.t !== was && m.t !== txt);
    s.rmeta.push({ t: txt, c });
  });
  const toast = from === 'lesson' ? (at >= 0 ? 'Saved. Your change is on your list.' : 'Saved. It is on your list now.') : was != null ? 'Saved.' : 'Added.';
  return { ok: true, st: next, toast, at: next.reasons.indexOf(txt) };
}
export function moveReason(st: Settings, i: number, d: number): Change | null {
  const n = st.reasons.length;
  const j = i + d;
  if (i < 0 || i >= n || j < 0 || j >= n) return null;
  return {
    st: changeSettings(st, (s) => {
      const a = s.reasons;
      const x = a[i];
      a[i] = a[j];
      a[j] = x;
    }),
    toast: 'Now number ' + (j + 1) + ' of ' + n + '.',
  };
}
export function removeReason(st: Settings, i: number): Change | null {
  const txt = st.reasons[i];
  if (txt == null) return null;
  return {
    st: changeSettings(st, (s) => {
      const k = s.reasons.indexOf(txt);
      if (k >= 0) s.reasons.splice(k, 1);
      s.rmeta = (s.rmeta || []).filter((m) => m.t !== txt);
    }),
    toast: 'Removed.',
  };
}

/* ---------- the slip plan ---------- */
export const SLIP_MAX = 8;
export const SLIP_LEN = 200;
/** the rows being edited can hold a blank step; the saved list never does */
export const saveSlip = (st: Settings, rows: string[]) => changeSettings(st, (s) => void (s.slipPlan = rows.slice()));
export const slipIsStarter = (rows: string[]) => slipClean(rows).join('\n') === (SLIP_STEPS as string[]).join('\n');
export const resetSlip = (st: Settings): Change => ({ st: changeSettings(st, (s) => void (s.slipPlan = (SLIP_STEPS as string[]).slice())), toast: 'Back to the starter plan.' });

/* ---------- the urge plan (if this, then I will) ---------- */
export const setPlanRow = (st: Settings, i: number, fld: 'when' | 'then', v: string) =>
  changeSettings(st, (s) => {
    if (s.plan[i]) s.plan[i][fld] = v;
  });
