/* Talk it through: for the slip that is decided before any urge. You have caught yourself planning it (the time, the
   place, maybe what you would watch), or you feel owed it, or you have stopped caring, or it feels like it is going to
   happen anyway. SOS is for an urge right now; this is for the plan. It does not pretend the plan is not there. It
   explains what the mind is doing (with the research), talks it through, and lets the person choose one of three
   honest paths: change the plan, wait and decide later, or go ahead with eyes open and look back afterwards. A slip
   that is chosen and noticed teaches more than one that "just happened", and noticing what a habit really gives is
   what wears it down (see the cards below). Nothing here shames, and nothing resets.

   Each talk-through is kept in the day's play record (p.tt), so it syncs with the log. This file imports nothing from
   legacy/core.js, because legacy/core.js imports normTalks from it. The changes to the log are in talk-log.ts. */
import type { DayKey, Days } from './types';

/* ---------- the research ---------- */
/** the sources the cards cite: [what it is, a link] */
export const TALK_SRC: Record<string, [string, string]> = {
  larimer: [
    'Larimer, Palmer & Marlatt (1999): relapse prevention, an overview of Marlatt’s cognitive-behavioral model, Alcohol Research & Health',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427',
  ],
  sayette: [
    'Sayette, Loewenstein, Griffin & Black (2008): exploring the cold-to-hot empathy gap in smokers, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2008.02178.x',
  ],
  caselli: ['Caselli & Spada (2015): desire thinking, what it is and what drives it, Addictive Behaviors', 'https://doi.org/10.1016/j.addbeh.2014.07.021'],
  brandtner: [
    'Brandtner, Müller, Behrens, Oelker & Brand (2024): the Permissive Beliefs Questionnaire, Comprehensive Psychiatry',
    'https://doaj.org/article/389ec4183b6c4c44b4249d0660ed8f74',
  ],
  kirchner: ['Kirchner, Shiffman & Wileyto (2012): relapse dynamics in people quitting smoking', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3296289'],
  tip35: ['SAMHSA (2019): TIP 35, Enhancing Motivation for Change, on ambivalence as a normal part of change', 'https://www.ncbi.nlm.nih.gov/books/NBK571071/'],
  tracy: [
    'Tracy & Randles (2013): displays of shame predict relapse in recovering alcoholics, Clinical Psychological Science',
    'https://doi.org/10.1177/2167702612470645',
  ],
  brewer: [
    'Brewer et al. (2011): mindfulness training for smoking cessation, a randomized trial, Drug and Alcohol Dependence',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3191261',
  ],
  taylor: [
    'Taylor et al. (2021): awareness drives changes in reward value, which predict eating behavior change, Journal of Behavioral Addictions',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC8997232',
  ],
  berridge: [
    'Berridge & Robinson (2016): liking, wanting, and the incentive-sensitization theory of addiction, American Psychologist',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC5171207/',
  ],
};

/* ---------- who it is for ---------- */
export type TalkSign = 'plan' | 'owed' | 'care' | 'anyway' | 'replay';
/** "Which ones sound like you?": [id, the words, an icon] */
export const TALK_SIGNS: [TalkSign, string, string][] = [
  ['plan', 'I already have a time and a place', 'calendar'],
  ['owed', 'I feel owed it', 'trophy'],
  ['care', 'I have stopped caring', 'leaf'],
  ['anyway', 'It is going to happen anyway', 'wave'],
  ['replay', 'I keep going over it in my head', 'dots'],
];

/* ---------- what the mind is doing ---------- */
export type TalkArt = 'chain' | 'gap' | 'loop' | 'permit' | 'cliff' | 'scale' | 'lens' | 'liking';
export interface TalkCard {
  k: TalkArt;
  /** shown when one of these was picked (empty: always) */
  for: TalkSign[];
  title: string;
  body: string;
  /** one line, for someone who has read the card before */
  short: string;
  src: string[];
}
/** in the order they are shown. The last one is shown every time; "liking" opens the eyes-open path. */
export const TALK_CARDS: TalkCard[] = [
  {
    k: 'chain',
    for: ['plan', 'anyway'],
    title: 'A slip starts long before the urge.',
    body: 'Relapse research finds it usually begins with small choices that look harmless: going home early, skipping the gym, keeping the phone close. Each one makes the next one easier. The first links are the easiest to change, and you are at one of them right now.',
    short: 'A slip starts with small choices, and the first ones are the easiest to change.',
    src: ['larimer'],
  },
  {
    k: 'gap',
    for: ['plan', 'anyway', 'owed'],
    title: 'Calm you guesses low.',
    body: 'In a study of smokers, people who were not craving guessed that a craving later would pull less. When it came, it pulled harder than they had guessed. Right now you are not in the craving, so this is the best moment to decide.',
    short: 'Before a craving, you guess its pull low. It will be stronger, so decide now.',
    src: ['sayette'],
  },
  {
    k: 'loop',
    for: ['replay'],
    title: 'Going over it turns the volume up.',
    body: 'Picturing the details again and again (who, when, how) has a name: desire thinking. Across many habits, it goes with stronger craving, and the picture never has to be finished. When it starts, name it: “That is the replay.” Then give your mind something else.',
    short: 'Replaying the details feeds the pull. Name it, and move on.',
    src: ['caselli'],
  },
  {
    k: 'permit',
    for: ['owed', 'anyway'],
    title: '“I earned it” is a permission thought.',
    body: 'Researchers measure two kinds: deserving a reward (“after today, I have earned it”) and quiet optimism (“once will not matter”). Both are stronger in people who are trying to cut back. So hearing one does not mean you want to give up. It means you are in the middle of changing. A permission thought is a thought, not an order.',
    short: '“I earned it” and “once will not matter” are permission thoughts, not orders.',
    src: ['brandtner'],
  },
  {
    k: 'cliff',
    for: ['anyway', 'care'],
    title: 'All or nothing is the trap.',
    body: 'After a slip, many people think: “I blew it, so why bother.” In a study of people quitting smoking, a slip often dropped their confidence, and that drop made the next slip more likely. The slip was not the real danger. The spiral after it was. Here, nothing you have built is lost.',
    short: 'The spiral after a slip does more harm than the slip. Nothing here resets.',
    src: ['kirchner'],
  },
  {
    k: 'scale',
    for: ['care'],
    title: 'Wanting two things at once is normal.',
    body: 'Part of you wants to change, and part of you wants it. Counselors call this ambivalence, and they treat it as a normal step on the way to change, not a failure. Motivation is not a fixed trait. It rises and falls, and a low day is a state, not who you are.',
    short: 'Wanting both is a normal step in change. A low day is a state, not who you are.',
    src: ['tip35'],
  },
  {
    k: 'lens',
    for: [],
    title: 'Curiosity works better than shame.',
    body: 'In a study of people in recovery, those who showed more shame about their past were more likely to relapse. Curiosity does the opposite. In a trial for quitting smoking, training people to notice their cravings closely helped far more of them quit (31% against 6% four months later). So whatever you choose next, choose it with your eyes open.',
    short: 'Shame makes it harder. Curiosity makes it easier.',
    src: ['tracy', 'brewer'],
  },
  {
    k: 'liking',
    for: [],
    title: 'Wanting is not liking.',
    body: 'The brain’s wanting can grow louder over time while the real enjoyment stays the same or fades. When people pay close attention to a habit, they often notice it gives less than it promised. In one study, that noticing lowered how rewarding the habit felt, and that change predicted the habit fading.',
    short: 'Wanting grows louder than liking. Noticing what it really gives wears the habit down.',
    src: ['berridge', 'taylor'],
  },
];

/** the cards for what was picked, in order, ending with the one shown every time (the eyes-open card is not here) */
export function talkCards(signs: TalkSign[]): TalkCard[] {
  return TALK_CARDS.filter((c) => c.k !== 'liking' && (!c.for.length || c.for.some((s) => signs.indexOf(s) >= 0)));
}
export const talkCard = (k: TalkArt) => TALK_CARDS.find((c) => c.k === k)!;

/** the reading for one talk-through, kept short for the moment: at most two cards in full (the unread one that fits
    the most of what was picked, and "Curiosity works better than shame" only until it has been read once), and every
    other card for what was picked as its one line. All of them stay a tap away ("Read the research"). */
export function talkReading(signs: TalkSign[], seen: string[]): { fresh: TalkCard[]; known: TalkCard[] } {
  const cards = talkCards(signs);
  const fits = (c: TalkCard) => c.for.filter((s) => signs.indexOf(s) >= 0).length;
  let best: TalkCard | null = null;
  for (const c of cards) if (c.k !== 'lens' && seen.indexOf(c.k) < 0 && (!best || fits(c) > fits(best))) best = c;
  const fresh = cards.filter((c) => c === best || (c.k === 'lens' && seen.indexOf('lens') < 0));
  return { fresh, known: cards.filter((c) => fresh.indexOf(c) < 0) };
}

/* ---------- talking it through ---------- */
export type TalkNeed = 'relief' | 'reward' | 'escape' | 'rest' | 'close' | 'bored';
/** "What are you really after tonight?": [id, the words, a short line, an icon, as it reads in "when I want ..."] */
export const TALK_NEEDS: [TalkNeed, string, string, string, string][] = [
  ['relief', 'Relief', 'From stress or pressure', 'wind', 'relief'],
  ['reward', 'A reward', 'After a hard day or a long run', 'trophy', 'a reward'],
  ['escape', 'A break from a feeling', 'Sad, lonely, ashamed or empty', 'heart', 'a break from how I feel'],
  ['rest', 'Rest', 'I am worn out', 'moon', 'rest'],
  ['close', 'Closeness', 'To feel wanted, or less alone', 'chat', 'closeness'],
  ['bored', 'Something to do', 'Bored, restless, nothing planned', 'dice', 'something to do'],
];
/** the same needs, asked ahead of the hard hours ("What usually makes these hours hard?", the short plan from the hard
    hours card): what makes them hard, then what is wanted. Nothing here assumes a slip is planned. [id, the words, a short line] */
export const TALK_HARD_NEEDS: [TalkNeed, string, string][] = [
  ['relief', 'Stress or pressure', 'I want relief'],
  ['reward', 'A hard day, or a long run', 'I feel I have earned something'],
  ['escape', 'A heavy feeling', 'Sad, lonely, ashamed or empty'],
  ['rest', 'Being worn out', 'I want rest'],
  ['close', 'Feeling alone', 'I want to feel close to someone'],
  ['bored', 'Boredom', 'Restless, nothing planned'],
];
/** the need as it reads in "when I want ...": one of the list, or the person's own words */
export const talkNeedWord = (n: TalkNeed | null, own?: string | null) => TALK_NEEDS.find((x) => x[0] === n)?.[4] || (own && own.trim()) || 'it';

/** what to say back after "How much do you want tonight to go differently?" (0 to 10) */
export function talkReflect(n: number): string {
  if (n <= 0) return 'You said 0. Thank you for being honest. You are still here, talking it through, and that counts.';
  if (n <= 3) return 'You said ' + n + ', not 0. A small part of you wants a different night. That part is worth hearing.';
  if (n <= 6) return 'You said ' + n + '. Part of you wants this, and part of you wants something else. Both are real.';
  return 'You said ' + n + '. Most of you wants a different night. A plan can make that easier.';
}
const TALK_WHY_BASE = ['Sleeping well tonight', 'Waking up proud', 'The people I love', 'My time', 'My focus tomorrow', 'Keeping my word to myself'];
/** "What is in that number?": the person's own reasons first (from setup, then ones typed in earlier talk-throughs),
    then a few common ones */
export function talkWhys(reasons: string[], typed: string[] = []): string[] {
  const own = reasons
    .concat(typed.slice(-3).reverse())
    .map((r) => String(r || '').trim())
    .filter(Boolean);
  const seen = new Set<string>();
  return own
    .concat(TALK_WHY_BASE)
    .filter((r) => (seen.has(r.toLowerCase()) ? false : (seen.add(r.toLowerCase()), true)))
    .slice(0, 9);
}
/** the reasons typed in earlier talk-throughs that are not on the common list (the latest last) */
export function talkTypedWhys(days: Days): string[] {
  const out: string[] = [];
  for (const { talk } of talksOf(days)) for (const r of talk.why) if (out.indexOf(r) < 0 && TALK_WHY_BASE.indexOf(r) < 0) out.push(r);
  return out;
}

/* ---------- the three paths ---------- */
export type TalkPath = 'change' | 'wait' | 'open';
export const TALK_PATHS: [TalkPath, string, string, string][] = [
  ['change', 'Change the plan', 'Meet what you need another way.', 'compass'],
  ['wait', 'Wait, and decide later', 'Pick a time to decide. Many plans fade by then.', 'timer'],
  ['open', 'Go ahead, with your eyes open', 'Chosen and noticed, not a blur. Then look back.', 'sun'],
];

export type TalkMove =
  | 'walk'
  | 'shower'
  | 'breathe'
  | 'write'
  | 'treat'
  | 'laugh'
  | 'name'
  | 'text'
  | 'people'
  | 'show'
  | 'bed'
  | 'nap'
  | 'call'
  | 'fill'
  | 'out'
  | 'hands'
  | 'away'
  | 'block'
  | 'kind'
  | 'tell'
  | 'move'
  | 'light';
/** another way to meet the need: [id, the words, how it reads after "I will"] */
export const TALK_MOVES: Record<TalkMove, [string, string]> = {
  walk: ['Walk it off', 'walk it off'],
  shower: ['A long hot shower', 'take a long hot shower'],
  breathe: ['Three minutes of slow breathing', 'breathe slowly for three minutes'],
  write: ['Write down what is pressing', 'write down what is pressing'],
  treat: ['A real treat: food I love, a game, a show', 'have a real treat'],
  laugh: ['Call someone who makes me laugh', 'call someone who makes me laugh'],
  name: ['Name the feeling in one line', 'name the feeling'],
  text: ['Text someone', 'text someone'],
  people: ['Go where people are', 'go where people are'],
  show: ['Watch something I love', 'watch something I love'],
  bed: ['Bed early, phone outside the room', 'go to bed early with the phone outside the room'],
  nap: ['A twenty-minute nap', 'take a short nap'],
  call: ['Call someone', 'call someone'],
  fill: ['Fill the hour: a game, a project, a walk', 'fill the hour'],
  out: ['Get out of the house', 'get out of the house'],
  hands: ['Start something with my hands', 'start something with my hands'],
  away: ['Put the device out of reach', 'put the device out of reach'],
  block: ['Block what I have in mind, now', 'keep it blocked'],
  /* the plan after a slip offers these too (slip.ts) */
  kind: ['Talk to myself the way a friend would', 'talk to myself the way a friend would'],
  tell: ['Tell one person I trust', 'tell one person I trust'],
  move: ['Five minutes of hard exercise', 'do five minutes of hard exercise'],
  light: ['Get outside, into some daylight', 'get outside into some daylight'],
};
/** after a slip, what was going on just before it, as the plan's "when" ("When it is late and I am in bed with my
    phone, I will ..."): the built-in answers to "What set it off?" (legacy TRIGGERS), and the urge itself for the rest */
export type TalkWhen = 'late' | 'lonely' | 'bored' | 'stress' | 'tired' | 'scroll' | 'urge';
export const TALK_WHEN: Record<TalkWhen, string> = {
  late: 'it is late and I am in bed with my phone',
  lonely: 'I feel lonely or low',
  bored: 'I am bored',
  stress: 'I am stressed or anxious',
  tired: 'I am tired',
  scroll: 'I have been scrolling or gaming',
  urge: 'the urge comes',
};
/** a move as it reads in the short plan for the hard hours, where nothing is in mind yet */
export const talkMoveName = (k: TalkMove, prep = false) => (prep && k === 'block' ? 'Turn on a blocker before they start' : TALK_MOVES[k][0]);
const NEED_MOVES: Record<TalkNeed, TalkMove[]> = {
  relief: ['walk', 'shower', 'breathe', 'write'],
  reward: ['treat', 'laugh', 'show'],
  escape: ['name', 'text', 'people', 'show'],
  rest: ['bed', 'nap', 'shower'],
  close: ['text', 'call', 'people'],
  bored: ['fill', 'out', 'hands'],
};
/** the moves offered for a need: the ones that meet it, then the two that break the plan's earliest links. Given what
    the log has shown (talkHeld), the moves whose plan held before come first, the most held first. */
export function talkMoves(need: TalkNeed | null, held: TalkHeld = {}): TalkMove[] {
  const all = ((need ? NEED_MOVES[need] : ['walk', 'text', 'fill']) as TalkMove[]).concat(['away', 'block']);
  const h = (m: TalkMove) => held[m]?.held || 0;
  const rate = (m: TalkMove) => h(m) / (held[m]?.n || 1);
  return all
    .filter((m) => h(m) > 0)
    .sort((a, b) => h(b) - h(a) || rate(b) - rate(a) || all.indexOf(a) - all.indexOf(b))
    .concat(all.filter((m) => h(m) === 0));
}
/** for each move: how many change plans with it were looked back on (n), and how many of those held */
export type TalkHeld = Partial<Record<TalkMove, { held: number; n: number }>>;
export function talkHeld(days: Days): TalkHeld {
  const out: TalkHeld = {};
  for (const { talk } of talksOf(days)) {
    if (talk.p !== 'change' || !talk.a) continue;
    for (const m of talk.m) {
      const r = (out[m] = out[m] || { held: 0, n: 0 });
      r.n++;
      if (!talk.a.went) r.held++;
    }
  }
  return out;
}
/** the line under a move whose plan held before ("Held 3 of 4 times"), the way SOS tags its tools. A move that has not
    held yet has no line. */
export function talkHeldTag(held: TalkHeld, m: TalkMove): string {
  const r = held[m];
  if (!r || !r.held) return '';
  return r.n === 1 ? 'Held last time' : 'Held ' + r.held + ' of ' + r.n + ' times';
}

/** when the plan is for: [id, the words, minutes after midnight (null for now, or a number of minutes from now when negative)] */
export const TALK_MOMENTS: [string, string, number | null][] = [
  ['now', 'Right now', null],
  ['soon', 'In an hour', -60],
  ['after', 'After work', 17 * 60 + 30],
  ['evening', 'This evening', 20 * 60],
  ['late', 'Late tonight', 23 * 60],
];
/** the decide-later times: [id, the words, minutes from now (or the next morning at 8)] */
export const TALK_WAITS: [string, string, number | null][] = [
  ['30', 'In 30 minutes', 30],
  ['60', 'In an hour', 60],
  ['120', 'In two hours', 120],
  ['morning', 'Tomorrow morning', null],
];

const midnight = (now: number) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
/** the time of a moment, or null for right now. Moments already past today are left out (talkMomentsNow). */
export function talkMomentTime(id: string, now: number): number | null {
  const m = TALK_MOMENTS.find((x) => x[0] === id);
  if (!m || m[2] == null) return null;
  return m[2] < 0 ? now - m[2] * 60000 : midnight(now) + m[2] * 60000;
}
/** the moment of a plan for the hard hours: when they start (stored as 'hard', with that time) */
export const TALK_HARD_MOMENT = 'hard';
/** the hard hours' start as a moment for the plan, when it is still ahead (at least 15 minutes from now), or null */
export const talkHardMoment = (start: number, now: number): number | null => (start > now + 15 * 60000 ? start : null);
export const talkMomentsNow = (now: number) => TALK_MOMENTS.filter((m) => m[2] == null || m[2] < 0 || midnight(now) + m[2] * 60000 > now + 15 * 60000);
export function talkWaitTime(id: string, now: number): number {
  const w = TALK_WAITS.find((x) => x[0] === id);
  if (w && w[2] != null) return now + w[2] * 60000;
  return midnight(now) + (24 + 8) * 3600000;
}
export function talkClock(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM');
}

/** a move in the person's own words, as it reads after "I will" */
const ownThen = (x: string) => {
  const t = x.trim().replace(/[.!]+$/, '');
  return /^I\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
};
/** the moves of a talk-through, as they read on a card: the picked ones, then the person's own */
export function talkMoveWords(t: Pick<Talk, 'm' | 'mx'>): string[] {
  return t.m
    .map((id) => TALK_MOVES[id as TalkMove]?.[0])
    .filter(Boolean)
    .concat(t.mx || []);
}

/** "11 PM", "10:30 PM" */
const clockShort = (t: number) => talkClock(t).replace(':00 ', ' ');
/** the change plan in one line: "This evening, when I want relief, I will walk it off and put the device out of reach."
    A plan for the hard hours starts at their time: "At 11 PM, when I want rest, I will ..." */
export function talkPlanLine(t: Pick<Talk, 'n' | 'm' | 'mo'> & Partial<Pick<Talk, 'nx' | 'mx' | 'at' | 'fw' | 'ft'>>): string {
  const mo = TALK_MOMENTS.find((x) => x[0] === t.mo);
  const lead = t.mo === TALK_HARD_MOMENT && t.at ? 'At ' + clockShort(t.at) : !mo || mo[0] === 'now' ? 'Right now' : mo[1];
  const thens = t.m
    .map((id) => TALK_MOVES[id as TalkMove]?.[1])
    .filter(Boolean)
    .concat((t.mx || []).map(ownThen));
  const then = thens.length > 1 ? thens.slice(0, -1).join(', ') + ' and ' + thens[thens.length - 1] : thens[0] || 'do what I planned';
  const at = t.mo === 'late' ? ' late at night' : t.mo === 'evening' ? ' in the evening' : '';
  /* a plan made after a slip is an if-then plan from what was going on: "When I am bored in the evening, I will ..." */
  if (t.ft) return 'When ' + TALK_WHEN[t.ft] + (t.ft === 'late' ? '' : at) + ', I will ' + then + '.';
  /* (or, from before October 27, 2026, from the feeling: "When I feel lonely late at night, I will ...") */
  if (t.fw) return 'When I feel ' + t.fw.toLowerCase() + at + ', I will ' + then + '.';
  return lead + ', when I want ' + talkNeedWord(t.n, t.nx) + ', I will ' + then + '.';
}

/* ---------- eyes open ---------- */
/** what is noticed in the body: where, and what it is like (the same words as Get curious) */
export const TALK_WHERE: [string, string][] = [
  ['chest', 'Chest'],
  ['stomach', 'Stomach'],
  ['groin', 'Groin'],
  ['throat', 'Throat or jaw'],
  ['hands', 'Hands or arms'],
  ['head', 'Head'],
  ['all', 'All over'],
];
export const TALK_FEEL: [string, string][] = [
  ['tight', 'Tight'],
  ['hot', 'Hot'],
  ['buzzy', 'Buzzy'],
  ['heavy', 'Heavy'],
  ['hollow', 'Hollow'],
  ['restless', 'Restless'],
];
/** how it feels afterwards */
export const TALK_AFTER_FEEL: [string, string][] = [
  ['relieved', 'Relieved'],
  ['calm', 'Calm'],
  ['flat', 'Flat'],
  ['tired', 'Tired'],
  ['empty', 'Empty'],
  ['restless', 'Restless'],
  ['low', 'Low'],
];
/** what it cost */
export const TALK_COST: [string, string][] = [
  ['time', 'Time'],
  ['sleep', 'Sleep'],
  ['energy', 'Energy'],
  ['mood', 'Mood'],
  ['focus', 'Focus'],
  ['none', 'Nothing much'],
];

/* ---------- the record ---------- */
export interface TalkAfter {
  /** went ahead (true) or chose something else (false) */
  went: boolean;
  t: number;
  /** after going ahead: how it feels now, what it gave (0 to 10), what it cost */
  f: string[];
  g: number | null;
  c: string[];
  /** feelings and costs in the person's own words (only when there are some) */
  fx?: string[];
  cx?: string[];
}
export interface Talk {
  id: string;
  /** when it was talked through (ms) */
  t: number;
  s: TalkSign[];
  n: TalkNeed | null;
  /** the need in the person's own words, when none of the list fits (only when there is one) */
  nx?: string;
  /** how much a different night is wanted, 0 to 10 */
  w: number | null;
  /** what is in that number (the person's words) */
  why: string[];
  p: TalkPath | null;
  /** change: the moves; wait: the one thing until then */
  m: TalkMove[];
  /** moves in the person's own words (only when there are some) */
  mx?: string[];
  /** change: the moment; wait: the decide-later choice */
  mo: string | null;
  /** change: the moment's time; wait: when to decide (ms) */
  at: number | null;
  /** eyes open: where it is felt, what it feels like, and what it is expected to give (0 to 10) */
  b: string[];
  f: string[];
  e: number | null;
  a: TalkAfter | null;
  /** 1 when it is the short plan made ahead of the hard hours (the hard hours card): no slip was in mind, so it does not
      count as a sign of when it gets hard (risk.ts). Only when it is one. */
  pr?: 1;
  /** after a slip: the feeling named for before it, the plan's "when I feel ..." (slip.ts). Only when there is one. */
  fw?: string;
  /** after a slip: what was going on just before it, the plan's "when ..." (slip.ts). Only when there is one. */
  ft?: TalkWhen;
}

const SIGNS = TALK_SIGNS.map((x) => x[0]);
const NEEDS = TALK_NEEDS.map((x) => x[0]);
const PATHS = TALK_PATHS.map((x) => x[0]);
const MOVES = Object.keys(TALK_MOVES);
const ids = (l: [string, string][]) => l.map((x) => x[0]);
const pick = <T extends string>(a: unknown, ok: readonly string[], max = 8): T[] =>
  Array.isArray(a) ? ([...new Set(a.filter((x) => typeof x === 'string' && ok.indexOf(x) >= 0))].slice(0, max) as T[]) : [];
const score = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10 ? v : null);
const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
/** answers in the person's own words: trimmed, short, no repeats */
export const TALK_OWN_LEN = 60;
export function talkOwn(a: unknown, max = 3): string[] {
  if (!Array.isArray(a)) return [];
  const out: string[] = [];
  for (const x of a) {
    const t = typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, TALK_OWN_LEN) : '';
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, max);
}
const withOwn = <T extends object>(o: T, k: string, v: string[] | string) => (v.length ? Object.assign(o, { [k]: v }) : o);

