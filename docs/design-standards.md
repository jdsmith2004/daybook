# Design standards

The look holds for every screen. The rest came out of the owner's passes over the SOS tools on a real iPhone (October 2026). They hold
for every tool, and for any screen elsewhere in the app that borrows these patterns (a timer, a squiggle, a shape, a two-step choice).
CLAUDE.md's thumb-zone and words rules still come first; these add to them.

## The look (the owner, October 30, 2026: no AI slop)

The whole app went through this on October 30, 2026 (the record is in docs/plan.md). `packages/core/test/craft.test.ts` fails on the
parts a machine can check; the rest is the checklist in docs/craft-checklist.md, run on a picture of the screen, not on the code.

- **A reason for everything.** Point at each thing on a screen and name the state or action it carries. If you cannot, it goes.
  The first check is to blur the picture: 2 or 3 masses, one clearly first.
- **One type scale.** 11, 12, 13, 15, 17, 20, 22, 28, 34, then big display numbers (38 and up). `T` first: `small` 13, `body` 15, `label`
  15 semibold, `h2` 20, `title` 28. 3 or 4 sizes on a screen. Emphasis is weight and color, not another size.
- **No capitals for labels:** no `.toUpperCase()`, `textTransform` or letter spacing on a label. A label says something the
  heading does not, or it goes. "A thought, not an order" (a stamp in a picture) is art, not a label.
- **A card has one edge: its fill** (`Card`: `c.surface`, radius 20, padding 16). Never a border plus a soft shadow. **No card inside
  a card:** group with space and a heading instead.
- **Lists are plain grouped lists:** `Rows` and `LinkCard`. An icon at its own size, a title, one line, a chevron, a thin line
  between rows. Never a stack of separate cards that say the same kind of thing.
- **No icon in a tinted circle** at the head of a row or card. A stop, a badge or a moment that wants a shape uses a real one
  (`Shape`, `Medal`), and it means something.
- **One filled button on a view,** in `c.accent`; red only for SOS and danger. The rest are quiet fills or words. 44 tall at least.
- **The tab bar.** On iPhone it is Apple's own glass bar (`app-tabs.ios.tsx`), with SOS in the system's separate glass circle; it never
  minimizes. Android and the web draw their own, with a round SOS (`SosButton`) and a fade above the bar.
- **The lip** (the small hard shadow that presses down) is for the main button and big choice cards in full-screen moments, and
  the round SOS. Nothing else has one.
- **Few words.** A subtitle that says what the screen already shows goes. Paragraphs become sentences, sentences become labels.
  "My Daybook" and the like are gone for good.
- **Radii:** 12 small, 20 cards, 28 sheets, capsule for buttons and pills; an inner radius nests inside the outer.
- **Space:** 4, 8, 12, 16, 24, 32. Related things 4 to 8 apart, sections 24 or more, one left edge 16 from the screen.
- **Sameness is a smell.** Three screens side by side should not look like one template with new words: a screen's layout comes
  from its one job. Today is a sky; Your day is a line through the day; Milestones is the flame; SOS is one living thing.
- **Spirit is not optional.** Clearing clutter must never leave a tidy page with no soul. Keep the skies, the flame, the shapes,
  the squiggle, the motion and the warm words, and where a page has room, make the flame bigger, not smaller.

## Motion

- **One squiggle.** Every squiggly line is drawn with `SQUIGGLE` in `components/shapes.tsx` (thickness 5, one wiggle
  every 20 points, 2.25 deep, crawling 0.35 wiggles a second). Use `WavyRing` for a ring, `WavyLine` for a straight line,
  and `squigglePath` with `along` for any other path. Never pick new numbers for one screen.
- **Squiggle means progress.** The part still to come is a plain, quiet line. The part done is the squiggle. It starts
  flat and eases in as the run starts (`envelope`), and it crawls forward slowly. A squiggle that only marks something,
  with no progress, uses `ease={false}`.
- **Smooth, never ticking.** Anything that moves with time (a dot, a ring, a crawl) reads its position from a smooth clock
  (`useClock`, about 30 times a second), never from a once-a-second count. A number of seconds left can tick; the motion
  cannot.
- **Something still must not look alive.** Do not reuse a moving pattern (the breath dots, a beat) standing still: if it
  is not moving, it looks broken. Either it moves, or it is a plain shape.
- **The flame moves as fire, never as a whole figure (the owner, October 31, 2026).** The face and the body hold still; the tips lick, a sun's rays lick out
  from its disc, a star's points reach and draw back. The rule is one wave in core `flame-fire.ts`, for every form; a new form or a new flame in a drawing
  moves by it, and no bobbing, swaying or breathing goes on the figure. A tap makes the fire leap and swells the figure a little, once. Skia draws it on a
  phone (`fire-layer.native.tsx`), and plain SVG paths on the web (`fire-layer.tsx`).
