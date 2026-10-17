/* Rekindle's "What just happened": right after a slip, a few short cards on what the brain and the mood are doing, each
   with a moving picture and its source. They fit how the person feels right now (asked first, never stored), and they
   always end with kindness, because being kind after a slip is what makes the next try stronger. Cards read before
   come back as one line each.

   Then the comebacks: the person's own record of days between slips, so a slip is seen as a dip in a climb, never
   the end of it. */
import { addDays, sumDay } from './legacy/core.js';
import { TALK_SRC } from './talk';
import type { DayKey, Days, Settings } from './types';

/* ---------- the research ---------- */
/** the sources the cards cite: [what it is, a link]. Shared ones come from Talk it through. */
export const RK_SRC: Record<string, [string, string]> = {
  larimer: TALK_SRC.larimer,
  tracy: TALK_SRC.tracy,
  banca: [
    'Banca et al. (2016): novelty, conditioning and attentional bias to sexual rewards, Journal of Psychiatric Research',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4683093/',
  ],
  bowen: [
    'Bowen & Marlatt (2009): surfing the urge, a brief mindfulness-based intervention for smokers, Psychology of Addictive Behaviors',
    'https://doi.org/10.1037/a0017127',
  ],
  gilbert: [
    'Gilbert et al. (1998): immune neglect, a source of durability bias in affective forecasting, Journal of Personality and Social Psychology',
    'https://doi.org/10.1037/0022-3514.75.3.617',
  ],
  lieberman: [
    'Lieberman et al. (2007): putting feelings into words, affect labeling disrupts amygdala activity, Psychological Science',
    'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
  ],
  tangney: [
    'Tangney, Stuewig & Mashek (2007): moral emotions and moral behavior, Annual Review of Psychology',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC3083636/',
  ],
  prochaska: [
    'Prochaska, DiClemente & Norcross (1992): in search of how people change, applications to addictive behaviors, American Psychologist',
    'https://doi.org/10.1037/0003-066X.47.9.1102',
  ],
  breines: [
    'Breines & Chen (2012): self-compassion increases self-improvement motivation, Personality and Social Psychology Bulletin',
    'https://doi.org/10.1177/0146167212445599',
  ],
};

/* ---------- how it feels right now ---------- */
export type RkFeel = 'shame' | 'giveup' | 'angry' | 'flat' | 'pull' | 'okay';
/** "Right now, how do you feel?": [id, the words, a short line, an icon, a tone] */
export const RK_FEELS: [RkFeel, string, string, string, string][] = [
  ['shame', 'Ashamed', 'Like something is wrong with me', 'heart', 'coral'],
  ['giveup', 'Like giving up', 'Why bother now', 'leaf', 'slip'],
  ['angry', 'Angry at myself', 'I should have known better', 'bolt', 'sun'],
  ['flat', 'Flat or empty', 'Tired, heavy, low', 'moon', 'violet'],
  ['pull', 'Still pulled toward it', 'The urge is not done', 'wave', 'sky'],
  ['okay', 'Honestly, okay', 'Calm enough to look at it', 'check', 'mint'],
];