/** one saved talk-through, cleaned, or null when it is not one */
export function normTalk(x: unknown): Talk | null {
  if (!x || typeof x !== 'object') return null;
  const v = x as Record<string, unknown>;
  const t = time(v.t);
  if (typeof v.id !== 'string' || !v.id || v.id.length > 24 || t == null) return null;
  const a = v.a && typeof v.a === 'object' ? (v.a as Record<string, unknown>) : null;
  const out: Talk = {
    id: v.id,
    t,
    s: pick<TalkSign>(v.s, SIGNS),
    n: NEEDS.indexOf(v.n as TalkNeed) >= 0 ? (v.n as TalkNeed) : null,
    w: score(v.w),
    why: Array.isArray(v.why)
      ? v.why
          .filter((r): r is string => typeof r === 'string' && !!r.trim())
          .map((r) => r.trim().slice(0, 80))
          .slice(0, 7)
      : [],
    p: PATHS.indexOf(v.p as TalkPath) >= 0 ? (v.p as TalkPath) : null,
    m: pick<TalkMove>(v.m, MOVES),
    mo: typeof v.mo === 'string' && v.mo.length <= 12 ? v.mo : null,
    at: time(v.at),
    b: pick(v.b, ids(TALK_WHERE)),
    f: pick(v.f, ids(TALK_FEEL)),
    e: score(v.e),
    a:
      a && typeof a.went === 'boolean' && time(a.t) != null
        ? withOwn(
            withOwn({ went: a.went, t: a.t as number, f: pick(a.f, ids(TALK_AFTER_FEEL)), g: score(a.g), c: pick(a.c, ids(TALK_COST)) }, 'fx', talkOwn(a.fx)),
            'cx',
            talkOwn(a.cx),
          )
        : null,
  };
  withOwn(out, 'nx', out.n ? '' : talkOwn([v.nx], 1)[0] || '');
  withOwn(out, 'mx', talkOwn(v.mx));
  if (v.pr === 1) out.pr = 1;
  if (typeof v.fw === 'string' && /^[A-Za-z][A-Za-z ]{0,23}$/.test(v.fw)) out.fw = v.fw;
  if (typeof v.ft === 'string' && Object.prototype.hasOwnProperty.call(TALK_WHEN, v.ft)) out.ft = v.ft as TalkWhen;
  return out;
}
/** a day's talk-throughs, cleaned (used by normP in legacy/core.js) */
export function normTalks(x: unknown): Talk[] {
  if (!Array.isArray(x)) return [];
  const out: Talk[] = [];
  for (const v of x) {
    const t = normTalk(v);
    if (t && !out.some((o) => o.id === t.id)) out.push(t);
  }
  return out.slice(-12);
}

