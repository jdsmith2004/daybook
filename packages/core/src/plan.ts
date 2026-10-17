/* My plan: my reasons, my slip plan and my urge plan. Each change is a pure function on the settings, with the word to show,
   following the legacy reasonSave, reasonAdd, reasonMove, reasonRemove, lessonReasonSave, slipSave and the data-plan input.
   Checked by test/plan.test.ts. */
import { cleanReason, REASON_MAX, reasonCat, reasonGuess, sameReason, SLIP_STEPS, slipClean, WORDS_LEN, WORDS_MAX } from './legacy/core.js';
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
/** the rows being edited can hold a blank step; the saved list never does */
export const saveSlip = (st: Settings, rows: string[]) => changeSettings(st, (s) => void (s.slipPlan = rows.slice()));
export const slipIsStarter = (rows: string[]) => slipClean(rows).join('\n') === (SLIP_STEPS as string[]).join('\n');
export const resetSlip = (st: Settings): Change => ({ st: changeSettings(st, (s) => void (s.slipPlan = (SLIP_STEPS as string[]).slice())), toast: 'Back to the starter plan.' });

/* ---------- the urge plan (if this, then I will) ---------- */
export const setPlanRow = (st: Settings, i: number, fld: 'when' | 'then', v: string) =>
  changeSettings(st, (s) => {
    if (s.plan[i]) s.plan[i][fld] = v;
  });

/* ---------- My plan: why, the safety net, next steps, lists ---------- */
/** a typed field (goal, why, loop, rule, safePerson, ask, note): saved as typed */
export const setField = (st: Settings, k: 'goal' | 'why' | 'loop' | 'rule' | 'safePerson' | 'becoming' | 'ask' | 'note', v: string) =>
  changeSettings(st, (s) => void ((s as unknown as Record<string, string>)[k] = v));
/** a list typed one item per line (calm moves, wind-down, words); empty lines are dropped when saved */
export const setList = (st: Settings, k: 'menu' | 'wind' | 'words', text: string) => changeSettings(st, (s) => void ((s as unknown as Record<string, string[]>)[k] = text.split('\n')));

/* ---------- the lists as rows: add one, reword one, remove one, move one ---------- */
export type ListKey = 'menu' | 'wind' | 'words';
/** each list: how many it holds, how long a line can be, and its name in a sentence */
export const LISTS: Record<ListKey, { max: number; len: number; name: string }> = {
  menu: { max: 24, len: 100, name: 'calm moves' },
  wind: { max: 10, len: 100, name: 'wind-down' },
  words: { max: WORDS_MAX, len: WORDS_LEN, name: 'words that steady me' },
};
const rowsOf = (st: Settings, k: ListKey) => (((st as unknown as Record<string, string[]>)[k] || []) as string[]).slice();
const putRows = (st: Settings, k: ListKey, rows: string[]) => changeSettings(st, (s) => void ((s as unknown as Record<string, string[]>)[k] = rows));

export type ListResult = { ok: true; st: Settings; toast: string; at: number } | { ok: false; toast: string; at?: number };

