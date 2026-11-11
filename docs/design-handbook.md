# Design handbook: how to make an app feel made on purpose

Drawn from Daybook's design rules and checklist. It is general, so it can be handed to another app. Use it to QA and improve screens that
already exist: polish what is there, and do not refactor the app or rebuild screens unless a screen is truly broken.

## How to work (this is what makes the difference)

1. **Look at pictures, not code.** Take a screenshot of every screen in the app, on a phone-sized build, in light and dark mode. Judge
   the pictures. Most bad design is invisible in code and obvious in a picture.
2. **Run the checklist below on each picture,** one screen at a time. Write down concrete faults: the exact thing, what is wrong, and
   which rule it breaks.
3. **Use a hostile critic.** Give a fresh agent 3 to 5 screenshots, plus 2 screenshots of other screens as anchors, and the critic prompt
   at the bottom. Run several critics in parallel, one per group of screens. Keep only criticisms that name a thing on a picture and a rule
   or another screen it disagrees with. Ignore vague taste.
4. **Fix the clear faults yourself.** Bring real design choices to the owner, with options and a recommendation.
5. **Take the pictures again** after fixing, and look before calling it done. Never say a screen is done without having seen it.
6. **Do this on your own.** Spot problems without being shown them. The owner should not have to point out a misaligned switch or a
   badge hanging off its shape.

## The two questions for every screen

- **Is the next step obvious?** One thing is clearly first. A person knows what to do in two seconds.
- **Does it feel alive and warm?** A tidy screen with no soul is also wrong. Keep the character, illustration, color and motion that
  give the app its spirit. When simplifying, cut clutter, never spirit. If the app has a mascot or a hero visual, it gets bigger, not
  smaller.

## The first five checks (they catch most problems)

1. **Squint.** Blur the screenshot. You should see 2 or 3 masses, with one clearly first. Equal grey blocks, or the eye landing on the
   wrong thing, means the hierarchy is flat.
2. **Count what shouts.** About 3 text sizes, at most 2 large things, and one filled button per screen.
3. **Find a box inside a box.** A card or tinted box inside another card is wrong. Group with space and a heading instead.
4. **Put three screens side by side.** If only the words changed (same header, same card stack, same chip row), it is a template. Each
   screen's layout should come from its one job.
5. **Delete test.** Point at each thing and name the state or action it carries. If you cannot, it goes: a line that repeats the heading,
   a label above a heading, a pill that never changes, a decorative glow.

## Show it, do not say it

If a shape can carry the message, the words go. A good screen is understood with nothing explained.

- An empty state is the chart or list drawn empty in grey, with its title. Not a sentence asking the person to add something.
- A count is shown as its marks (dots, bars, a ring), not as a sentence about the number.
- Something that is coming shows its shape, greyed out.
- Before adding any sentence, ask whether the picture already says it.

## Where things sit (one hand, thumb at the bottom)

People hold the phone in one hand, and the thumb only reaches the lower half easily.

- The title, the question and any explanation sit at the top, to be read.
- What the person taps to answer (choices, sliders, option cards) sits in the lower half, just above the main button.
- The open middle shows the one thing being decided, big: the number a slider sets, a count, a picture.
- The main button (Next, Save, Done) is at the very bottom, full width, about 50 tall. A quiet link (Skip) can sit just under it.
- Close and Back stay at the top.
- No "Not now" or "Later" link that only does what the close button already does.
- Exception: a text box and its save button stay together near the top, because the keyboard covers the bottom.

## Type

- One short scale: 11, 12, 13, 15, 17, 20, 22, 28, 34, then big display numbers. Use 3 or 4 sizes on a screen.
- Nothing below 11. Reading text is 15 or more.
- No half sizes or near misses (13.5, 15.5, 19). They show nobody chose them.
- Emphasis comes from weight and color, not from another size.
- Fade text with size and weight, not with pale grey. Small text needs 4.5:1 contrast and large text 3:1, in both light and dark mode.
- No grey text on a colored background. Use a tint of that color, or white with some transparency.
- No small capitals or letter spacing on labels.
- It must still work at the largest accessibility text size: things side by side stack, and text rows have no fixed heights.

## Space, alignment and shape

- One spacing scale: 4, 8, 12, 16, 24, 32. Related things sit 4 to 8 apart, and separate groups 24 to 32 apart.
- If all gaps are equal, nothing is grouped. A heading sits closer to its own content than to what is above it.
- One left edge for text, cards and buttons, usually 16 from the screen edge. You should be able to draw 2 or 3 vertical lines that
  most things snap to.