/** a new, empty talk-through */
export const newTalk = (now: number): Talk => ({
  id: 't' + now.toString(36),
  t: now,
  s: [],
  n: null,
  w: null,
  why: [],
  p: null,
  m: [],
  mo: null,
  at: null,
  b: [],
  f: [],
  e: null,
  a: null,
});

/** every talk-through in the log, oldest first, with its day */
export function talksOf(days: Days): { k: DayKey; talk: Talk }[] {
  const out: { k: DayKey; talk: Talk }[] = [];
  for (const k of Object.keys(days).sort()) for (const talk of normTalks(days[k]?.p?.tt)) out.push({ k, talk });
  return out.sort((x, y) => x.talk.t - y.talk.t);
}
export function talkById(days: Days, id: string): { k: DayKey; talk: Talk } | null {
  return talksOf(days).find((x) => x.talk.id === id) || null;
}

export type TalkDue = 'decide' | 'waiting' | 'passed' | 'plan' | 'look';
const HOUR = 3600000;
/** the hour the morning starts, for looking back on a change plan */
export const TALK_MORNING_H = 6;
/** how long a decide-later stays on Today, and how long a change plan's look back is offered once it opens */
const WAIT_FOR = 36 * HOUR;
const LOOK_FOR = 24 * HOUR;
/** an eyes-open go-ahead is asked about for three days (on Today), and then let go: no slip is
    ever written for one that was not answered */
