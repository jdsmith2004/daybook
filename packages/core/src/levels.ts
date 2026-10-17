/* The level ladder: 60 levels, in 12 forms of the flame with 5 steps each. Points are the source of truth; a level is worked
   out from them. The first ten forms start at the same points they always did, so moving to this ladder never shows anyone an
   earlier form or a lower level number; it only adds steps inside each form, and two new forms at the top (Constellation and
   North Star) for the long road. A steady day earns about 45 points: the first forms come in days, the top in about a year.

   The ladder before this one had 30 levels (3 steps per form, points from 5 × i × (i + 3)). A level saved on it is moved over
   by moveSeenLevel. This file imports nothing from legacy/core.js, because legacy/core.js imports it. Checked by
   test/levels.test.ts. */

export interface Stage {
  name: string;
  meaning: string;
  steps: string[];
}
export interface Level {
  n: number;
  name: string;
  /** the points where this level starts */
  floor: number;
  /** the form, from 0 */
  stage: number;
  /** the step inside the form, from 0 */
  tier: number;
  step: string;
  meaning: string;
  next: number | null;
  nextName: string | null;
  /** the next level is a new form */
  evolves: boolean;
  frac: number;
  toNext: number;
}

/** steps in each form */
export const STEPS = 5;
/** which ladder a saved level counts on: 3 was the 30-level ladder, 4 is this one */
export const LADDER_V = 4;

export const STAGES: Stage[] = [
  {
    name: 'Spark',
    meaning: 'You showed up. Every fire starts with something this small.',
    steps: [
      'A tiny spark appears.',
      'It glows a little warmer.',
      'The spark starts to twinkle.',
      'A second spark joins it.',
      'A little trail of light follows it.',
    ],
  },
  {
    name: 'Kindling',
    meaning: 'Small, ordinary things that catch. This is how it gets built.',
    steps: [
      'A few twigs and a first flicker.',
      'The twigs catch, one by one.',
      'More twigs, and the flicker steadies.',
      'The glow turns orange and warm.',
      'A small flame stands up on its own.',
    ],
  },
  {
    name: 'Campfire',
    meaning: 'Steady warmth you can sit beside.',
    steps: [
      'Logs and a steady flame.',
      'The flame crackles and leans into the wind.',
      'Stones around it, and the flame grows taller.',
      'A warm ring of light spreads across the ground.',
      'Sparks fly, and small flames join in.',
    ],
  },
  {
    name: 'Torch',
    meaning: 'Light you can carry with you into the hard hours.',
    steps: [
      'You pick up a torch.',
      'Its handle sits steady in your hand.',
      'The flame grows and lights your way.',
      'The path ahead lights up.',
      'Embers drift up around it.',
    ],
  },
  {
    name: 'Beacon',
    meaning: 'A light on a tower, so other people can find you too.',
    steps: [
      'A beacon on a stone tower.',
      'The tower grows taller.',
      'Light now reaches in every direction.',
      'Its glow reaches the clouds.',
      'Faraway beacons light up to answer.',
    ],
  },
  {
    name: 'Lighthouse',
    meaning: 'A steady light that keeps its place when the water is rough.',
    steps: [
      'A small lighthouse on the rocks.',
      'Its lamp turns for the first time.',
      'A taller tower, with longer beams.',
      'Waves break below, and the light holds.',
      'The beams sweep across the whole sea.',
    ],
  },
  {
    name: 'Sunrise',
    meaning: 'The first light of a new day.',
    steps: [
      'The sun peeks over the hills.',
      'The sky blushes pink.',
      'Half the sun is up, with its first rays.',
      'The first light touches the hills.',
      'The sun climbs, and the clouds catch the pink light.',
    ],
  },
  {
    name: 'Daybreak',
    meaning: 'Morning is here, and it keeps getting brighter.',
    steps: ['The sun clears the hills.', 'The last stars fade.', 'Clouds drift in and the sky brightens.', 'The fields turn gold.', 'Birds join the morning.'],
  },
  {
    name: 'Bright Day',
    meaning: 'Clear sky and room to breathe.',
    steps: [
      'Blue sky and a bright sun.',
      'A soft breeze moves the grass.',
      'Green hills, and flowers start to bloom.',
      'A light rain, and the sun stays out.',
      'A rainbow after the rain.',
    ],
  },
  {
    name: 'Full Sun',
    meaning: 'Warm, steady, and yours.',
    steps: [
      'The sun steps out of its frame.',
      'Its rays stretch wide.',
      'A ring of tiny lights circles it.',
      'The ring turns slowly, like a crown.',
      'A glowing halo and sparkles.',
    ],
  },
  {
    name: 'Constellation',
    meaning: 'Many small lights making one shape. Every good day is one of them.',
    steps: [
      'Night falls, and the first stars come out.',
      'Lines of light join the stars.',
      'A shape appears in the sky.',
      'More stars join the shape.',
      'The whole sky glows with your constellation.',
    ],
  },
  {
    name: 'North Star',
    meaning: 'A light that stays put, so you, and others, can find the way.',
    steps: [
      'One star shines brighter than the rest.',
      'Its light points the way.',
      'The sky turns slowly around it.',
      'A soft glow rings it.',
      'The North Star, steady and yours. This is as bright as it gets.',
    ],
  },
];