/** a new line at the end of the list; a line that is already there is found, not added twice */
export function listAdd(st: Settings, k: ListKey, text: string): ListResult {
  const L = LISTS[k];
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, L.len);
  if (!t) return { ok: false, toast: 'Type a few words first.' };
  const rows = rowsOf(st, k);
  const at = rows.findIndex((x) => x.toLowerCase() === t.toLowerCase());
  if (at >= 0) return { ok: false, toast: 'Already on your ' + L.name + '.', at };
  if (rows.length >= L.max) return { ok: false, toast: `Your ${L.name} is full (${L.max}). Remove one to make room.` };
  return { ok: true, st: putRows(st, k, rows.concat([t])), toast: 'Added to your ' + L.name + '.', at: rows.length };
}
/** a line reworded; an empty one leaves the old words */
export function listEdit(st: Settings, k: ListKey, i: number, text: string): Settings {
  const rows = rowsOf(st, k);
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LISTS[k].len);
  if (i < 0 || i >= rows.length || !t || rows[i] === t) return st;
  rows[i] = t;
  return putRows(st, k, rows);
}
/** a line taken off the list. Calm moves and the wind-down never end up empty: the last one stays */
export function listRemove(st: Settings, k: ListKey, i: number): ListResult {
  const rows = rowsOf(st, k);
  if (i < 0 || i >= rows.length) return { ok: false, toast: '' };
  if (k !== 'words' && rows.length <= 1) return { ok: false, toast: 'Keep at least one. Add a new one first, then remove this.' };
  rows.splice(i, 1);
  return { ok: true, st: putRows(st, k, rows), toast: 'Removed.', at: i };
}
/** a line moved up (d = -1) or down (d = 1) */
export function listMove(st: Settings, k: ListKey, i: number, d: -1 | 1): Settings {
  const rows = rowsOf(st, k);
  const j = i + d;
  if (i < 0 || i >= rows.length || j < 0 || j >= rows.length) return st;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  return putRows(st, k, rows);
}
export function toggleSafety(st: Settings, i: number): Change {
  const next = changeSettings(st, (s) => void (s.safety[i] = !s.safety[i]));
  return { st: next, toast: next.safety[i] ? 'Done. Your safety net is stronger.' : undefined };
}
export function toggleHelpStep(st: Settings, i: number): Change {
  const next = changeSettings(st, (s) => void (s.help[i] = !s.help[i]));
  return { st: next, toast: next.help[i] ? 'Done. That is a real step toward help.' : undefined };
}
/** the playbook as plain text, to copy (legacy playbookText) */
export function playbookText(st: Settings, done: Set<string>, lessons: { id: string; title: string; key: string; np: string }[], index: (id: string) => number, checks: { t: string; q: string[] }[]) {
  const notes = (st.learn && st.learn.notes) || {};
  const picks = (st.learn && st.learn.picks) || {};
  const o = ['MY PLAYBOOK', ''];
  o.push('Why I am doing this');
  if (st.reasons.length) st.reasons.forEach((r) => o.push('- ' + r));
  else o.push('(no reasons yet)');
  o.push('');
  const rule = (st.rule || '').trim();
  if (rule) o.push('My rule', rule, '');
  const plan = (st.plan || []).filter((r) => r.when && r.when.trim() && r.when.indexOf('______') < 0);
  if (plan.length) {
    o.push('If this, then that');
    plan.forEach((r) => o.push('If ' + r.when.trim() + ', then ' + ((r.then || '').trim() || '(not filled in yet)')));
    o.push('');
  }
  const slip = Array.isArray(st.slipPlan) ? st.slipPlan : (SLIP_STEPS as string[]);
  if (slip.length) {
    o.push('If I slip');
    slip.forEach((t, i) => o.push(i + 1 + '. ' + t));
    o.push('');
  }
  const mine = lessons.filter((L) => done.has(L.id));
  if (mine.length) {
    o.push('What I have learned');
    mine.forEach((L) => {
      o.push(index(L.id) + 1 + '. ' + L.title + ': ' + L.key);
      if (picks[L.id]) o.push('   I picked: ' + picks[L.id]);
      if (notes[L.id]) o.push('   My note: ' + String(notes[L.id]).replace(/\r?\n/g, '\n   '));
    });
  }
  const wrote = checks
    .map((C, k) => ({ n: k + 1, C, a: (st.learn.wr && st.learn.wr['c' + (k + 1)] && st.learn.wr['c' + (k + 1)].a) || ['', '', ''] }))
    .filter((x) => x.a.some((t) => t.trim()));
  if (wrote.length) {
    o.push('');
    o.push('What I wrote');
    wrote.forEach((x) => {
      o.push('Checkpoint ' + x.n + ': ' + x.C.t);
      x.C.q.forEach((q, i) => {
        if (x.a[i] && x.a[i].trim()) o.push('- ' + q + '\n  ' + x.a[i].replace(/\r?\n/g, '\n  '));
      });
    });
  }
  return o.join('\n').trim();
}

/** the therapist fit check: a name for column c (legacy data-tname), and one check (legacy thr) */
export const setTherapistName = (st: Settings, c: number, v: string) => changeSettings(st, (s) => void (s.therapist.names[c] = v));
export const toggleTherapist = (st: Settings, r: number, c: number) => changeSettings(st, (s) => void (s.therapist.checks[r][c] = !s.therapist.checks[r][c]));
