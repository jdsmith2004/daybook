/* Name the feeling: a 10 by 10 grid of feelings, arranged the way the Mood Meter arranges them (energy down the rows,
   pleasantness across the columns), with Daybook's own words. Naming a feeling takes some of its charge away ("name it
   to tame it"), and the feeling named points at the tool that fits it. The words and lines are Daybook's; the grid idea
   is the Mood Meter's (Yale RULER), reached through the How We Feel app. */
import { changeDay } from './mutate';
import type { Day, DayKey } from './types';

export interface Feeling {
  /** the word */
  w: string;
  /** one line on what it feels like, shown under the word */
  how: string;
}

/** 10 rows by 10 columns. Row 0 is the highest energy, row 9 the lowest. Column 0 is the most unpleasant, column 9 the most pleasant. */
export const FEELINGS: Feeling[][] = [
  [
    { w: 'Enraged', how: 'Anger so strong it takes over the body' },
    { w: 'Furious', how: 'Hot, hard anger pushing to get out' },
    { w: 'Panicked', how: 'Fear so sudden the mind races blindly' },
    { w: 'Terrified', how: 'Deep fear, with a pounding heart' },
    { w: 'Frantic', how: 'Rushing and scrambling, unable to slow down' },
    { w: 'Pumped', how: 'Charged up and ready to go' },
    { w: 'Thrilled', how: 'A jolt of joy that lifts everything' },
    { w: 'Elated', how: 'Floating high on good news' },
    { w: 'Overjoyed', how: 'Joy so full it spills over' },
    { w: 'Ecstatic', how: 'Pure delight, bursting from head to toe' },
  ],
  [
    { w: 'Outraged', how: 'Anger at something that feels deeply unfair' },
    { w: 'Fuming', how: 'Anger simmering and hard to put down' },
    { w: 'Overwhelmed', how: 'Too much at once, with nowhere to start' },
    { w: 'Frightened', how: 'Sensing danger and wanting to get away' },
    { w: 'Jittery', how: 'Shaky energy that cannot settle' },
    { w: 'Excited', how: 'Looking ahead to something with a buzz' },
    { w: 'Lively', how: 'Bright, quick and full of spark' },
    { w: 'Joyful', how: 'Gladness that shows in the face and voice' },
    { w: 'Delighted', how: 'Surprised and warmed by something good' },
    { w: 'Triumphant', how: 'The glow of coming through something hard' },
  ],
  [
    { w: 'Angry', how: 'Heat and tension aimed at something' },
    { w: 'Resentful', how: 'Holding on to anger about an old hurt' },
    { w: 'Stressed', how: 'Pressure building faster than it can ease' },
    { w: 'Anxious', how: 'A worried mind running ahead to what might go wrong' },
    { w: 'Nervous', how: 'Butterflies and a tight stomach about what is next' },
    { w: 'Motivated', how: 'A clear push to start and keep going' },
    { w: 'Cheerful', how: 'A bright mood and easy smiles' },
    { w: 'Happy', how: 'Everything feels good and light' },
    { w: 'Proud', how: 'Warm respect for something done or become' },
    { w: 'Inspired', how: 'Seeing what is possible and reaching for it' },
  ],
  [
    { w: 'Frustrated', how: 'Blocked from something wanted, and worn thin by it' },
    { w: 'Fed up', how: 'Patience used up, ready to be done' },
    { w: 'Tense', how: 'Muscles held tight, braced for something' },
    { w: 'Worried', how: 'Thoughts circling around a possible problem' },
    { w: 'Restless', how: 'An itch to move or change something, unsure what' },
    { w: 'Hopeful', how: 'Sensing that better days are on the way' },
    { w: 'Optimistic', how: 'Expecting that things can work out well' },
    { w: 'Confident', how: 'Trusting in the ability to handle what comes' },
    { w: 'Capable', how: 'Ready and able to take on the task ahead' },
    { w: 'Strong', how: 'Steady power in body and mind' },
  ],
  [
    { w: 'Irritated', how: 'Small things grate the wrong way' },
    { w: 'Annoyed', how: 'Mildly bothered by something that keeps nagging' },
    { w: 'Edgy', how: 'On guard, with a short fuse' },
    { w: 'Unsettled', how: 'Something feels off and is hard to name' },
    { w: 'Uneasy', how: 'A quiet sense that all is not quite right' },
    { w: 'Pleased', how: 'Quiet satisfaction with how things are going' },
    { w: 'Glad', how: 'Happy that something went the right way' },
    { w: 'Amused', how: 'Lightness from something funny or odd' },
    { w: 'Fortunate', how: 'Aware of having been handed some good luck' },
    { w: 'Loved', how: 'Cared for and held dear by others' },
  ],
  [
    { w: 'Humiliated', how: 'Feeling small after being exposed' },
    { w: 'Ashamed', how: 'Wanting to hide from what happened' },
    { w: 'Guilty', how: 'A heavy weight about something done or left undone' },
    { w: 'Embarrassed', how: 'Hot cheeks and a wish to be unseen' },
    { w: 'Meh', how: 'Flat, with no strong pull either way' },
    { w: 'OK', how: 'Fine and steady, neither up nor down' },
    { w: 'Steady', how: 'Even and balanced, with solid ground underfoot' },
    { w: 'Relieved', how: 'A weight lifted and a long breath out' },
    { w: 'Grateful', how: 'Warm appreciation for what is good' },
    { w: 'Fulfilled', how: 'A deep sense that life has meaning' },
  ],
  [
    { w: 'Heartbroken', how: 'An ache in the chest over a loss' },
    { w: 'Hurt', how: 'Tender and sore from what was said or done' },
    { w: 'Lonely', how: 'Wanting closeness and not finding it' },
    { w: 'Disappointed', how: 'Hoping for more than what came' },
    { w: 'Bored', how: 'Nothing holds interest and time drags' },
    { w: 'Comfortable', how: 'At ease in the moment, with nothing pressing' },
    { w: 'Easygoing', how: 'Taking things as they come' },
    { w: 'Secure', how: 'Safe and grounded, with nothing to defend' },
    { w: 'Content', how: 'Satisfied with enough, wanting nothing more' },
    { w: 'Blissful', how: 'Deep, glowing happiness that fills everything' },
  ],
  [
    { w: 'Miserable', how: 'Everything feels heavy and joyless' },
    { w: 'Sad', how: 'A low mood with tears close by' },
    { w: 'Discouraged', how: 'Losing faith that the effort will pay off' },
    { w: 'Gloomy', how: 'A gray mood hanging over everything' },
    { w: 'Tired', how: 'Body and mind asking for rest' },
    { w: 'Mellow', how: 'Soft, unhurried and easy about everything' },
    { w: 'Relaxed', how: 'Shoulders low and breath slow' },
    { w: 'Calm', how: 'A quiet inside, like still water' },
    { w: 'Peaceful', how: 'Free of conflict, inside and out' },
    { w: 'Whole', how: 'Nothing missing and nothing to fix' },
  ],
  [
    { w: 'Crushed', how: 'Hopes flattened by a heavy blow' },
    { w: 'Defeated', how: 'Feeling beaten, with little left to try' },
    { w: 'Helpless', how: 'Seeing no way to change what is happening' },
    { w: 'Numb', how: 'Feelings muted, as if behind glass' },
    { w: 'Drained', how: 'Energy poured out with little left over' },
    { w: 'Cozy', how: 'Warm, sheltered and snug' },
    { w: 'Soothed', how: 'Tension melting away bit by bit' },
    { w: 'Rested', how: 'Body refreshed after real stillness' },
    { w: 'Tranquil', how: 'Smooth and quiet, like a windless lake' },
    { w: 'At peace', how: 'Settled with things as they are' },
  ],
  [
    { w: 'Despairing', how: 'Seeing no way forward and no light' },
    { w: 'Hopeless', how: 'Feeling that nothing will get better' },
    { w: 'Empty', how: 'A hollow space where feeling should be' },
    { w: 'Exhausted', how: 'Nothing left in body or mind' },
    { w: 'Worn out', how: 'Used up from carrying too much for too long' },
    { w: 'Sleepy', how: 'Heavy eyelids and a pull toward rest' },
    { w: 'Dreamy', how: 'Drifting, with a soft and wandering mind' },
    { w: 'Restful', how: 'Slow and quiet, with nothing asked' },
    { w: 'Still', how: 'Quiet in body and thoughts' },
    { w: 'Serene', how: 'Deep calm that nothing can ruffle' },
  ],
];

