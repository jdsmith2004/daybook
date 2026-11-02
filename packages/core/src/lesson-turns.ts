/* Lessons that turn something over (the owner, November 2, 2026: "come at it in a way that opens my mind and changes my perception").
   Each lesson carries one turn: what the person already believes, then a sharper way to see it, made concrete with a picture, then
   what it changes tonight. A lesson here replaces the one with the same id in LESSONS (legacy/core.js), in place: its id, section and
   place on the path stay, so nothing done or earned moves.

   The shape, in order (q: in Quick too):
     hook   (q)  a moment the person knows, and what the flame asks
     ask         a question only they can answer; open unless it names a best answer
     flip   (q)  the turn: "You may think" on the front, "Look again" on the back, turned over with a tap
     deep        one or more cards behind the turn: a fact, a picture, a number, or a line back to an earlier lesson (back)
     mine   (q)  a true line from their own log (lessonMine), or what to watch for when there is none
     move   (q)  what to do, up to three short lines
     check  (q)  a real moment, with a best answer where there is one
   Short words only: what a card says is what the person reads, with the longer words one tap away as More. New lessons are added the
   same way, with a new id. */
import type { Art, Block, Card, Lesson } from './lessons';
import type { Beat, LessonBeats } from './lesson-beats';

/** a source: [name: topic, url] */
type Src = [string, string, string?, string?];
/** an answer and what the flame says to it */
type Opt = [string, string];
export type MineKind = 'acted' | 'rode' | 'back';

export interface TurnCard {
  h: string;
  p?: string;
  /** the longer words, shown under More */
  more?: string;
  art?: Art;
  /** a giant number that starts the sentence h finishes */
  n?: string;
  fact?: { s: string; i?: number[] };
  /** an earlier lesson this card builds on, named above it */
  back?: string;
}
export interface Turn {
  id: string;
  title: string;
  /** the line under the title in lists; the old one stays when this is left out (the golden records hold it) */
  tag?: string;
  ic: string;
  ask: string;
  key: string;
  np: string;
  mins?: number;
  hook: { h: string; say: string; more?: string; art?: Art };
  ask1?: { h: string; o: Opt[]; a?: number };
  flip: { think: string; see: string; more?: string };
  deep: TurnCard[];
  mine?: { h: string; k: MineKind };
  move: { h: string; l: string[]; more?: string };
  check: { h: string; o: Opt[]; a?: number };
  scope: string;
  src: Src[];
}

const more = (s?: string): Block[] | undefined => (s ? [['p', s]] : undefined);

/** a turn as a lesson's cards, and the short words each card shows */
export function turnLesson(T: Turn, was: Lesson): { L: Lesson; beats: LessonBeats } {
  const cards: Card[] = [];
  const beats: Beat[] = [];
  const add = (c: Card, b: Beat) => (cards.push(c), beats.push(b));
  add(
    { k: 'text', q: 1, e: 'hook', el: 'Sound familiar?', art: T.hook.art || ['icon', { ic: T.ic }], h: T.hook.h, b: more(T.hook.more) },
    { h: T.hook.h, say: T.hook.say },
  );
  if (T.ask1) add({ k: 'choose', e: 'predict', el: 'A question', h: T.ask1.h, a: T.ask1.a, c: T.ask1.o }, { h: T.ask1.h, c: T.ask1.o.map((x) => x[1]) });
  add({ k: 'flip', q: 1, e: 'answer', el: 'Look again', h: T.flip.think, see: T.flip.see, b: more(T.flip.more) }, { h: T.flip.think, p: T.flip.see });
  T.deep.forEach((d) =>
    add(
      { k: 'text', e: 'proof', el: 'Behind it', art: d.n ? ['big', { n: d.n }] : d.art, h: d.h, b: more(d.more), fact: d.fact, back: d.back },
      d.n ? { h: d.h, p: d.p, n: d.n } : { h: d.h, p: d.p },
    ),
  );
  if (T.mine) add({ k: 'text', q: 1, e: 'mine', el: 'Your own log', h: T.mine.h, b: [['mine', T.mine.k]] }, { h: T.mine.h });
  add({ k: 'text', q: 1, e: 'move', el: 'What to do', art: ['icon', { ic: T.ic }], h: T.move.h, b: more(T.move.more) }, { h: T.move.h, l: T.move.l });
  add({ k: 'choose', q: 1, e: 'check', el: 'Check it', h: T.check.h, a: T.check.a, c: T.check.o }, { h: T.check.h, c: T.check.o.map((x) => x[1]) });
  const L: Lesson = {
    ...was,
    v: 3,
    title: T.title,
    tag: T.tag || was.tag,
    ic: T.ic,
    mins: T.mins || 4,
    ask: T.ask,
    key: T.key,
    np: T.np,
    cards,
    rc: undefined,
    scope: T.scope,
    src: T.src,
    chk: 'November 2, 2026',
  };
  return { L, beats: { cards: beats, key: T.key } };
}

