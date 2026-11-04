/* Walk it through (the owner, November 4, 2026; docs/plan.md, "The trail, fifth design"): the way into the trail, and what
   took the place of Planning a slip. About four minutes, like a coach beside the person: it teaches what is happening in them
   right now, asks only what they can answer and what changes from one time to the next, says their answers back, and lets
   them write at two moments. The map becomes a result: the person never has to know which place they are at.

   The voice is a blend the owner asked for: a faith-based attack analysis (the attack has a pattern and reasons behind it, you
   are not evil, and for people of faith, God is with you) and a calm coach ("this is not overwhelming; notice it and handle
   it"). Faith lines only for someone who said faith plays a part.

   What it rests on (side-session notes trail-research-science and -therapists): urge surfing and defusion from ACT (Crosby
   and Twohig 2016), naming a feeling in words (Lieberman 2007), noticing the body with curiosity (Brewer 2011), chain analysis
   from DBT (Rizvi), a scaling question from motivational interviewing ("why a 6 and not a 9?"), and if-then plans (Gollwitzer
   and Sheeran 2006). From Planning a slip it keeps the permission thoughts and their research, the need underneath with
   Daybook's own moves, the person's reasons, and the plan with "Did your plan hold?" the next morning (talk.ts). Nothing here
   asks a person to reach out to anyone, and nothing sends them to bed in the day.

   A walk is saved as a talk-through (p.tt, so it syncs with the log) with a change plan and `wk`, what only a walk has. */
import { trailFill, type TrailPlace } from './trail';
import { TALK_SRC, talkPlanLine, type Talk, type TalkMove, type TalkNeed, type TalkSign, type WalkLine, type WalkNeed, type WalkRec } from './talk';

export type { WalkLine, WalkNeed, WalkRec } from './talk';

/* ---------- the coach: what the flame says, and why it works ---------- */
/** the research the walk rests on, for "Why this works" (the papers Planning a slip cited, and the walk's own) */
export const WALK_SRC: Record<string, [string, string]> = {
  ...TALK_SRC,
  crosby: [
    'Crosby & Twohig (2016): acceptance and commitment therapy for problematic internet pornography use, a randomized trial, Behavior Therapy',
    'https://doi.org/10.1016/j.beth.2016.02.001',
  ],
  bowen: [
    'Bowen & Marlatt (2009): surfing the urge, a brief mindfulness intervention for smokers, Psychology of Addictive Behaviors',
    'https://doi.org/10.1037/a0017127',
  ],
  bouton: [
    'Bouton (2002): context, ambiguity and unlearning, the sources of relapse after extinction, Biological Psychiatry',
    'https://doi.org/10.1016/S0006-3223(02)01546-9',
  ],
  lieberman: ['Lieberman et al. (2007): putting feelings into words, Psychological Science', 'https://doi.org/10.1111/j.1467-9280.2007.01916.x'],
  masuda: [
    'Masuda, Hayes et al. (2004): cognitive defusion and self-relevant negative thoughts, Behaviour Research and Therapy',
    'https://doi.org/10.1016/j.brat.2003.10.008',
  ],
  rizvi: [
    'Rizvi & Ritschel (2014): mastering the art of chain analysis in DBT, Cognitive and Behavioral Practice',
    'https://doi.org/10.1016/j.cbpra.2013.09.002',
  ],
  gollwitzer: [
    'Gollwitzer & Sheeran (2006): implementation intentions and goal achievement, a meta-analysis, Advances in Experimental Social Psychology',
    'https://doi.org/10.1016/S0065-2601(06)38002-1',
  ],
};
export type WalkBeat = 'open' | 'hold' | 'body' | 'alarm' | 'defuse' | 'ride' | 'chain' | 'plan';
/** for each teaching beat: what the flame says first (short, for a person in a craving), and why it works, with the papers */
export const WALK_COACH: Record<WalkBeat, { say: string; why: string; src: string[] }> = {
  open: {
    say: 'Urges come back. That is how a habit fades. You do not have to fight this one. Notice it, and handle it.',
    why: 'In a trial for porn use, people learned to notice urges and let them pass, without fighting them. Their viewing fell by 93%, and was still down 85% three months later.',
    src: ['crosby'],
  },
  hold: {
    say: 'Something is already holding it down. Name it.',
    why: 'Counselors ask “why not higher?” on purpose. Saying out loud what already helps makes you more likely to use it again.',
    src: ['tip35'],
  },
  body: {
    say: 'Find it in your body. Be curious, like you are watching weather.',
    why: 'Naming a feeling in plain words calms the brain’s alarm. And in a trial, people trained to notice cravings with curiosity quit smoking far more often: 31% against 6%.',
    src: ['lieberman', 'brewer'],
  },
  alarm: {
    say: 'It is an alarm your brain learned. Unanswered, it rings quieter next time.',
    why: 'This is how a habit unlearns. A cue that fires and is not answered loses its pull a little each time. Riding the wave without acting on it is the practice.',
    src: ['bouton', 'bowen'],
  },
  defuse: {
    say: 'Say it once, like this. Then answer it.',
    why: 'Seeing a thought as a thought, not an order, takes much of its pull. In studies, people who did this found the thought less believable and less upsetting.',
    src: ['masuda'],
  },
  ride: {
    say: 'Two minutes. Each line goes on by itself. Just do what it says.',
    why: 'Holding a picture in your mind’s eye crowds out the craving’s picture, and the wave passes its top while you do.',
    src: ['bowen'],
  },
  chain: {
    say: 'You just did what therapists call a chain analysis.',
    why: 'Walking through what led to an urge, link by link, shows where it can be cut next time. You can see the whole chain now.',
    src: ['rizvi'],
  },
  plan: {
    say: 'A plan made now, in your words, is there when it comes back.',
    why: 'An if-then plan (“when this comes, I will …”) made people much more likely to follow through, across 94 studies.',
    src: ['gollwitzer'],
  },
};