/* ---------- what just happened ---------- */
export type RkArt = 'rush' | 'wave' | 'crash' | 'name' | 'shame' | 'trap' | 'cycle' | 'kind';
export interface RkLearnCard {
  k: RkArt;
  /** shown when one of these was picked (empty: always, as the last card) */
  for: RkFeel[];
  title: string;
  body: string;
  /** one line, for someone who has read the card before */
  short: string;
  src: string[];
}
export const RK_LEARN: RkLearnCard[] = [
  {
    k: 'rush',
    for: ['pull', 'okay'],
    title: 'Your brain hit the gas.',
    body: 'Porn sets off the brain’s reward system fast and hard, and new images hit hardest. In one study, men with compulsive sexual habits were pulled more strongly toward new sexual images, and their brains tired of the same images faster. That is why the pull felt so urgent, and why it was over so quickly. A strong habit does not make you a weak person. Habits can be retrained.',
    short: 'The pull was the reward system on full. A strong habit is not a weak person.',
    src: ['banca'],
  },
  {
    k: 'wave',
    for: ['pull'],
    title: 'If the pull is still here, it is a wave.',
    body: 'Urges rise, peak and fall, even when you do nothing about them. In a study of smokers, people taught to watch their urges like waves, without acting on them, smoked less over the next week, even though the urges themselves were just as strong. You do not have to make it stop. Watch it, and let it pass. SOS is one tap.',
    short: 'An urge is a wave. Watch it rise and fall, and let it pass.',
    src: ['bowen'],
  },
  {
    k: 'crash',
    for: ['flat'],
    title: 'The low will not last as long as it says.',
    body: 'Right after a slip, the flat, heavy feeling can seem like the truth about you. It is a mood. Studies of feelings find that people reliably expect a hard blow to hurt for longer than it really does, because the mind is better at recovering than we give it credit for. Sleep and a little time help more than you would guess.',
    short: 'The low passes faster than it promises.',
    src: ['gilbert'],
  },
  {
    k: 'name',
    for: ['flat', 'angry', 'shame'],
    title: 'Name it, and it loosens.',
    body: 'Putting a feeling into plain words calms the brain’s alarm. In a brain-scan study, naming a feeling turned down the amygdala, the part that sounds the alarm. So say it: “I feel ashamed.” “I feel flat.” You do not have to fix it tonight. Naming it is enough.',
    short: 'Saying the feeling in words turns the alarm down.',
    src: ['lieberman'],
  },
  {
    k: 'shame',
    for: ['shame', 'angry'],
    title: 'You did something. You are not something.',
    body: 'Guilt says “I did a bad thing.” Shame says “I am bad.” Research finds that guilt tends to lead people to make things right, while shame leads to hiding. In a study of people in recovery, those who showed more shame were more likely to relapse. So keep it about the action. The action was one evening. You are the whole climb.',
    short: 'Keep it about the action, not about who you are.',
    src: ['tangney', 'tracy'],
  },
  {
    k: 'trap',
    for: ['giveup', 'angry', 'okay'],
    title: 'Watch for “I already blew it.”',
    body: 'That thought is the real danger. Researchers call it the abstinence violation effect: one slip turns into “might as well keep going.” Now you know its name, and naming it takes away its power. One slip is just one slip.',
    short: '“I already blew it” is the real danger. One slip is just one slip.',
    src: ['larimer'],
  },
  {
    k: 'cycle',
    for: ['giveup'],
    title: 'Lasting change usually has slips in it.',
    body: 'Researchers who study how people change habits found that slipping back is the rule, not the exception. Most people who change for good go around more than once, and they learn something each time. A slip does not send you back to the start. It is part of the path most people take to the top.',
    short: 'Most lasting change has slips in it. You are on the path, not off it.',
    src: ['prochaska'],
  },
  {
    k: 'kind',
    for: [],
    title: 'Kindness makes you try harder, not less.',
    body: 'It can feel like being hard on yourself keeps you in line. Studies find the opposite. After a failure, people who met it with kindness were more motivated to improve, and they worked longer to do better next time. Tonight, talk to yourself the way you would talk to a good friend.',
    short: 'Being kind to yourself makes the next try stronger.',
    src: ['breines'],
  },
];

/** the cards for how it feels (at most max, taking turns between the feelings picked so each one is answered), in
    order, ending with kindness. With nothing picked: the rush, the trap, then kindness. Late at night, short is kind. */
export function rkLearn(feels: RkFeel[], max = 3): RkLearnCard[] {
  const f = RK_FEELS.map((x) => x[0]).filter((x) => (feels.length ? feels : ['okay']).indexOf(x) >= 0);
  const pick = new Set<RkArt>();
  for (let more = true; more && pick.size < max; ) {
    more = false;
    for (const x of f) {
      const c = RK_LEARN.find((y) => y.for.indexOf(x) >= 0 && !pick.has(y.k));
      if (c && pick.size < max) {
        pick.add(c.k);
        more = true;
      }
    }
  }
  return RK_LEARN.filter((c) => pick.has(c.k) || !c.for.length);
}

/* ---------- your comebacks ---------- */
export interface RkComebacks {
  /** clean days before each slip day, oldest first (the last one ends with this slip), up to 8 */
  runs: number[];
  /** slip days before this one: each one was followed by coming back */
  before: number;
  longest: number;
  /** the recent stretches are longer than the early ones */
  apart: boolean;
}
/** the person's own record, up to the slip on day k: how many clean days came before each slip day */
export function rkComebacks(days: Days, st: Settings, k: DayKey): RkComebacks {
  const from = st.day1 && st.day1 < st.start ? st.day1 : st.start;
  const runs: number[] = [];
  let run = 0;
  for (let d = from; d && d <= k; d = addDays(d, 1)) {
    if (sumDay(days[d]).slipped > 0) {
      runs.push(run);
      run = 0;
    } else run++;
  }
  const all = runs.length ? runs : [run];
  const half = Math.floor(all.length / 2);
  const avg = (l: number[]) => l.reduce((a, b) => a + b, 0) / (l.length || 1);
  return {
    runs: all.slice(-8),
    before: Math.max(0, runs.length - 1),
    longest: Math.max(0, ...all),
    apart: all.length >= 4 && avg(all.slice(half)) > avg(all.slice(0, half)) + 0.5,
  };
}
/** what the record says, in one line */
export function rkComebackLine(cb: RkComebacks): string {
  if (!cb.before) return 'This is your first comeback. Every long run in Daybook started with one.';
  const times = cb.before === 1 ? 'once' : cb.before === 2 ? 'twice' : cb.before + ' times';
  if (cb.apart) return 'You have come back ' + times + ' before, and your slips are getting further apart. That is the climb.';
  return (
    'You have come back ' +
    times +
    ' before, and ' +
    (cb.before === 1 ? 'more clean days followed' : 'each time, more clean days followed') +
    '. This is the same move.'
  );
}
