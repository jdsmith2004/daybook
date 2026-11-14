# The lessons: the standard, and how they are protected

The owner, November 14, 2026: "these lessons need to be enshrined in stone. I'm always up for better ideas and improvement, but what
I don't want to happen is have the lessons lose their soul and spirit when I'm doing design changes."

Read this before touching any lesson's words, any lesson file in `packages/core/src` (`lessons*.ts`, `lesson-turns*.ts`,
`lesson-habit.ts`, `lesson-beats.ts`, `lesson-questions.ts`), or the lesson player (`apps/mobile/src/app/lesson/[id].tsx`,
`components/lesson-*.tsx`).

## Why this file exists

On November 14, 2026 the owner said the lessons had "dropped in quality dramatically": the flashcards were "super obvious things".
Nobody decided to make them worse. It happened in two design passes, and neither one meant to change what a lesson teaches:

1. **November 2.** The owner approved a new standard on a few lessons. That same day, 46 lessons were rewritten in one batch into one
   fixed eight-card template, with the conclusion stated first and each study cut to one short line.
2. **November 12 ("lessons like Duolingo").** This was a redesign of the player. It turned every card into a quiz, with a graded last
   question whose right answer was the steps card's own words, and forced the short version. That hid every card that told the
   study, the story or the number.

The good rules from November 1 (docs/plan.md, "Lessons that teach people how to quit") lived only in a plan entry, so nothing held
them. This file and the lock below are what hold them now.

## The lock

- **A lesson's words change only with the owner's yes for that change.** That covers its title, key line, every card, every answer
  and comment, its faith voices and its habit versions. A design change, a player rewrite, a cleanup or a "tighten the words" pass
  is never that yes.
- **The player shows the words. It never decides them.** No design may hide a lesson's cards, cut its words to fit a layout, turn an
  open question into a graded one, or reorder its cards. Short plays the cards marked for Short, and Long plays every card. If a new
  look needs shorter words, ask the owner, and the lessons stay as they are until the owner says yes.
- **`packages/core/test/lesson-lock.test.ts` enforces this.** It keeps a fingerprint of every lesson's words in every voice and
  habit (`test/lesson-lock.json`), and it fails when one changes. When the owner has said yes to a change, update the fingerprints in
  the same commit, quote the owner's yes in the commit message, and run:

  ```sh
  cd packages/core && UPDATE_LESSON_LOCK=1 npx vitest run test/lesson-lock.test.ts
  ```

  The same test fails if Long stops playing every card of a lesson.

- Better ideas are always welcome. Bring them to the owner as samples (the old version beside the new one), never as a batch
  rewrite.

## What a lesson is for

A lesson changes how a person sees the habit and themselves, so that they become, and see themselves as, someone who is free. It
teaches something they have not thought of, or gives them a new reason why something works, so that trying it makes sense. It
never tells them what they already know.

The voice is that of great teachers: David A. Bednar, Jordan Peterson, Jeffrey R. Holland, Matthew Cowley, Patrick Kearon, Malcolm
Gladwell. They come at a familiar thing from a side nobody expected, say the hard part plainly, and leave the person to work it out.
Their ideas are retold in Daybook's own plain words. Lessons for everyone do not name the speakers. Faith lessons, for people who
said faith matters to them, may name the speakers and the scripture. A direct quote stays short. The research behind them is in the
side-session notes (`peterson-ideas-research.md`, `lds-speeches-research.md`).

## The kinds of lesson

The kinds rotate along the path, so no two days in a row feel the same.

| Kind                         | What it does                                                                                                                                                                                | Owner's word       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| The study story              | What researchers expected, how they tested it differently, what surprised them, what it changes for you. Example: the white bear, the milkshake, the soldiers who came home from Vietnam.   | liked, November 14 |
| The breakdown                | A real question people ask ("How do I know if I really want to stop?"), broken into what it will take. It says the hard part plainly and leaves the rest to work out, with no right answer. | "pretty good"      |
| The hard truth about meaning | A big, direct reframe about responsibility, carrying a load, and who you are for.                                                                                                           | "pretty good"      |
| A word taken apart           | Where a word comes from changes the picture (addictus, bound for a time; decide, to cut off).                                                                                               | "pretty good"      |
| A moment from a life         | A real moment in history that holds the idea (Bill W. at the lobby phone in 1935).                                                                                                          | not yet seen       |
| Why this works               | Why a tool Daybook asks you to try works, so trying it makes sense.                                                                                                                         | not yet seen       |
| An old tale taken apart      | A story everyone knows, read for what it says about a habit (Pleasure Island, the dragon's gold).                                                                                           | "excellent"        |

## Every lesson

- **It turns something over.** By the end, the person sees something differently. A card that says what they already believed is cut.
- **It shows before it says.** The story, the study or the tale comes first, and the turn is earned from it. It is never a wrong
  belief followed by its correction.
- **One line that sticks**: one sentence a person would repeat to themselves ("Uncomfortable is not the same as wrong." "Bound for a
  time, not born bound.").
- **Today**: one thing to do, tied to the idea.
- **Only you**: a question only the person can answer, with no right answer and no verdict. Never a quiz about the lesson's own words,
  never "Yes." in front of the good answer, and never a straw answer.
- **A guess**, when there is one, is about the study or the story ("Did they eat more, or less?"), and its answer is a surprise.
- **Times and places are the person's own.** Hard moments come from setup ("When does it pull hardest?") and the log. A scene never
  puts a clock time or "in bed at night" on everyone, because many people struggle in the day.
- **Direct, with hope.** It says the hard part plainly ("Seeing it will hurt"). Stakes are about the next choice, never about who the
  person is, and never piled on after a slip.
- **The words rules hold**: plain words, no contractions, no swearing, never shame, and no machine tells (the list in
  `test/lesson-beats.test.ts`).
- **Short and Long.** Short is the card lesson, a few minutes. Long is the same idea explored all the way down, with nothing condensed
  out: the full story, what came before and after, and why it works. Example: the book version of Pinocchio, where the boys hide
  their ears under caps, and Pinocchio becomes real only after months of daily work for his father.

## What failed before (never again)

- A flip card whose front is a belief nobody would defend inside a quit app ("I need my phone in bed"), and whose back is a slogan
  ("Nobody quits alone").
- A graded last question whose right answer is the steps card.
- The study told in one line, with the real telling hidden.
- Every lesson set at 11 p.m. or 1 a.m.
- Every lesson in the same shape.