export const TALK_OPEN_FOR = 72 * HOUR;
/** hard hours, as [start, end] times (ms) */
export type TalkHard = [number, number][];

/** the first morning after t */
function morningAfter(t: number): number {
  const d = new Date(t);
  d.setHours(TALK_MORNING_H, 0, 0, 0);
  if (d.getTime() <= t) d.setDate(d.getDate() + 1);
  return d.getTime();
}
const inHard = (t: number, hard: TalkHard) => hard.some(([a, b]) => t >= a && t < b);
/** when "Did your plan hold?" opens for a change plan: the later of the next morning and two hours after the moment
    ("right now": the time it was talked through), and never inside the hard hours (it waits for them to end) */
export function talkLookAt(t: Pick<Talk, 't' | 'at'>, hard: TalkHard = []): number {
  const moment = t.at ?? t.t;
  let look = Math.max(morningAfter(moment), moment + 2 * HOUR);
  for (let i = 0; i < 8; i++) {
    const h = hard.find(([a, b]) => look >= a && look < b);
    if (!h) break;
    look = h[1];
  }
  return look;
}

const p2 = (n: number) => String(n).padStart(2, '0');
/** a slip in the log after the talk-through at t on log day k: later that day (or with no time), or on a later day. A slip
    in the same minute is the one the talk-through came after (Talk it through right after logging a slip), not a new one. */