/* the sources the turns add */
const S = {
  tip35: ['SAMHSA: TIP 35, chapter 5, “From Contemplation to Preparation”', 'https://www.ncbi.nlm.nih.gov/books/NBK571064/'],
  bem: [
    'Bem (1972): self-perception theory, how people come to know their own attitudes by watching what they do (overview)',
    'https://en.wikipedia.org/wiki/Self-perception_theory',
  ],
  berridge: [
    'Berridge & Robinson (2016): liking, wanting, and the incentive-sensitization theory of addiction, American Psychologist',
    'https://doi.org/10.1037/amp0000059',
  ],
  bowen: ['Bowen & Marlatt (2009): “Surfing the urge,” a study with college smokers', 'https://pubmed.ncbi.nlm.nih.gov/20025372/'],
  herman: ['Herman & Mack (1975): restrained and unrestrained eating, Journal of Personality', 'https://doi.org/10.1111/j.1467-6494.1975.tb00727.x'],
  larimer: [
    'Larimer, Palmer & Marlatt (1999): relapse prevention, an overview of Marlatt’s cognitive-behavioral model, Alcohol Research & Health',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427',
  ],
  kirchner: ['Kirchner, Shiffman & Wileyto (2012): relapse dynamics in people quitting smoking', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3296289'],
} satisfies Record<string, Src>;

export const TURNS: Record<string, Turn> = {
  l1: {
    id: 'l1',
    title: 'You do not need to feel ready',
    ic: 'flag',
    ask: 'Do I need to feel ready before I start quitting?',
    key: 'Do not wait to feel ready. Take one small step, and the feeling of being ready follows what you do.',
    np: 'One small thing I did before I felt ready',
    hook: {
      h: 'Part of you wants to quit, and part of you does not.',
      say: 'So you are waiting until you feel sure?',
      more: 'Many people wait for the day they feel fully ready. This lesson is about why that day comes later than you think, and how to bring it sooner.',
    },
    ask1: {
      h: 'What would have to happen for you to feel fully ready to quit?',
      o: [
        ['A bad day that scares me into it', 'Fear can start a change. It rarely keeps one going past the first week.'],
        ['A stretch of days where it feels easy', 'That stretch usually comes after you start, not before.'],
        ['Someone I trust pushing me', 'Help matters a lot. The reasons that last still have to be your own.'],
        ['I do not know yet', 'That is honest. Hold on to it for the next card.'],
      ],
    },
    flip: {
      think: 'I have to feel ready before I can start.',
      see: 'It runs the other way. You start small, and feeling ready grows out of what you do.',
      more: 'Waiting to feel ready treats readiness as the cause. Most of the time it is the result. A few small steps change how you see yourself, and that is what people mean when they say they finally felt ready.',
    },
    deep: [
      {
        h: 'You learn who you are by watching what you do.',
        p: 'Each small step is evidence, and your mind updates its story about you to match.',
        art: ['ready', {}],
        fact: { s: 'Theory · Bem, self-perception, 1972', i: [1] },
        more: 'The psychologist Daryl Bem proposed that people often know their own attitudes the way an outsider would: by watching their own behavior. Someone who has waited out three urges starts to think of themselves as someone who can. The step comes first, and the belief follows it.',
      },
      {
        h: 'Treatment guides call mixed feelings a normal stage.',
        p: 'You do not have to finish being unsure. People move through it by taking steps while unsure.',
        fact: { s: 'Treatment guide · US SAMHSA, TIP 35', i: [0] },
        more: 'A US guide written for addiction treatment providers calls mixed feelings “a normal part of any change process.” It describes change as stages, and tells providers to begin with small steps at the person’s own pace.',
      },
    ],
    mine: { h: 'Look at what you have already done.', k: 'acted' },
    move: {
      h: 'Take one step today, before you feel ready.',
      l: ['Write one true reason, in your own words', 'Read one short lesson a day', 'Wait ten minutes at the next urge'],
    },
    check: {
      h: 'Day 3. A voice says, “You are not serious. You still want it.” What do you tell it?',
      o: [
        ['You are right. I should wait until I am sure', 'Waiting for sure can take years. Sureness grows out of the steps you take.'],
        ['Maybe. I will take the step today anyway', 'That is the move. The doubt can stay while the steps pile up.'],
        ['I will argue with it until it goes quiet', 'You do not have to win that argument. Steps answer it better than words.'],
        ['I will make a huge promise to prove it wrong', 'Big promises are hard to keep while part of you is unsure. Small steps add up.'],
      ],
      a: 1,
    },
    scope:
      'Self-perception theory is a well-known idea in psychology about how people come to know their own attitudes. It was not tested on porn, and it is one of several ideas about how beliefs change. The guide is a US government guide for treatment providers, about change in general.',
    src: [S.tip35, S.bem],
  },

  l2: {
    id: 'l2',
    title: 'Urges are waves',
    ic: 'wave',
    ask: 'What do I do when an urge hits?',
    key: 'An urge is a loud promise, not an order. It rises, peaks and passes, and you can outlast it.',
    np: 'Where I feel an urge first, and what I will do while it passes',
    hook: {
      h: 'An urge hits, and it feels like it will only get stronger.',
      say: 'Does a strong urge mean you need it?',
      more: 'Most people think there are two choices when an urge hits: fight it or give in. This lesson is about why the urge is so loud, and a third choice.',
    },
    ask1: {
      h: 'Think of the last time you gave in. Ten minutes later, was it as good as the urge promised?',
      o: [
        ['Not as good as it promised', 'That gap is worth noticing. The next cards explain where it comes from.'],
        ['Good for a moment, then worse', 'Many people say the same. The promise and the result are not the same size.'],
        ['About what I expected', 'Fair. Watch the next one closely and compare.'],
        ['I do not remember feeling much', 'That is common. The urge felt huge, and what came after was small.'],
      ],
    },
    flip: {
      think: 'A strong urge means I really want this.',
      see: 'A strong urge means the habit is well practiced. Your brain learned to want it far more than it enjoys it.',
      more: 'How loud an urge is tells you how often the habit has been repeated, not how much you will enjoy giving in. That is why the urge can be huge and what comes after so small.',
    },
    deep: [
      {
        h: 'Wanting and liking run on two different systems.',
        p: 'Repeat a habit and the wanting grows louder, while the liking stays flat or fades.',
        art: ['want', {}],
        fact: { s: 'Research · Berridge & Robinson, 2016', i: [0] },
        more: 'Brain researchers Kent Berridge and Terry Robinson found that the brain’s “wanting” and its “liking” are separate. In addiction, repetition makes the wanting stronger and stronger, while the pleasure itself does not grow with it. The urge is the wanting talking.',
      },
      {
        h: 'college smokers learned to ride their urges, and smoked less.',
        n: '123',
        p: 'Their urges stayed as strong as before. What they did with them changed.',
        fact: { s: 'Study · 123 college smokers · Bowen & Marlatt, 2009', i: [1] },
        more: 'College students who smoked were taught urge surfing: notice the urge, breathe, and watch it rise and fall without acting. Their urges stayed as strong as everyone else’s, and over the next week they smoked significantly fewer cigarettes.',
      },
    ],
    mine: { h: 'Here is what your own urges have done.', k: 'rode' },
    move: {
      h: 'When one hits, name it, breathe, and wait.',
      l: ['Name it: “This is an urge. It passes.”', 'Breathe slowly, with a long breath out', 'Give it ten minutes, then notice'],
      more: 'Ten minutes is not a magic number. It is short enough to try, and long enough to watch a wave come down.',
    },
    check: {
      h: 'An urge hits hard while you are home alone. What gives you the best chance?',
      o: [
        ['Name it, breathe, and wait ten minutes', 'Yes. You are not fighting it or obeying it. You are outlasting the promise.'],
        ['Swear I will never give in again', 'A vow keeps all your attention on the urge. You only need to get past this one.'],
        ['Give in so it stops bugging me', 'That ends this one and makes the next one louder. Each one outlasted turns it down.'],
        ['Stay busy online until it goes', 'Online keeps the trigger in your hand. Step away from the screen and let it pass.'],
      ],
      a: 0,
    },
    scope:
      'The wanting and liking research comes from brain studies of addiction, mostly with drugs. The urge study followed college students who smoked, not people who use porn. What carries over is the pattern: an urge can stay strong while what you do with it changes.',
    src: [S.berridge, S.bowen],
  },

  l3: {
    id: 'l3',
    title: 'Why one slip snowballs',
    ic: 'bolt',
    ask: 'After a slip, why is it so easy to keep going?',
    key: 'One slip is one. The thought “I already blew it” turns it into many, so score it as one and keep going.',
    np: 'What I will tell myself after a slip',
    hook: {
      h: 'You slipped this morning. By night it was three times.',
      say: 'Why does one turn into many?',
    },
    ask1: {
      h: 'After a slip, what do you usually tell yourself?',
      o: [
        ['I blew it, so tonight is gone', 'That one turns one slip into a whole night. The next card is about this exact thought.'],
        ['I will start fresh on Monday', 'It feels hopeful, and it turns the days before Monday into throwaways.'],
        ['Something harsh about myself', 'It feels like taking it seriously. It also drains the confidence you need tomorrow.'],
        ['Nothing much. I just move on', 'That is a strength. Notice whether the night stays one event.'],
      ],
    },
    flip: {
      think: 'The slip is what wrecked the day.',
      see: 'The slip did not wreck it. The thought “I already blew it” did, and that thought is what turns one into many.',
      more: 'One slip is one event. What makes it spread is how it gets scored: when a day counts as either perfect or ruined, the first slip makes it ruined, and a ruined day has nothing left to protect.',
    },
    deep: [
      {
        h: 'Strict dieters who broke the diet ate more, not less.',
        p: 'Given a milkshake, they then ate more ice cream than those given none. The diet felt blown.',
        art: ['dots', {}],
        fact: { s: 'Study · Herman & Mack, 1975', i: [0] },
        more: 'In a classic study, people on strict diets were given a milkshake, then asked to taste ice cream. They ate more ice cream than strict dieters who had no milkshake first. Once the rule was broken, the rest of the day felt like it no longer counted.',
      },
      {
        h: 'Researchers have a name for “I blew it.”',
        p: 'They call it the abstinence violation effect, and it is what turns a lapse into a relapse.',
        fact: { s: 'Model · Marlatt’s relapse prevention', i: [1] },
        more: 'Alan Marlatt, who built relapse prevention, saw the same pattern in every habit he studied. After a lapse, people who blamed something fixed in themselves were the ones who kept going. People who saw it as one mistake in one moment got back up sooner.',
      },
      {
        h: 'An urge after a slip is still a wave.',
        p: 'It rises, peaks and passes like any other. The slip did not take away your skill.',
        back: 'l2',
      },
    ],
    mine: { h: 'Here is what you have done after slips.', k: 'back' },
    move: {
      h: 'After a slip, score it as one, not as ruined.',
      l: ['Say it: “One slip. The day is still mine.”', 'Log it honestly, then do one small thing', 'Ride the next urge like any other'],
    },
    check: {
      h: 'You slipped at noon. At four, another urge hits. What gives you the best chance tonight?',
      o: [
        ['Today is gone, so start fresh tomorrow', 'That is the thought that turns one slip into many. Today still counts.'],
        ['Treat it as a new wave and ride it out', 'Yes. One slip is one. This urge is a new one, and you can outlast it.'],
        ['Be hard on myself so it sticks', 'Harshness drains the confidence you need for the next urge.'],
        ['Give in now, then be strict tomorrow', 'Giving in today and strict tomorrow is the same all or nothing trap.'],
      ],
      a: 1,
    },
    scope:
      'The ice cream study was about strict dieting, not porn. The “I blew it” pattern comes from Marlatt’s relapse model for addictive behaviors in general, and the smoking study found that lapses shook people’s confidence. The pattern carries over, and so does the way out of it.',
    src: [S.herman, S.larimer, S.kirchner],
  },
};