- **Center things on their row.** A switch, chevron or icon is centered vertically on its row, with even padding on both sides. Check
  every row with a control.
- **Badges and counts stay inside their shape.** A small number like "×2" sits inside the pill or circle it belongs to, never hanging
  off the edge or below it.
- A short radius scale: about 12 small, 20 cards, 28 sheets, and a capsule for buttons and pills. Inner corners nest inside outer ones.
- A card has one edge: its fill, or a border, or a shadow. Never a border plus a soft shadow.

## Color

- One main color, one accent, neutrals, and status colors that always mean the same thing. Five or six competing colors is a tell.
- The accent goes on the one main action and on selected state, and hardly anywhere else.
- One filled button per screen. Red only for danger or an emergency action.
- Purple-to-blue gradients, glows and glass behind buttons and cards are the most common AI signature. A gradient earns its place only
  as a real picture (a sky, a scene) or to draw the eye to one spot.

## Lists and decoration (the usual AI slop)

- Lists are plain grouped lists: an icon at its own size, a title, one line, a chevron, and a thin line between rows. Never a stack of
  separate cards that say the same kind of thing.
- No icon inside a tinted circle at the head of every row or card.
- No more than 2 or 3 pills on a screen, and each one must show a state that changes.
- No emoji as icons. One icon set, one stroke width.
- No row of same-size cards. Make one the main thing.
- Center the one focal object. Text longer than 2 lines is left aligned.

## Words

- Paragraphs become sentences, sentences become labels, and labels that explain nothing go.
- Cut any line that explains what the screen already shows. A subtitle that repeats the title goes.
- Plain words. Say the concrete thing, not a big claim.
- A setting that does not work yet, or only works in some cases, says so plainly on the screen. Never show a control that silently does
  nothing.
- Status lines must be true and useful. "Not syncing right now" with no reason and no fix is worse than nothing: say why and what to do.

## Touch, motion and haptics

- Every tap area is at least 44 by 44, measured on the frame, not the icon.
- Every tappable thing has a pressed state.
- Motion is smooth springs with little or no bounce, about 0.3 to 0.4 seconds, and interruptible. Nothing makes a person wait.
- Anything that moves with time reads a smooth clock. It never ticks once a second.
- Something still must not look alive. A pattern that is meant to move but is standing still looks broken.
- Text never jumps. A choice must not swap the words above it or shift the layout.
- Haptics: one cause, one haptic. A light tick for a step in a slider or a choice, and a success haptic once for a real finish. Never on
  scrolling or on every tap.
- Every animation has a Reduce Motion version: fades instead of slides, and the meaning kept in words.

## Flow

- The close button goes one step back, to where the person came from.
- Choices come in two steps, not a pile: one question with a few big choices, and each choice opens its own page with one main button.
- Each kind of moment has one ending, the same wherever it is reached.
- The Done button on a long screen stays pinned at the bottom while the content scrolls, on the smallest phone too.
- Confetti and effects are clipped to the screen, so the page never scrolls sideways.

## How good apps handle a home screen

- **Cap, then reveal.** Show a few things, with the detail below the fold.
- **One obvious next thing,** like Duolingo's path or Headspace's one session card.
- **The biggest thing is what people find first.** Make it the thing that matters.
- **Warmth comes from form:** shapes, color and motion, not more content.
- **The warning:** a big mascot, a long list and upsells all competing means no hierarchy. Pick one thing to win.

## The critic prompt

Paste this to a fresh agent with the screenshot paths filled in:

> You are a hostile design critic for <app name>, <one line on what the app does and who it is for>. Your job is to prove these screens
> are generic AI-made UI, inconsistent with each other, or breaking this handbook. Read the handbook at <path>, then look at each picture:
> <paths>. The anchors <paths> are other screens of the same app. For each picture, list at most 6 criticisms, worst first. Each must
> name (a) the exact thing on the picture (its words or where it is), (b) what is wrong, and (c) the rule it breaks (quote it) or the
> other picture it disagrees with (name both, and say how: heading size, left edge, gap, card shape, button style, alignment, the voice
> of the words). Count type sizes, pills, filled buttons and boxes inside boxes. Check that every switch, chevron and badge is centered in
> its row or shape. Check the thumb rule: answers and the main button low, and a text box with its button together near the top. Name
> every sentence a shape could carry, every empty state that asks the person to add something instead of drawing its chart empty, and
> every control that does nothing or a status line that does not say why. No vague taste ("feels cluttered") and no praise. Do not ask
> for the app's character, illustrations or warmth to be removed. If a picture is clean, say "nothing concrete". End with up to 3 seams
> across the pictures: the same job done two different ways.