export function slipSince(days: Days, k: DayKey, t: number): boolean {
  const d = new Date(t);
  const since = p2(d.getHours()) + ':' + p2(d.getMinutes());
  return Object.keys(days).some((dk) => dk >= k && (days[dk]?.events || []).some((e) => e.outcome === 'slipped' && (dk !== k || !e.time || e.time > since)));
}

/** what one talk-through needs from Today at now, if anything. A decide-later or a changed plan is settled by a slip
    logged after it: the slip was already looked at honestly when it was logged, so Today does not ask again. */
function dueOf(t: Talk, k: DayKey, days: Days, now: number, hard: TalkHard): TalkDue | null {
  if (!t.p || t.a) return null;
  if (t.p !== 'open' && slipSince(days, k, t.t)) return null;
  /* a decide-later: waiting, then time to decide; once the morning after its moment comes with no slip, the wait has
     done its work, and Today says so ("passed") instead of asking to decide about a night that is over */
  if (t.p === 'wait') {
    if (now - t.t >= WAIT_FOR) return null;
    if (t.at && now < t.at) return 'waiting';
    return now >= morningAfter(t.at ?? t.t) ? 'passed' : 'decide';
  }
  /* going ahead with eyes open: "look back" from the start, until it is answered or three days have gone by */
  if (t.p === 'open') return now - t.t < TALK_OPEN_FOR ? 'look' : null;
  /* a change plan stays on Today until its look back opens (the next morning), then "Did your plan hold?" for a day,
     and never inside the hard hours */
  const look = talkLookAt(t, hard);
  if (now < look) return 'plan';
  return now - look < LOOK_FOR && !inHard(now, hard) ? 'look' : null;
}
/** the talk-through Today should show, if one still matters, the latest first: waiting to
    decide, time to decide, a wait that passed, a change plan before its look back, or "look back". `hard` is the person's hard hours
    (talkDueNow in talk-log.ts fills it in). */