/* ---------- 1. nothing has gone wrong ---------- */
export type WalkFaith = 'lds' | 'christian' | 'plain' | null;
/** whether faith lines are said: only when the person said faith plays a part (a lot, or some) */
export function walkFaith(st: { onb?: { a?: { faith?: string; creed?: string } } | null } | null | undefined): WalkFaith {
  const a = st?.onb?.a || {};
  if (a.faith !== 'big' && a.faith !== 'some') return null;
  return a.creed === 'lds' ? 'lds' : a.creed === 'christian' ? 'christian' : 'plain';
}

/** the opening: what is happening, and that it is not a failure */
export function walkOpen(faith: WalkFaith): { title: string; body: string; faith: string | null } {
  return {
    title: 'Nothing has gone wrong.',
    body: 'Urges come back. That is how a habit fades, not a sign it is winning. This one has a pattern, and we will walk through it together. You do not have to fight it. Notice it, and handle it.',
    faith: faith
      ? 'An urge is not a sin, and having one does not make you bad. ' + (faith === 'lds' ? 'Heavenly Father' : 'God') + ' is with you in this, right now.'
      : null,
  };
}

/* ---------- 2. how strong, and what is already holding it down ---------- */
/** 8 and up: SOS first, with the walk a tap away */
export const WALK_SOS = 8;
/** "Why a 6, and not a 9?": the number they said, and a higher one to ask about (none at 10) */
export function walkWhyNot(n: number): number | null {
  if (n >= 10 || n <= 0) return null;
  return Math.min(10, n + (n <= 2 ? 3 : n >= 8 ? 1 : 3));
}
export type WalkHold = 'here' | 'know' | 'reasons' | 'opened' | 'part' | 'god';
/** what is already holding it down: [id, the words, how it reads said back] */
export const WALK_HOLDS: [WalkHold, string, string][] = [
  ['here', 'I am somewhere I cannot', 'where you are'],
  ['know', 'I know how it ends', 'knowing how it ends'],
  ['reasons', 'My reasons', 'your reasons'],
  ['opened', 'I opened this', 'opening this'],
  ['part', 'Part of me does not want it', 'the part of you that does not want it'],
  ['god', 'God is with me', 'your faith'],
];
export const walkHolds = (faith: WalkFaith) => WALK_HOLDS.filter((h) => h[0] !== 'god' || !!faith);
/** said back: what is holding it down is theirs to use */
export function walkHoldBack(n: number, holds: string[], own?: string | string[]): string {
  const words = holds.map((h) => WALK_HOLDS.find((x) => x[0] === h)?.[2]).filter(Boolean) as string[];
  for (const o of (Array.isArray(own) ? own : [own]).map(clean).filter(Boolean)) words.push('“' + o.replace(/[.!]+$/, '') + '”');
  const what = list(words);
  return what
    ? 'So ' + what + (words.length > 1 ? ' are' : ' is') + ' already holding it at ' + n + '. That is yours, and it is working.'
    : 'Something is already holding it at ' + n + '. Whatever it is, it is working.';
}

