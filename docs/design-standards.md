# Design standards for tools and moments

These rules came out of the owner's passes over the SOS tools on a real iPhone (October 2026). They hold for every tool,
and for any screen elsewhere in the app that borrows these patterns (a timer, a squiggle, a shape, a two-step choice).
CLAUDE.md's thumb-zone and words rules still come first; these add to them.

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
- **A slip always reaches the comeback.** I slipped in SOS, the pause, Already happened and an eyes-open go-ahead in Talk
  it through all go on to Rekindle (`app/log.tsx`), so every one ends warm, with the flame and a plan for next time. A slip
  that is already saved (the go-ahead's look back) starts at the feeling before it, with no hold.
- **Done is always in reach.** On an ending with a long card, Done is pinned at the bottom (`SceneFrame`'s `pin`) while
  the card scrolls, on the smallest phone too. Confetti is clipped to the screen, so the page never scrolls sideways.
- **A long run is never "down to embers".** After a slip, the words lead with what is permanent ("Your 39 days are yours
  for good."), and the quest is a way to keep counting, never a rescue. Nothing about a run says "for now".

## Checking

- Check every changed tool on the iPhone build as well as the web, light and dark, and with Reduce Motion on.
- In development, Metro must not run with `CI=1` (it turns off reloads, so edits never reach the app).