- **One breath curve.** Anything that breathes (the Breathe dots, the timer's beat, the SOS sun, the small sun in the
  tools) reads `breathAt` from `lib/breath.ts` on a clock (`useBreathClock`), never a chain of one timed animation per
  step. The curve speeds up gently, keeps an even pace through the middle and slows the same way into the turn, so it never
  rushes and never stops dead. Where there are many parts, each follows a moment after the last, so the turn rolls through
  them, and something slow (a turn, a twinkle) keeps going on the holds.
- **Reduce Motion.** Every animation has a still version. Words (Hold, Let go; Breathe in, Breathe out) keep the beat
  when the shape cannot.
- **Text does not jump.** A choice on a screen (like how strong an urge is) must not swap the words above it or move the
  layout. Lines picked at random are picked once per visit and kept.

## Timers

- **One timer.** A tool that runs for a set time uses `ToolTimer` (`components/tools/timer.tsx`): the squiggle ring
  fills, a soft shape inside keeps the beat of the task (a hold and a letting go, a slow breath, a lively pulse), with a
  few words and the time left big in the middle.
- **The page around it.** What you are doing sits at the top, to be read (the move and how to do it). The timer is the
  open middle. "I am done" is the main button at the bottom, with a quiet link under it to change the choice.

## Choices

- **Two steps, not a pile.** A tool that asks something first shows one question with a few big choices low on the
  screen, and a choice opens its own page: a shape and icon big in the middle, a sentence on what helps, and one main
  button that does it. A quiet link goes back to the choices. No list of cards that grows under the chips.
- **A list of choices** is one column of rows: a small shape (in the tool's color, bright enough on the dark skies), the
  name, the how in one or two lines (never cut off), and a chevron. A tap starts it.
- **Shapes** come from `components/shapes.tsx` (Android's Material shapes). Pick ones that read clearly at the size used:
  the heart and other thin shapes look like blobs below about 50 points.

## Flow between tools

- **The X goes one step back.** A tool opened from SOS closes back to SOS's tool list (to pick another), never to the
  start of SOS or to Today: `useToolExit` sets the SOS step to `tools`, and SOS opens its More sheet. A tool opened on
  its own closes to where it was opened.
- **Lead on.** When a tool's result is another tool (an idea that is a walk, a need that is "lonely"), offer that tool
  as a button. From SOS there is always a quiet way back to the tools.
- **Every finish** goes through `useFinishTool`, so it counts, and from SOS goes back to SOS, which asks one quiet
  question: "How is it now?" (step `after`). Two big choices sit low: **Better** opens its own page with It passed as the
  main button (and Keep going under it, back to the ride); **Still strong** marks the round and opens the tool list.
  Nothing else is asked: the ride itself never stops to ask how it is going.
- **Doors between the care tools.** SOS, Already happened and Planning a slip? lead to each other: SOS's More holds Talk
  it through at every hour (and Go to bed at night, as a second row); every Talk it through page has the SOS pill in its
  top bar (`SosPill`, as the setup has), which goes back to an SOS that is still open under it.

## Endings

- **One ending for each kind of moment.** An urge ridden out ends on the same celebration wherever it is logged: the
  ride's It passed, the 10-minute pause's It passed (from SOS or on its own) and Already happened, I rode it out all use
  `RodeOut` (`components/rode-out.tsx`): the flame with its burst, confetti, how long it took, how many have been ridden
  out, what helped (the moves of an SOS, or what you did) and what set it off, each one tap or none.
- **A slip always reaches the comeback, from its first page.** Every way in starts at the hold: I slipped in SOS, the pause, Already
  happened, the entry sheet (a new slip, or an entry changed to Slipped) and "I went ahead" in Talk it through's look back. The hold
  comes before any question, because hope comes first. SOS opens over Rekindle (`SosPill over`, "Open SOS"), and its X and its ending
  come back to the same page.
- **Next time is a plan already made, and the plan is Daybook.** Nobody is asked to think of something at their lowest moment. The plan
  is one sentence from what was going on ("... I will open SOS"), one tap to keep, with "Choose another" on its own page. When a plan
  comes back on Today, a tap opens its tool. After a slip, one door for the next hour (core `slipNext`), never a list of things to try,
  and never water or a step outside: name Daybook's tools first, and what is outside only where it is the true answer (a person, sleep).
- **Done is always in reach.** On an ending with a long card, Done is pinned at the bottom (`SceneFrame`'s `pin`) while
  the card scrolls, on the smallest phone too. Confetti is clipped to the screen, so the page never scrolls sideways.
- **A long run is never "down to embers".** After a slip, the words lead with what is permanent ("Your 39 days are yours
  for good."), and the quest is a way to keep counting, never a rescue. Nothing about a run says "for now".

## Checking

- Look at a picture of every screen you changed and run docs/craft-checklist.md on it.
- Check every changed tool on the iPhone build as well as the web, light and dark, and with Reduce Motion on.
- In development, Metro must not run with `CI=1` (it turns off reloads, so edits never reach the app).