/* ---------- 3. notice it ---------- */
export type WalkBad = 'nothing' | 'stop' | 'stand' | 'mean';
/** "What is so bad about that feeling?": [id, the words, the answer] (a calm coach's question: it is uncomfortable, and that is all) */
export const WALK_BAD: [WalkBad, string, string][] = [
  ['nothing', 'Nothing, really. It is just uncomfortable.', 'Exactly. Uncomfortable, not dangerous. Let it be there.'],
  ['stop', 'It will not stop', 'It feels that way near the top. Watch it: it rises, peaks and falls.'],
  ['stand', 'I cannot stand it', 'You are standing it right now. Loud, and you still choose.'],
  ['mean', 'It means I have not changed', 'It means the old wiring still rings. It gets quieter as you change.'],
];
/** what the feeling is: an alarm the brain learned, and how alarms unlearn */
export function walkAlarm(where: string, feel: string): string {
  const f = clean(feel).toLowerCase();
  const w = walkBodyAt(where);
  return (
    'That ' +
    (f ? f + ' ' : '') +
    'feeling' +
    (w ? ' ' + w : '') +
    ' is an alarm. Your brain learned to ring it here, where the habit used to pay off. ' +
    'An alarm that rings and is not answered rings quieter next time. Every urge you ride out teaches it.'
  );
}

/** where it is felt, as it reads after the feeling: "in your chest", "all over" */
export function walkBodyAt(where: string): string {
  const w = clean(where).toLowerCase();
  if (!w) return '';
  return w === 'all over' ? 'all over' : 'in your ' + w.replace(' or ', ' and ');
}
/** a person's words ending in a full stop, unless they end in one already (or a ? or !) */
export const walkStop = (t: string) => {
  const x = clean(t);
  return !x || /[.!?…]$/.test(x) ? x : x + '.';
};

/* ---------- 4. the line ---------- */
export interface WalkLineDef {
  id: WalkLine;
  /** what it says, as the person hears it */
  line: string;
  /** the true answer to it */
  answer: string;
  /** what it really is, with a fact that ends in what changes it */
  fact: string;
  /** the sign it was in Planning a slip, so the record and the patterns read it */
  sign: TalkSign;
  /** what the flame says when it is picked: the fact, short */
  short: string;
  /** the research behind it (WALK_SRC) */
  src: string[];
}
export const WALK_LINES: WalkLineDef[] = [
  {
    id: 'owed',
    line: 'I deserve it.',
    answer: 'I do deserve something good. This is not it.',
    fact: 'That is a permission thought. People who are trying to quit hear more of them, not fewer, so hearing one means you are changing. The hard day is real. Give it a real reward.',
    sign: 'owed',
    short: 'That is a permission thought. Hearing one means you are changing, not failing.',
    src: ['brandtner'],
  },
  {
    id: 'once',
    line: 'Just once.',
    answer: 'I have never stopped at once. Once is the first step down.',
    fact: 'That is a permission thought. It makes the next step sound small, because the first step always looks small. Seeing it as a thought, not an order, is what takes its power.',
    sign: 'anyway',
    short: 'A permission thought. The first step always looks small.',
    src: ['brandtner'],
  },
  {
    id: 'nobody',
    line: 'Nobody will know.',
    answer: 'I will know, and I am the one I am doing this for.',
    fact: 'Hiding is what keeps a habit strong, and shame makes slips more likely, not less. The part of you that knows is the part that is changing, and it is on your side.',
    sign: 'care',
    short: 'Hiding keeps a habit strong. The part of you that knows is on your side.',
    src: ['tracy'],
  },
  {
    id: 'blew',
    line: 'I already slipped today.',
    answer: 'Every day counts on its own. A slip is not a reason for another one.',
    fact: 'All or nothing is the trap. In studies of quitting, the slip was not the real danger. The give-up after it was. Nothing you have built is lost.',
    sign: 'anyway',
    short: 'All or nothing is the trap. Nothing you built is lost.',
    src: ['kirchner'],
  },
  {
    id: 'focus',
    line: 'I cannot focus until I do.',
    answer: 'It rises, peaks and falls on its own when I do not feed it.',
    fact: 'An urge is a wave. Giving in does not end urges. It teaches your brain that the alarm works, so it rings sooner next time. Riding it out teaches the opposite.',
    sign: 'replay',
    short: 'An urge is a wave. Giving in teaches the alarm to ring sooner.',
    src: ['bowen'],
  },
  {
    id: 'tired',
    line: 'Too tired to fight it.',
    answer: 'Then I do not fight. I notice it and let it pass.',
    fact: 'Tired wears down the part of the brain that holds back, so every pull is louder. That is a reason to rest, not a reason for this. And you do not have to fight. Noticing is enough.',
    sign: 'care',
    short: 'Tired makes every pull louder. You do not have to fight. Noticing is enough.',
    src: ['brewer'],
  },
  {
    id: 'last',
    line: 'This is the last time.',
    answer: 'The last time is the one I do not take.',
    fact: 'A promised last time makes this one easy to say yes to. Every last time so far was followed by another. The real last time is the one you skip.',
    sign: 'plan',
    short: 'Every last time so far had another after it. The real last one is the one you skip.',
    src: ['brandtner'],
  },
  {
    id: 'want',
    line: 'I just want it.',
    answer: 'Wanting is not liking. It promises more than it gives.',
    fact: 'The brain’s wanting grows louder over time while the real enjoyment fades. When people notice closely what it gives, the wanting itself wears down.',
    sign: 'replay',
    short: 'Wanting is not liking. It promises more than it gives.',
    src: ['berridge', 'taylor'],
  },
];
export const walkLine = (id: WalkLine | null) => WALK_LINES.find((x) => x.id === id) || null;
/** the line said the way that loosens it (defusion): "I am having the thought that ..." */
export function walkDefuse(line: string): string {
  const t = walkStop(line || 'I want it');
  return 'I am having the thought that “' + (/^I\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1)) + '”';
}

