/* Read my plan: the plan as a short lesson, one thought on each card, with what the flame says over it. Who I am becoming
   (with one true line from the log), tonight's lines, one of my reasons (a different one each day), my note, the first steps
   if I slip, my person, and the end. Cards with nothing to show are left out. The screen is app/plan/read.tsx. */
import { diffDays } from './legacy/core.js';
import { identityLines, recordLines } from './miles';
import { planTonight } from './plan';
import { riskWindow } from './risk';
import { slipSteps } from './lessons';
import { safeName } from './rekindle';
import type { DayKey, Days, Reviews, Settings } from './types';

export type PlanCard =
  | { k: 'becoming'; say: string; h: string; proof: string }
  | { k: 'line'; say: string; when: string; then: string }
  | { k: 'reason'; say: string; h: string }
  | { k: 'note'; say: string; h: string }
  | { k: 'slip'; say: string; steps: string[] }
  | { k: 'person'; say: string; name: string }
  | { k: 'end'; say: string; h: string };

export function planRead(days: Days, st: Settings, reviews: Reviews, tk: DayKey): PlanCard[] {
  const out: PlanCard[] = [];
  const proof = [...identityLines(days, st, reviews, tk), ...recordLines(days, st, tk)][0];
  out.push({
    k: 'becoming',
    say: 'Let us read your plan. This is who you are becoming.',
    h: String(st.becoming || '').trim() || 'I am becoming someone who is free of this.',
    proof: proof ? proof.who + ' ' + proof.n + '.' : '',
  });
  const win = riskWindow(days, st, tk);
  planTonight(days, st, tk).forEach((r, i) =>
    out.push({
      k: 'line',
      say: i
        ? 'And if it is this one instead.'
        : win
          ? 'Your hard hours are ' + win.label + '. When an urge hits, this is your move.'
          : 'When an urge hits, this is your move.',
      when: r.when,
      then: r.then,
    }),
  );
  const rs = (st.reasons || []).filter((r) => r && r.trim());
  if (rs.length) {
    const n = Math.abs(diffDays(st.start || tk, tk));
    out.push({ k: 'reason', say: 'Remember why you started.', h: rs[n % rs.length] });
  }
  const note = String(st.note || '').trim();
  if (note) out.push({ k: 'note', say: 'You wrote this to yourself on a calm day.', h: note });
  const steps = slipSteps(st).slice(0, 3);
  if (steps.length) out.push({ k: 'slip', say: 'And if a slip happens, you already know what to do.', steps });
  const name = safeName(st);
  if (name) out.push({ k: 'person', say: 'You are not doing this alone.', name });
  out.push({ k: 'end', say: 'Reading it on a calm day is how a plan holds on a hard one.', h: 'That is your plan. You know what to do.' });
  return out;
}
