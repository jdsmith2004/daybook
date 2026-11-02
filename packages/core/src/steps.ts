/* The twelve steps: the lessons in the order of the path, a step at a time, each ending in one thing done in real life (the
   owner, November 2, 2026; docs/plan.md, "Lessons that teach people how to quit"). The order puts first what helps soonest:
   the truth, why willpower is not enough, then closing the door. The steps name what getting free is made of. The app never
   says a person must do all twelve.

   A step's deed comes at the end of its last lesson: "I did it" or "Not yet, I will come back". Nothing waits on it: the path
   goes on either way. When the answer was not "I did it", the next step's first lesson asks once more, never on the day of a
   slip or the day after, and never a third time. "I did it" is kept for good (settings.learn.did, by step id, with its day)
   and gives DEED_PTS, so points only ever add.

   This file holds only the data and plain rules, with nothing imported, so legacy/core.js can read it too. */

export interface PathStep {
  id: string;
  name: string;
  /** the step in a sentence, for its land on the map */
  sub: string;
  /** a section tone (theme.ts toneOf) and the picture on its land (section-art.ts) */
  tone: string;
  art: string;
  /** the lessons of the step, in order. A faith lesson leaves the path of someone who said No to faith. */
  ids: string[];
  /** the step's God lesson (lesson-turns.ts GOD), last in the step, on the path only for someone who said faith plays a part
      (lessons.ts godOn) */
  god: string;
  /** the deed: what to do, and the words that ask about it once more ("You were going to ___. Did you get to?") */
  deed: string;
  /** the deed for someone who said No to faith, when it names God */
  deedNoFaith?: string;
  back: string;
}

export const PATH_STEPS: PathStep[] = [
  {
    id: 's1',
    name: 'Tell the truth',
    sub: 'What it gives you, what it costs you, and what you want.',
    tone: 'sky',
    art: 'wave',
    ids: ['l1', 'l2', 'l3', 'l22'],
    god: 'g1',
    deed: 'Write three honest lines: what it gives you, what it costs you, and what you want instead.',
    back: 'write your three lines',
  },
  {
    id: 's2',
    name: 'Stop counting on willpower',
    sub: 'Willpower was never going to be enough, and that is good news.',
    tone: 'violet',
    art: 'bell',
    ids: ['l33', 'l34', 'l20', 'l46'],
    god: 'g2',
    deed: 'Name what you will lean on instead: God, a person, or a plan. Say it, or write it down.',
    deedNoFaith: 'Name what you will lean on instead: a person, a plan, or what you stand for. Say it, or write it down.',
    back: 'name what you will lean on',
  },
  {
    id: 's3',
    name: 'Close the door',
    sub: 'Do not win the fight. Have fewer of them.',
    tone: 'coral',
    art: 'door',
    ids: ['l10', 'l9', 'l29', 'l4'],
    god: 'g3',
    deed: 'Tonight, your phone sleeps outside your bedroom. Then turn on a filter, and let someone else keep the code.',
    back: 'put your phone outside your bedroom',
  },
  {
    id: 's4',
    name: 'Decide',
    sub: 'Who you are becoming.',
    tone: 'mint',
    art: 'sprout',
    ids: ['l37', 'l38', 'l39'],
    god: 'g4',
    deed: 'Write one sentence about who you are becoming, and say it out loud once.',
    back: 'say your sentence out loud',
  },
  {
    id: 's5',
    name: 'Know your pattern',
    sub: 'An honest look at the chain, and at what you did right.',
    tone: 'sky',
    art: 'chain',
    ids: ['l17', 'l18', 'l19', 'l35', 'l41'],
    god: 'g5',
    deed: 'Walk one slip back, link by link. Write the chain, and one thing you did right.',
    back: 'walk one slip back',
  },
  {
    id: 's6',
    name: 'Tell one person',
    sub: 'The one step an app cannot do for you.',
    tone: 'violet',
    art: 'group',
    ids: ['l7', 'l31', 'l8', 'l28', 'l11'],
    god: 'g6',
    deed: 'Send one real person you trust a sentence about what you are working on.',
    back: 'tell one person',
  },
  {
    id: 's7',
    name: 'Get up faster',
    sub: 'Coming back is the skill.',
    tone: 'coral',
    art: 'heart',
    ids: ['l5', 'l6', 'l32', 'l21', 'l40', 'l12'],
    god: 'g7',
    deed: 'Write your first hour after a slip, in your own words, so it is ready before you need it.',
    back: 'write your first hour after a slip',
  },
  {
    id: 's8',
    name: 'Ride it better',
    sub: 'The tools, each tried on a real urge.',
    tone: 'violet',
    art: 'leaf',
    ids: ['l13', 'l14', 'l30', 'l15', 'l16', 'l42', 'l43', 'l44', 'l45'],
    god: 'g8',
    deed: 'Use one of these tools on a real urge, and log it.',
    back: 'try a tool on a real urge',
  },
  {
    id: 's9',
    name: 'Fill the empty hour',
    sub: 'Meet the need the habit was meeting.',
    tone: 'coral',
    art: 'house',
    ids: ['l23', 'l36', 'l24'],
    god: 'g9',
    deed: 'Put one real thing in your hardest hour, and do it once.',
    back: 'put something real in your hardest hour',
  },
  {
    id: 's10',
    name: 'Make it right',
    sub: 'Repair, with care, and never where it would hurt someone.',
    tone: 'mint',
    art: 'map',
    ids: ['l47', 'l48'],
    god: 'g10',
    deed: 'Make one repair. Small is fine. Leave out any that would hurt someone.',
    back: 'make one repair',
  },
  {
    id: 's11',
    name: 'Keep a daily practice',
    sub: 'Honest each night, quiet each morning.',
    tone: 'sun',
    art: 'sunrise',
    ids: ['l25'],
    god: 'g11',
    deed: 'Look back honestly for seven nights, a few lines each night.',
    back: 'look back honestly for seven nights',
  },
  {
    id: 's12',
    name: 'Give it away',
    sub: 'You keep it by handing it on.',
    tone: 'coral',
    art: 'candles',
    ids: ['l49'],
    god: 'g12',
    deed: 'Do one real thing for someone else this week.',
    back: 'do one thing for someone else',
  },
];

