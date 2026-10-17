# What is planned next

The owner's direction is in CLAUDE.md ("What the owner has asked for"). Everything here follows it. Build the tiers in order;
each tier ends with typecheck, tests, a look at the web build, and a merge to `main` (which publishes it).

| Tier | What | Model |
| --- | --- | --- |
| 1 | Graduation: a fun, permanent award (and remove the lighter Today) | Opus, high |
| 2 | Levels: the new ladder, its pacing, and keeping every earned level | Opus, high |
| 3 | Levels: the look, the art and the animations | Opus, medium |
| 4 | Words and polish pass (long runs, slips, Milestones), and the owner's notes | Opus, medium |

## Tier 1: Graduation

What the owner asked for: 90 days is the goal; graduating is an award kept for good; it is a celebration, not a different
app (Today stays exactly as it is); no "lighter Today"; the goal is not pushed until the person has gone a week with no
slip; and a slip near the goal must never feel like losing everything.

1. **Remove the lighter Today**: `packages/core/src/lighter.ts` and its test, `apps/mobile/src/app/lighter.tsx`, its Settings
   row and `_layout` entry, the Today offer and layout, and `quiet` in Hero. `settings.lean` and `leanNo` are ignored from now
   on; nothing needs to move.
2. **How it is earned: 90 no-slip days within the last 100 days**, not 90 in a row. A slip at day 89 makes the count 88, and
   it keeps climbing the next day. What Daybook shows is that count ("72 of 90 toward graduation"), never a run that resets.
   `GRAD_DAYS = 90` and `GRAD_WINDOW = 100` in one place in `packages/core` (a new `graduate.ts`).
3. **When it shows**
   - Before the first 7 days in a row with no slip (`longest >= 7`): nothing on Today. Milestones has one quiet line that
     graduation exists.
   - After that: progress in Milestones and a small line on the Days card ("Toward graduation: 41 of 90"), warm words, no
     countdown on Today.
   - From 80: a gentle "almost there" note, never framed as something that can be lost.
4. **Graduating is a party.** The first time the count reaches 90: a full-screen celebration (bigger than a level-up:
   fireworks or rising lanterns over the flame, a cap toss, haptics, the chime), then a "You graduated" screen with the date,
   the numbers that got them there (days, urges ridden out, lessons), and who they are becoming (`settings.becoming`). A
   shareable-looking card they can screenshot (no data leaves the device).
5. **The award stays for good.** `settings.gradAt` (the date, set once, never cleared) and a `graduated` badge earned from it,
   so it can never be lost to a slip or a rule change. The flame wears a small graduate mark (a cap or a laurel) from then
   on, at every level.
6. **After graduating**: Today is the same. Milestones shows "Graduated · March 3". The count keeps going ("still going: 97
   of 100"), as something to enjoy, not to protect. A slip after graduating goes to Rekindle like any other; the award and the
   mark stay. Optionally, a second and third graduation (another 90 within 100 after a slip) add a star to the award, never
   required.
7. **Tests**: the window count (a slip at 89 gives 88, then 89 the next day), the 7-day gate, the award set once and kept
   through later slips, setting changes and sync, and the words never saying lost, failed or reset.

## Tier 2: Levels, the ladder

Today: 30 levels, 10 flame forms with 3 small steps each, points from `5 × i × (i + 3)` (level 30 at 4,640 points).

1. **Measure first.** From the golden fixtures and a few made-up months, find the points of a light, a steady and a full
   day. Write them down in `levels.ts` so the pacing is checkable.
2. **The new ladder: 60 levels in 12 forms of 5 steps.** Pacing goals, against a steady day:
   - Day 1: a level-up from setup alone. First week: about 5 levels. First month: the third form.
   - Then each form takes a little longer, and the last forms are a year or more away, so there is always something ahead.
   - Two new forms at the top beyond Full Sun (for example **Constellation** and **North Star**), so long-time users have
     somewhere new to go.
3. **Every form looks clearly different**, and every step inside a form adds something you can see (a new element, not just
   a brighter color). The 12 forms keep the story: a spark, kindling, campfire, torch, beacon, lighthouse, sunrise, daybreak,
   bright day, full sun, constellation, north star.
4. **Nobody goes down.** Points stay the source of truth. Every old level maps to a new level at the same form or later
   (`OLD_TO_NEW`), the kept floor in `settings.seen.level` is converted once, and the new curve is checked so that no point
   total lands lower in form than before. Level badges keep their ids.
5. **Move levels to TypeScript.** `STAGES`, `LEVELS`, `levelOf` and `nextLine` move from `legacy/core.js` to
   `packages/core/src/levels.ts` (and are removed from `core.js`), with unit tests for the curve, the mapping and the floor.
   The golden fixtures change on purpose where levels show; say so in the commit.

## Tier 3: Levels, the look

1. **Art for 60 steps.** Redraw the flame emblem (`packages/core/src/emblem.ts` and the legacy EMBLEM it wraps) as a set of
   layered SVG parts per form, so steps add parts. Same style as today: round, warm, friendly.
2. **Always alive, gently.** Each form has a slow idle motion that fits it (the spark twinkles, the campfire flickers, the
   lighthouse beam sweeps, the sun's rays turn, the stars shimmer). Built with `Animated` like the lesson art, paused off
   screen, still under Reduce Motion.
3. **Level-up moments.** A step up: the new part grows in. A new form: a short transformation (the old form glows, bursts into
   light, the new one settles), then the existing celebration card. The graduation mark carries over.
4. **Growth path screen** (Milestones › Growth path): all 12 forms in a scrolling path, the reached ones lit and animated, the
   next one as a silhouette with how far away it is, in warm words.
5. Check in light and dark, on a small phone and a large one.

## Tier 4: Words and polish

1. Rekindle, the Days card, Journal and Milestones: words that honor a long run after a slip ("89 days. That is huge, and it
   still counts."), using the run that just ended. No "lost", "failed" or "reset" anywhere.
2. Setup's "Use it a lot less" goal: keep it as a gentle way in (recommended), unless the owner says otherwise.
3. Anything the owner noticed on the live site in the meantime.
