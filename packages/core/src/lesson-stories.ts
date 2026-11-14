/* Lessons told as a story (the owner, November 14, 2026: "it needs to be more of like a story that it's telling ... very good teaching
   and educational and like change your perception"). The standard and the kinds are in docs/lessons.md; read it first. A story here
   replaces the turn with the same id (lesson-turns.ts turnLesson), in place: its id, its section and its place on the path stay, so
   nothing done or earned moves.

   The shape, in order:
     tell   the story, a card at a time: a study, a tale, a word, a moment from a life, or a question broken down. A card marked long
            is in Long only; every other card is in both. A guess (k: 'guess') asks about the story before its answer, and has a
            right answer, since the answer is a surprise. A flip (k: 'flip') turns one thought over, only where it reveals something.
     line   the one line that sticks, on the sun card
     mine   a true line from the person's own log, where it fits (lessonMine)
     today  one thing to do, tied to the idea
     you    a question only the person can answer: no right answer, no verdict
   Short is every card without long, and Long is every card. Scenes never put a clock time or a bed on everyone. */
import type { Art, Block, Card, Lesson } from './lessons';
import type { Beat, LessonBeats } from './lesson-beats';
import type { MineKind } from './lesson-turns';
import { STORIES_A } from './lesson-stories-a';

/** a source: [name: topic, url] */
type Src = [string, string, string?, string?];
/** an answer and what the flame says to it */
type Opt = [string, string];

/** what a story is: the kinds in docs/lessons.md */
export type StoryForm = 'study' | 'breakdown' | 'meaning' | 'word' | 'life' | 'works' | 'tale';

export type StoryPart =
  | {
      k?: 'say';
      h: string;
      p?: string;
      /** what the flame says in its bubble */
      say?: string;
      /** a giant number that starts the sentence h finishes */
      n?: string;
      art?: Art;
      fact?: { s: string; i?: number[] };
      back?: string;
      long?: 1;
    }
  | { k: 'guess'; h: string; o: Opt[]; a: number; long?: 1 }
  | { k: 'flip'; think: string; see: string; long?: 1 };

export interface Story {
  id: string;
  form: StoryForm;
  title: string;
  tag?: string;
  ic: string;
  ask: string;
  /** the one line that sticks: on the sun card, and what the flame says at the end */
  key: string;
  np: string;
  mins?: number;
  tell: StoryPart[];
  mine?: { h: string; k: MineKind };
  today: { h: string; l?: string[] };
  you: { h: string; o: Opt[] };
  scope: string;
  src: Src[];
}

const ICON = (ic: string): Art => ['icon', { ic }];

/** a story as a lesson's cards, and the words each card shows */
export function storyLesson(S: Story, was: Lesson): { L: Lesson; beats: LessonBeats } {
  const cards: Card[] = [];
  const beats: Beat[] = [];
  const add = (c: Card, b: Beat) => (cards.push(c), beats.push(b));
  S.tell.forEach((t, i) => {
    const q = t.long ? undefined : (1 as const);
    if (t.k === 'guess') return add({ k: 'choose', q, e: 'predict', el: 'Guess', h: t.h, a: t.a, c: t.o }, { h: t.h, c: t.o.map((x) => x[1]) });
    if (t.k === 'flip') return add({ k: 'flip', q, e: 'answer', el: 'Look again', h: t.think, see: t.see }, { h: t.think, p: t.see });
    add(
      {
        k: 'text',
        q,
        e: i === 0 ? 'hook' : 'proof',
        el: 'The story',
        art: t.n ? ['big', { n: t.n }] : t.art || (i === 0 ? ICON(S.ic) : undefined),
        h: t.h,
        fact: t.fact,
        back: t.back,
      },
      { h: t.h, p: t.p, say: t.say, n: t.n },
    );
  });
  add({ k: 'text', q: 1, e: 'answer', el: 'The line', h: S.key }, { h: S.key });
  if (S.mine) add({ k: 'text', q: 1, e: 'mine', el: 'Your own log', h: S.mine.h, b: [['mine', S.mine.k]] as Block[] }, { h: S.mine.h });
  add({ k: 'text', q: 1, e: 'move', el: 'Today', art: ICON(S.ic), h: S.today.h }, { h: S.today.h, l: S.today.l });
  add({ k: 'choose', q: 1, e: 'check', el: 'Only you', h: S.you.h, c: S.you.o }, { h: S.you.h, c: S.you.o.map((x) => x[1]) });
  const L: Lesson = {
    ...was,
    v: 3,
    form: S.form,
    title: S.title,
    tag: S.tag || was.tag,
    ic: S.ic,
    mins: S.mins || 5,
    ask: S.ask,
    key: S.key,
    np: S.np,
    cards,
    rc: undefined,
    scope: S.scope,
    src: S.src,
    chk: 'November 14, 2026',
  };
  return { L, beats: { cards: beats, key: S.key } };
}

/** every lesson told as a story, by id */
export const STORIES: Record<string, Story> = { ...STORIES_A };