/** lessons on no step: they stay in Learn, finished and counted, and open in full whenever a person chooses them */
export const OFF_PATH = ['l26', 'l27'];

/** points for a step's deed, on the day it was done: the most any lesson gives (a lesson is 10) */
export const DEED_PTS = 30;

const STEP_AT: Record<string, number> = {};
PATH_STEPS.forEach((s, i) => [...s.ids, s.god].forEach((id) => (STEP_AT[id] = i)));
/** the step a lesson is on (its index in PATH_STEPS), or -1 when it is off the path */
export const stepAt = (id: string): number => (id in STEP_AT ? STEP_AT[id] : -1);

type Learn = { did?: Record<string, string>; later?: Record<string, string>; asked?: Record<string, 1> } | null | undefined;
/** how many deeds were done (points, legacy/core.js totalPoints) */
export const deedCount = (learn: Learn): number => Object.keys((learn && learn.did) || {}).length;

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** the deed records of settings.learn, cleaned: a known step id and a day. Each is left out when empty. */
export function normDeeds(o: Record<string, unknown> | null | undefined): Learn & object {
  const out: { did?: Record<string, string>; later?: Record<string, string>; asked?: Record<string, 1> } = {};
  const src = o && typeof o === 'object' ? o : {};
  (['did', 'later'] as const).forEach((f) => {
    const m = src[f] as Record<string, unknown> | undefined;
    const r: Record<string, string> = {};
    PATH_STEPS.forEach((s) => {
      const v = m && typeof m === 'object' ? m[s.id] : null;
      if (isDay(v)) r[s.id] = v;
    });
    if (Object.keys(r).length) out[f] = r;
  });
  const a = src.asked as Record<string, unknown> | undefined;
  const asked: Record<string, 1> = {};
  PATH_STEPS.forEach((s) => {
    if (a && typeof a === 'object' && a[s.id]) asked[s.id] = 1;
  });
  if (Object.keys(asked).length) out.asked = asked;
  return out;
}