/* ---------- 5. what it is trying to fix ---------- */
export interface WalkNeedDef {
  id: WalkNeed;
  label: string;
  /** what the urge is doing about it, ending in what helps */
  fact: string;
  /** the move for it now, by day and by night */
  day: string;
  night: string;
  /** the need in Planning a slip, and its moves for a plan (Daybook's own first) */
  need: TalkNeed | null;
  moves: { day: TalkMove[]; night: TalkMove[] };
  /** worn down: the place is Drift when this is underneath and it was only just noticed */
  low: boolean;
  /** what the flame says when it is picked */
  short: string;
}
export const WALK_NEEDS: WalkNeedDef[] = [
  {
    id: 'stress',
    label: 'Stressed',
    fact: 'Stress wants relief, fast. This gives about a minute of it, then adds to the pile. Your body can get real relief another way, and quicker than you think.',
    day: 'Breathe out longer than you breathe in, five times.',
    night: 'Breathe out longer than you breathe in, five times.',
    need: 'relief',
    moves: { day: ['breathe', 'write', 'walk'], night: ['write', 'breathe', 'away'] },
    low: true,
    short: 'Stress wants relief, fast. This gives a minute of it, then adds to the pile.',
  },
  {
    id: 'bored',
    label: 'Bored',
    fact: 'Boredom is your brain asking for something new. This is the fastest new thing it knows, not the best one. Give it something real to do.',
    day: 'Stand up and get something in your hands: water, a pen, a ball.',
    night: 'Turn on a light and sit somewhere else.',
    need: 'bored',
    moves: { day: ['fill', 'hands', 'out'], night: ['show', 'away', 'bed'] },
    low: false,
    short: 'Boredom asks for something new. This is the fastest new thing, not the best.',
  },
  {
    id: 'lonely',
    label: 'Lonely',
    fact: 'Loneliness is a real need for people. This offers a picture of closeness and leaves you lonelier after. The need deserves the real thing.',
    day: 'Step out to where people are, even just a hallway.',
    night: 'Put on voices you like: a podcast or a show with people talking.',
    need: 'close',
    moves: { day: ['people', 'out', 'walk'], night: ['show', 'write', 'away'] },
    low: true,
    short: 'Lonely is a real need for people. This leaves you lonelier after.',
  },
  {
    id: 'tired',
    label: 'Tired',
    fact: 'Tired wears down the part of your brain that holds back, so every pull is louder. It is asking for rest, and this is not rest.',
    day: trailFill('tired', 'm', false),
    night: trailFill('tired', 'm', true),
    need: 'rest',
    moves: { day: ['light', 'walk', 'nap'], night: ['bed', 'away'] },
    low: true,
    short: 'Tired is asking for rest. This is not rest.',
  },
  {
    id: 'angry',
    label: 'Angry',
    fact: 'Anger is energy that wants out. This burns a little of it and leaves the reason untouched. Your body can burn it better.',
    day: trailFill('angry', 'm', false),
    night: 'Twenty push-ups or a wall sit, until your legs shake.',
    need: 'relief',
    moves: { day: ['move', 'walk', 'write'], night: ['move', 'write', 'away'] },
    low: true,
    short: 'Anger is energy that wants out. Your body can burn it better.',
  },
  {
    id: 'sad',
    label: 'Sad or down',
    fact: 'Sad wants comfort. This numbs it for a minute, then leaves it heavier. Comfort that lasts is slower, and it is there.',
    day: 'Name it to yourself in one line: I feel sad because …',
    night: 'Name it to yourself in one line: I feel sad because …',
    need: 'escape',
    moves: { day: ['name', 'light', 'journal'], night: ['name', 'shower', 'journal'] },
    low: true,
    short: 'Sad wants comfort. This numbs it a minute, then leaves it heavier.',
  },
  {
    id: 'habit',
    label: 'Nothing, just habit',
    fact: 'Sometimes nothing is underneath: it is just the time and place it always happens. That is a cue, and a cue loses its pull when you change the place.',
    day: 'Stand up and go somewhere else, even the next room.',
    night: 'Turn on a light and go to another room.',
    need: null,
    moves: { day: ['out', 'away', 'walk'], night: ['away', 'out', 'bed'] },
    low: false,
    short: 'Just the usual time and place. Change the place, and the cue loses its pull.',
  },
];
export const walkNeed = (id: WalkNeed | null) => WALK_NEEDS.find((x) => x.id === id) || null;
/** the move for the need now, by the time of day (never bed in the day) */
export const walkNeedMove = (n: WalkNeedDef, night: boolean) => (night ? n.night : n.day);
/** the moves a plan offers for the need, by the time of day: never bed in the day */
export const walkNeedMoves = (n: WalkNeedDef | null, night: boolean): TalkMove[] =>
  ((n ? (night ? n.moves.night : n.moves.day) : ['out', 'away', 'write']) as TalkMove[]).filter((m) => night || (m !== 'bed' && m !== 'nap'));

