/* The journal's Insights page (docs/plan.md, "A journal Insights page, minimal"; the owner, November 13, 2026): reached from the
   journal's header only, free for everyone. Three numbers (entries this year, days written, words written), the month with a dot
   on each day written, and the five feelings named most often. The feelings count everything the journal shows (jnTimeline): the
   entries, Name the feeling, and the feeling named before a slip, since that is the journal the person reads. Counts that only grow:
   nothing here is a run that can break. Checked by test/journal-insights.test.ts. */
import { addDays } from './legacy/core.js';
import { jnList, jnTimeline, type Journal } from './journal-entries';
import type { DayKey, Days } from './types';

export interface JnInsights {
  /** entries started this calendar year */
  year: number;
  /** days with an entry, ever */
  days: number;
  /** words written, ever, counted from the text */
  words: number;
  /** the feelings named most often, most first (at most five), with how many times */
  top: { w: string; n: number }[];
}

/** how many words a piece of writing has */
export const jnWords = (t: string): number => (t && t.trim() ? t.trim().split(/\s+/).length : 0);

export const JN_TOP = 5;

export function jnInsights(jn: Journal | undefined, days: Days | undefined, tk: DayKey): JnInsights {
  const list = jnList(jn);
  const y = tk.slice(0, 4);
  const n = new Map<string, number>();
  for (const d of jnTimeline(jn, days, tk)) for (const f of d.feels) n.set(f.w, (n.get(f.w) || 0) + 1);
  const top = [...n]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, JN_TOP)
    .map(([w, c]) => ({ w, n: c }));
  return {
    year: list.filter((e) => e.d.slice(0, 4) === y).length,
    days: new Set(list.map((e) => e.d)).size,
    words: list.reduce((s, e) => s + jnWords(e.t), 0),
    top,
  };
}

/** a month ('YYYY-MM') as the calendar draws it: the weeks from Sunday, each day a key or null outside the month, and the days
    written in it */
export function jnMonth(jn: Journal | undefined, ym: string): { weeks: (DayKey | null)[][]; written: Set<DayKey> } {
  const [y, m] = ym.split('-').map(Number);
  const first = ym + '-01';
  const len = new Date(y, m, 0).getDate();
  const lead = new Date(y, m - 1, 1).getDay();
  const cells: (DayKey | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < len; i++) cells.push(addDays(first, i));
  while (cells.length % 7) cells.push(null);
  const weeks: (DayKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const written = new Set(
    jnList(jn)
      .filter((e) => e.d.slice(0, 7) === ym)
      .map((e) => e.d),
  );
  return { weeks, written };
}

/** the months to swipe through: from the first entry's month (or this one) to this month, oldest first */
export function jnMonths(jn: Journal | undefined, tk: DayKey): string[] {
  const list = jnList(jn);
  const last = tk.slice(0, 7);
  const firstK = list.length ? list[list.length - 1].d.slice(0, 7) : last;
  const out: string[] = [];
  let [y, m] = (firstK < last ? firstK : last).split('-').map(Number);
  for (let i = 0; i < 600; i++) {
    const k = y + '-' + String(m).padStart(2, '0');
    out.push(k);
    if (k >= last) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}