/** the points where each form starts (the first ten are where they always were), and one past the end for the last steps */
export const FORM_PTS = [0, 90, 270, 540, 900, 1350, 1890, 2520, 3240, 4050, 6000, 10000, 17500];

const round5 = (v: number) => Math.round(v / 5) * 5;
/** [points where it starts, form name, form, step] for each level */
export const LEVELS: [number, string, number, number][] = STAGES.flatMap((sg, f) =>
  Array.from(
    { length: STEPS },
    (_, k) => [round5(FORM_PTS[f] + ((FORM_PTS[f + 1] - FORM_PTS[f]) * k) / STEPS), sg.name, f, k] as [number, string, number, number],
  ),
);

export function levelOf(pts: number): Level {
  let n = 0;
  for (let i = 0; i < LEVELS.length; i++) if (pts >= LEVELS[i][0]) n = i;
  const cur = LEVELS[n];
  const nxt = LEVELS[n + 1] || null;
  const sg = STAGES[cur[2]];
  return {
    n: n + 1,
    name: cur[1],
    floor: cur[0],
    stage: cur[2],
    tier: cur[3],
    step: sg.steps[cur[3]],
    meaning: sg.meaning,
    next: nxt ? nxt[0] : null,
    nextName: nxt ? nxt[1] : null,
    evolves: !!(nxt && nxt[2] !== cur[2]),
    frac: nxt ? Math.max(0, Math.min(1, (pts - cur[0]) / (nxt[0] - cur[0]))) : 1,
    toNext: nxt ? Math.max(0, nxt[0] - pts) : 0,
  };
}

/** the form a level belongs to */
export const formOfLevel = (n: number) => LEVELS[Math.max(1, Math.min(LEVELS.length, Math.round(n) || 1)) - 1][2];

/* said in plain words: "23 more points to reach level 8", or "50 more points and your flame turns into a Campfire" */
export const FORM_NOART: Record<string, 1> = { Kindling: 1, Daybreak: 1, 'Bright Day': 1, 'Full Sun': 1 };
const FORM_THE: Record<string, 1> = { 'North Star': 1 };
export const formWord = (n: string) => (FORM_THE[n] ? 'the ' : FORM_NOART[n] ? '' : 'a ') + n;
export function nextLine(l: Level): string {
  if (l.next == null) return 'Your flame is as bright as it gets.';
  const n = l.toNext;
  return (
    n + ' more point' + (n === 1 ? '' : 's') + (l.evolves ? ' and your flame turns into ' + formWord(l.nextName!) + '.' : ' to reach level ' + (l.n + 1) + '.')
  );
}

/* ---------- the ladder before this one ---------- */
/** where each level of the 30-level ladder started */
export const OLD_LEVEL_PTS = Array.from({ length: 30 }, (_, i) => 5 * i * (i + 3));

/** a level saved on an older ladder (lad below LADDER_V), moved to this one: the first level here that starts at or above the
    old level's points, so the points shown never drop and the form never goes back */
export function moveSeenLevel(level: number, lad: number): number {
  if (lad >= LADDER_V) return Math.max(1, Math.min(LEVELS.length, Math.round(level) || 1));
  const old = OLD_LEVEL_PTS[Math.max(1, Math.min(30, Math.round(level) || 1)) - 1];
  const i = LEVELS.findIndex((l) => l[0] >= old);
  return i < 0 ? LEVELS.length : i + 1;
}