/** the moves a plan offers, by when it may come back: late tonight is night; this evening has no daylight, nap or bed; in
    an hour or after work goes by the hour now */
export function walkPlanMoves(n: WalkNeedDef | null, mo: string | null, nightNow: boolean): TalkMove[] {
  if (mo === 'late') return walkNeedMoves(n, true);
  if (mo === 'evening') return walkNeedMoves(n, false).filter((m) => m !== 'light');
  return walkNeedMoves(n, nightNow);
}

/* ---------- 6. where it is: the place, as a result ---------- */
export type WalkStage = 'noticed' | 'picturing' | 'arguing' | 'reaching';
export const WALK_STAGES: [WalkStage, string][] = [
  ['noticed', 'I just noticed it'],
  ['picturing', 'I am picturing it'],
  ['arguing', 'I am arguing with it'],
  ['reaching', 'I am already reaching for it'],
];
/** the place on the trail: worn down and just noticed is Drift, else the stage's place */
export function walkPlace(stage: WalkStage, need: WalkNeed | null): TrailPlace {
  if (stage === 'picturing') return 'preview';
  if (stage === 'arguing') return 'case';
  if (stage === 'reaching') return 'steps';
  return walkNeed(need)?.low ? 'drift' : 'spark';
}
const PLACE_NAME: Record<TrailPlace, string> = { drift: 'Drift', spark: 'Spark', preview: 'Preview', case: 'Case', steps: 'Steps' };
const AWAY: Record<TrailPlace, string> = { drift: 'five', spark: 'four', preview: 'three', case: 'two', steps: 'one' };
/** said with the map: the place, how far from the edge, and that it has a way off */
export function walkWhere(at: TrailPlace): { title: string; body: string } {
  return {
    title: 'You are at ' + PLACE_NAME[at] + '.',
    body:
      at === 'steps'
        ? 'The last place before the edge, and it still has a way off. Knowing where it goes is not the same as having to go.'
        : 'That is ' + AWAY[at] + ' places from the edge, and every one of them has a way off. You found where you are. That is most of the work.',
  };
}