export const FEEL_ROWS = 10;
export const FEEL_COLS = 10;

/** the four corners of the first screen: which part of the grid, its name, and the cell the grid opens centered on */
export const FEEL_QUADS: { id: string; name: string; r: number; c: number }[] = [
  { id: 'red', name: 'High energy, unpleasant', r: 2, c: 2 },
  { id: 'yellow', name: 'High energy, pleasant', r: 2, c: 7 },
  { id: 'blue', name: 'Low energy, unpleasant', r: 7, c: 2 },
  { id: 'green', name: 'Low energy, pleasant', r: 7, c: 7 },
];

export const feelAt = (r: number, c: number): Feeling | null => (FEELINGS[r] && FEELINGS[r][c]) || null;

/* which tool fits a feeling, by the family it belongs to (the word wins over the quadrant) */
const LEAD_WORD: Record<string, string> = {
  /* wanting closeness: a person helps more than a technique */
  Heartbroken: 'message',
  Hurt: 'message',
  Lonely: 'message',
  /* the shame family: shame talks in thoughts, and a thought is not an order */
  Humiliated: 'thought',
  Ashamed: 'thought',
  Guilty: 'thought',
  Embarrassed: 'thought',
  /* charge with no aim: move the body first */
  Restless: 'move',
  Jittery: 'move',
  Edgy: 'move',
  /* nothing holds: a real change of scene */
  Bored: 'surprise',
  Meh: 'surprise',
};
/** the tired family leads to bed at night, and to "What do I need?" by day */
const LEAD_TIRED = ['Tired', 'Drained', 'Exhausted', 'Worn out', 'Sleepy'];