export function talkDue(days: Days, now: number, hard: TalkHard = []): { k: DayKey; talk: Talk; due: TalkDue } | null {
  const all = talksOf(days);
  for (let i = all.length - 1; i >= 0; i--) {
    const due = dueOf(all[i].talk, all[i].k, days, now, hard);
    if (due) return { ...all[i], due };
  }
  return null;
}

const keyDate = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** when a talk-through on log day k was, as it reads from log day tk: '' (today), 'last night', 'yesterday', or
    'on Monday' */
export function talkAgo(k: DayKey, tk: DayKey, t: number): string {
  const n = Math.round((keyDate(tk).getTime() - keyDate(k).getTime()) / (24 * HOUR));
  if (n <= 0) return '';
  const h = new Date(t).getHours();
  if (n === 1) return h >= 17 || h < TALK_MORNING_H ? 'last night' : 'yesterday';
  return 'on ' + keyDate(k).toLocaleDateString('en-US', { weekday: 'long' });
}

/** the decide-later card's line: "Until then: a real treat: food I love, a game, a show." (only the first letter
    lowered, so "I" stays "I") */
export function talkUntilLine(t: Pick<Talk, 'm' | 'mx'>): string {
  const w = talkMoveWords(t)[0] || 'something kind for yourself';
  return 'Until then: ' + (/^I\b/.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1)).replace(/[.!]+$/, '') + '.';
}