/* ---------- 8. explain it back ---------- */
/** the chain built from their taps, top to bottom: what it was, step by step */
export function walkChain(w: { n0: number | null; where: string; feel: string; line: string; need: WalkNeed | null; at: TrailPlace | null }): string[] {
  const out: string[] = [];
  const need = walkNeed(w.need);
  if (need) out.push(need.id === 'habit' ? 'The usual time and place' : need.label + ', underneath');
  if (w.n0 != null) out.push('An urge at ' + w.n0 + ' out of 10');
  const body = [w.feel, walkBodyAt(w.where)].filter(Boolean).join(' ');
  if (body) out.push(cap(body));
  if (clean(w.line)) out.push('It said: “' + walkStop(w.line) + '”');
  if (w.at) out.push('You found it at ' + PLACE_NAME[w.at] + ', and you rode it out');
  return out;
}

/* ---------- 9. how strong now ---------- */
/** what the walk did, said plainly. Still 6 or more and not down: walk it through again, from the line. */
export function walkAfter(n0: number, n1: number): { down: boolean; again: boolean; line: string } {
  if (n1 < n0) return { down: true, again: false, line: 'From ' + n0 + ' to ' + n1 + '. That was you.' };
  if (n1 === 0) return { down: false, again: false, line: 'Still 0. A calm moment is the best time to plan.' };
  const lead = (n1 > n0 ? 'Up to ' : 'Still ') + n1;
  if (n1 >= 6) return { down: false, again: true, line: lead + '. That is all right: loud is not a decision. Walk it again, slower.' };
  return { down: false, again: false, line: lead + ', and quiet enough to live with. It cannot stay at the top.' };
}

/* ---------- 10. it may come back: the plan ---------- */
/** the plan in one line, from the need: "This evening, when I want relief, I will ..." (talk.ts) */
export const walkPlanLine = (t: Pick<Talk, 'n' | 'm' | 'mo' | 'mx' | 'nx'>) => talkPlanLine(t);

/* ---------- the record (the walk's own part, WalkRec and normWalk, is in talk.ts) ---------- */
/** a finished walk as a talk-through: a change plan for when it may come back, with the walk's own part */
export function walkTalk(
  base: Talk,
  w: {
    n0: number | null;
    n1: number | null;
    holds: string[];
    /** what holds it down in their own words: their reasons picked, and anything typed */
    holdOwn: string | string[];
    where: string | null;
    feel: string | null;
    line: WalkLine | null;
    lineOwn: string;
    answer: string;
    explain: string;
    need: WalkNeed | null;
    at: TrailPlace | null;
    moves: TalkMove[];
    moveOwn: string;
    mo: string | null;
    moAt: number | null;
  },
): Talk {
  const need = walkNeed(w.need);
  const line = walkLine(w.line);
  const why = w.holds.map((h) => WALK_HOLDS.find((x) => x[0] === h)?.[1]).filter(Boolean) as string[];
  for (const o of (Array.isArray(w.holdOwn) ? w.holdOwn : [w.holdOwn]).map(clean).filter(Boolean)) why.push(o.slice(0, 80));
  const t: Talk = {
    ...base,
    s: line ? [line.sign] : [],
    n: need?.need ?? null,
    w: null,
    why,
    p: 'change',
    m: w.moves,
    mo: w.mo,
    at: w.moAt,
    b: w.where ? [w.where] : [],
    f: w.feel ? [w.feel] : [],
    e: null,
    a: null,
  };
  if (clean(w.moveOwn)) t.mx = [clean(w.moveOwn).slice(0, 60)];
  const wk: WalkRec = { u0: w.n0, u1: w.n1, ln: w.line, nd: w.need, pl: w.at };
  if (!w.line && clean(w.lineOwn)) wk.lx = clean(w.lineOwn).slice(0, 80);
  if (clean(w.answer)) wk.ax = clean(w.answer).slice(0, 160);
  if (clean(w.explain)) wk.ex = clean(w.explain).slice(0, 240);
  t.wk = wk;
  return t;
}

/* ---------- small helpers ---------- */
function clean(x: unknown): string {
  return String(x ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
function list(w: string[]): string {
  return w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : w[0] || '';
}