/** the tool a named feeling leads on to, with one line on why, or null when the feeling needs no fixing */
export function feelLead(r: number, c: number, night: boolean): { tool: string; why: string } | null {
  const f = feelAt(r, c);
  if (!f) return null;
  if (LEAD_TIRED.indexOf(f.w) >= 0)
    return night
      ? { tool: 'bed', why: 'A tired brain loses fights a rested one wins. Sleep is the move.' }
      : { tool: 'halt', why: 'Tired is a need, not a flaw. See what would actually help.' };
  const led = LEAD_WORD[f.w];
  if (led === 'message') return { tool: led, why: 'This one shrinks when a person knows. One text is enough.' };
  if (led === 'thought') return { tool: led, why: 'This feeling talks in thoughts. Catch one and name it too.' };
  if (led === 'move') return { tool: led, why: 'That charge wants out through the body. Two minutes is plenty.' };
  if (led === 'surprise') return { tool: led, why: 'The cure is a real change, not a better screen.' };
  if (c >= 5) return null;
  /* the rest of the unpleasant half: anger burns off through the body, fear and stress slow down with the breath,
     and the low, heavy feelings point at an unmet need */
  if (r >= 5) return { tool: 'halt', why: 'Heavy feelings often sit on a plain unmet need. Find it.' };
  if (c <= 1) return { tool: 'move', why: 'Anger is charge in the body. Burn some off, then decide.' };
  return { tool: 'breathe', why: 'The body is sounding an alarm. A long breath out turns it down.' };
}

/** cap on feelings kept per day: plenty for honest use, never unbounded */
export const FEEL_DAY_MAX = 50;

/** write a named feeling on the day: the word and when, kept on the device like the rest of the log */
export function feelLog(prev: Day | undefined | null, tk: DayKey, w: string, at: number): Day | null {
  return changeDay(
    prev,
    tk,
    (d) => {
      const fe = d.p && d.p.fe ? d.p.fe : [];
      if (fe.length >= FEEL_DAY_MAX) return;
      d.p = { ...(d.p || blankPlay()), fe: fe.concat([[w, at] as [string, number]]) };
    },
    at,
  );
}

/* a blank Play, matching legacy blankP (not imported: this module stays clear of core.js) */
const blankPlay = () => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} });