/** what looking back has shown: going ahead with eyes open (what was expected against what it gave), and the times
    something else was chosen */
export function talkEvidence(days: Days) {
  const rows: { e: number; g: number }[] = [];
  let chose = 0;
  let went = 0;
  for (const { talk } of talksOf(days)) {
    if (!talk.a) continue;
    if (!talk.a.went) chose++;
    else {
      went++;
      if (talk.e != null && talk.a.g != null) rows.push({ e: talk.e, g: talk.a.g });
    }
  }
  const avg = (l: number[]) => (l.length ? Math.round((l.reduce((a, b) => a + b, 0) / l.length) * 10) / 10 : null);
  return { rows: rows.slice(-8), expected: avg(rows.map((r) => r.e)), gave: avg(rows.map((r) => r.g)), chose, went };
}

/** the line under the numbers, once looked back on */
export function talkEvidenceLine(ev: ReturnType<typeof talkEvidence>): string {
  if (!ev.rows.length) return '';
  const last = ev.rows[ev.rows.length - 1];
  if (ev.rows.length === 1)
    return last.g < last.e
      ? 'You expected ' + last.e + '. It gave ' + last.g + '. That gap is wanting and liking coming apart.'
      : 'You expected ' + last.e + ', and it gave ' + last.g + '. Honest numbers are what make this useful.';
  const n = ev.rows.length;
  return ev.gave! < ev.expected!
    ? 'Across ' + n + ' times, you expected ' + ev.expected + ' on average, and it gave ' + ev.gave + '. Your own numbers are showing the gap.'
    : 'Across ' + n + ' times, you expected ' + ev.expected + ' on average, and it gave ' + ev.gave + '. Keep looking honestly. It adds up.';
}
