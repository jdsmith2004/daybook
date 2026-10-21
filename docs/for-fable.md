# For Fable

Work worth a Fable run. Fable time is limited, so only what needs it is here.

## 1. Security review before the first AWS deploy: done (October 16, 2026)

Fable found seven issues. Fixed: the deploy role could read logs by invoking the sync function or making a role (it can now
make no roles; the bootstrap stack makes the sync role); the web sign-in sat in storage for 90 days (now per tab, or a year
with rotation when the browser is trusted); the account-admin scope allowed an email takeover (removed; closing an account goes
through the API); one request erased the log for good (now a week's undo); no provider lock files (written at first init, see
infra/README.md). Accepted for one person: rejected requests are still billed, and the default CloudFront certificate allows
old TLS versions. A second review is only worth it after a large change to infra/ or sign-in.

The brief it was given:

A fresh, independent look at what protects a person's log, by a model that did not write it. Ask for findings ranked by
severity, each with the file and line, and nothing changed without asking.

- `infra/bootstrap/main.tf`: the GitHub OpenID Connect trust (only `main` of this repository), the deploy role's policy (can it
  read the table, change user passwords, or escape the boundary?), the permissions boundary, the account lock.
- `infra/app/*.tf`: the Cognito pool and app client (PKCE, no secret, the callback and logout addresses, the new
  `aws.cognito.signin.user.admin` scope, invite-only), the JWT authorizer, throttling, the Lambda role, the DynamoDB table
  (point-in-time recovery, deletion protection), CloudFront and its Content-Security-Policy.
- `.github/workflows/deploy.yml` and `ci.yml`: which jobs can get an AWS token, pinned actions, what reaches the public logs.
- `services/api/src/*.ts`: the user id only from the token, the cursor check, sizes and the daily allowance, erase.
- `apps/mobile/src/lib/auth.ts`, `secret.ts`, `secret.web.ts`, `sync.tsx`: the PKCE flow, where tokens are kept, refresh and
  sign-out, and that nothing about the log reaches anyone but its owner.

Suggested: Fable at high effort, one run, the files above attached.

## 2. The SOS tools' shapes and motion: done (October 21, 2026)

Fable read orb.tsx, lib/breath.ts, lib/m3-shapes.ts, shapes.tsx, motion.ts, timer.tsx and the tool files, spot-checked
the shape port against androidx (RoundedCorner, the cut sharing between corners, star, rectangle, circle, customPolygon
with mirroring, normalized: all match; the arc is split into quarter turns where androidx draws one cubic, and the bounds
are measured on the curve where androidx uses the control points, so shapes fill their box by a hair more), and measured
the plain web build in Chromium at phone size, light and dark: the dots were sampled ten times a second over a full
breath (no dot moved more than 15 points in a tenth of a second, the ring lands at full size as the words change, the
cluster rests at the bottom), the ids were checked for collisions (none), the console for errors (none), and Reduce
Motion (a still ring, 32 of 32 dots still). Nothing in the breath was broken on the web, and nothing was found by reading
that would break on iOS or Android. Fixed and deployed: the "How is it now?" answers now sit in a Dock at the bottom
(they were in the top third); the dark-mode glow behind the breath is a paler, thinner gold (gold at strength over the
dark blue mixed to brown); the small breath in Get curious redraws its morphing outline about 30 times a second instead
of every frame (it was a new path and a layout on every frame, on the JavaScript thread); a stale comment in orb.tsx.
Not verified, since nobody could run it on a phone here: how heavy 32 shadowed dots are on a mid-range Android, and the
`boxShadow` on each dot (New Architecture only; outset shadows need Android 9 or later). Noted, not changed: the dark
palette's `sunSoft` is a dark olive, so the Get curious breath and Surprise's spinning faces read as brown at night; the
breath clock re-registers its frame callback on every render (ten a second), which is wasteful but harmless.

The brief:

```
Daybook (github.com/jdsmith2004/daybook) just shipped a redesign of its SOS tools: Android's Material 3 Expressive
shapes, wavy lines and a particle breath. Another model wrote it, and it was checked only on the web build in headless
Chromium. Nobody has tried it on a phone yet. I want a fresh, independent look by a model that did not write it: find
what is broken, wrong or rough, fix what is clearly a bug, and ask before changing a design. Read CLAUDE.md and
apps/mobile/AGENTS.md first and follow them (thumb rule, words, formatting, effort, merge and [deploy] rules).

[If I have tried it on my phone, my notes go here: what I saw, on which phone.]

What to look at, most important first:
1. The particle breath, apps/mobile/src/components/orb.tsx (Orb and Dot). It runs on Reanimated 4.7 with worklets
   0.13 (Expo SDK 58): the UI thread on iOS and Android, plain JavaScript on the web. Check it by reading as well as by
   running, since nobody can run it on a phone here: worklet closures and the useAnimatedStyle dependency arrays,
   shared values that hold arrays (cluster and scatter are swapped every breath), 32 animated views each with an SVG
   radial gradient and a boxShadow (is boxShadow supported on native here, and is it too heavy on a mid-range Android?),
   gradient ids ("orbGlow", "dot0" to "dot31") that collide if two Orbs or other SVGs are mounted at once on the web,
   timing against breathPhase in packages/core, the Reduce Motion path, and cleanup of withRepeat.
2. The shape kit: apps/mobile/src/lib/m3-shapes.ts claims an exact port of androidx graphics-shapes RoundedPolygon and
   all 35 MaterialShapes. Spot-check it against the androidx source (the rounding and the corner features, and the
   morph point matching used by MorphShape). Then components/shapes.tsx (Shape, MorphShape, WavyRing, WavyLine)
   and lib/motion.ts (the springs, useReducedMotion).
3. The tools that use them: components/tools/ride.tsx (Get curious wave, Name the thought "Let it go"), calm.tsx
   (Breathe setup, 5-4-3-2-1 shapes that morph in), pause.tsx (wavy timer), scene.tsx (Move's beat, Surprise,
   My reasons medallion, Go to bed), components/tool-grid.tsx (tool icons on shapes), components/scene.tsx (Finish
   burst). Also packages/core/src/sos.ts pickIdea (an empty calm-move menu now falls back to MENU_DEFAULT).
4. Two things already noticed, not yet fixed: the "How is it now?" screen after a tool has its answer cards in the top
   half (breaks the thumb rule in CLAUDE.md); in dark mode the glow behind the breath dots looks muddy.

How to check:
- npm ci, npm run typecheck, npm test. For the screen: cd apps/mobile && npx expo export --platform web, serve dist
  with a fallback to index.html, and drive it with playwright-core (Chromium is at /opt/pw-browsers) at 390x844,
  light and dark. Routes: /sos, /tool/breathe, /tool/ground, /tool/curious, /tool/thought, /tool/pause, /tool/move,
  /tool/surprise, /tool/reasons, /tool/bed.
- Do not judge motion from the screenshot build (npm run shots, or EXPO_PUBLIC_SHOTS=1): src/shots/mode.ts forces
  Reduce Motion on, so the breath sits still there on purpose. Use the plain build.
- Measure motion instead of trusting one picture: sample the dots' transforms over a full breath, and capture frame
  strips.

What I want back:
- Findings ranked by how much a person in the middle of an urge would notice. Each one names the file and line, what
  they would see, and on which platform. Say plainly what you could not verify (anything native-only).
- Clear bugs fixed on a branch, merged to main when typecheck and tests pass, with [deploy] on the last commit (count
  this month's deploys first, as CLAUDE.md says). Design changes proposed in chat, with pictures as image files, not
  made.
- A short record of the run added to docs/for-fable.md under "2. The SOS tools' shapes and motion".
```

Suggested: Fable at high effort, one run. Better after the owner has tried Breathe and 5-4-3-2-1 on a phone, with those
notes in the brief.

## 3. SOS and Talk it through, from the person's side: done (October 21, 2026)

Fable read sos.tsx, core sos.ts, the tool screens (tool/[id].tsx, components/tools/\*), lib/tools.ts, lib/sos.tsx, talk.tsx,
core talk.ts and talk-log.ts, talk-card.tsx, risk-card.tsx, core risk.ts and the hand-off into log.tsx. Then it built the plain
web export and drove it in headless Chromium at 390 by 844 (and 375 by 667, dark, and Reduce Motion) as five seeded people: a
first night with no setup, 40 days in with a note and a safe person, someone who slipped an hour ago, someone with three slips in
five days and motivation at 2, and someone whose log puts the hard hours at 11 PM to 1 AM, each at 2 PM, 8:30 PM, 9:30 PM,
11:20 PM and 1:30 AM. Every path was walked to its end: SOS to each tool to "How is it now?" to the check-in; "I slipped" from
SOS after a 39-day run; Still strong; the X at every level; Go to bed to Good night; a second SOS within the hour; Talk it
through on all three paths; the decide-later return; the look back after going ahead; and the hard-hours card from "coming"
to "held". Nothing was changed. Not verified: anything native (haptics, the reminders, a real screen reader; the
accessibility tree was read instead), and how it feels on a phone in the hand.

### 1. Verdict

**SOS** is right in its bones. Help starts at the first tap (the sun is breathing before anything is asked), the strength
question is optional, Next works at any time, the suggestion learns, and "How is it now?" has its answers where the thumb
is. What holds it back is noise at the second screen (eleven "New" badges, a suggestion that ignores the person's own best
tool in the first round), two tools that silently lose what the person just picked, and the slip path, which puts a
bookkeeping question before the breath.

**Talk it through** has the right idea and the right ending (the three honest paths, the look back with the expected-against-
got bars) and is too long in the middle for the person it is for. Someone who picked "I have stopped caring" and "It is going
to happen anyway" reads six research cards and taps about twenty times before a plan exists, with a twelve-segment progress
bar telling them so at the top. The science is good; the dose is wrong for 11 PM.

### 2. The changes that would help people most, ranked

1. **Talk it through: cut the reading before the first question.** Drop the "Planning a slip?" explainer page (the door on
   Today, the check-in and SOS already said the same words); open on "Which ones sound like you?" with the warm line
   ("You are not broken, and nothing you have built is lost.") as its subtitle. Show at most two fresh cards per talk-through:
   the best fit for what was picked, and "Curiosity works better than shame" only the first time; everything else becomes a
   one-liner on the "You know these already" page, and the full cards live in a lesson. The person who has stopped caring
   reaches "Choose your path" in about eight taps instead of twenty. Medium.
2. **After "I slipped" in SOS, breathe first and decide later.** The first screen after a slip that ends a long run is
   "Your 39-day run: Keep it going / Start fresh" (log.tsx:405 renders before the rk0 embers at 430). At 11 PM, a minute
   after giving in, that is a question about the count, not care. Put the embers and "how does it feel right now" first,
   ask about the run at the end of Rekindle (or at the sunrise check, where the head is clearer), and treat an unanswered
   question as "kept for now" so nothing is lost by closing. The data path (rkKeep) does not change, only the order. Medium.
3. **An eyes-open go-ahead must reach the log even when nobody looks back.** Today, going ahead is written as a slip only
   inside lookBack (talk-log.ts:33-50), and talkDue stops offering the look back after 36 hours (talk.ts:506). A person who
   chooses "Go ahead, with your eyes open", goes ahead, and never taps "Look back" has no slip in their log, no Rekindle, and a
   run that keeps counting. Write a pending marker when the path is chosen, ask about it at the next morning stop, and log the
   slip from there when they say it happened. High (it is log data and runs).
4. **Let the person's own record win the suggestion.** Breathe is never suggested in the first round (sos.ts:232), so the
   40-day person whose Breathe "Worked 15 of 15" is told to try "Name the thought · New for you." Keep the first-round rule
   only for someone with no record; when a tool has two or more wins for this person, suggest it first and say why in their
   numbers. Drop the "New" badge inside SOS (tool-grid.tsx:68; eleven of twelve tools carry it for a 40-day person); keep
   it in Learn. Medium.
5. **Look back on a change plan the next morning, not inside the hard hours.** A plan for "Late tonight" (11 PM) turns into
   "Did your plan hold? / Look back" at 11:20 PM (talk.ts:512), while the plan is to be in bed with the phone away. Ask at the
   later of the next morning and two hours after the moment, and put it on the morning stop. Medium.
6. **Reach a person: the button where the thumb is.** "I sent it" sits at y=1207 on an 844-point screen, below three texts, a
   free-text box, and the 988 and Crisis Text Line cards. Dock "I sent it"; keep the three texts (each already opens
   Messages); put the crisis lines behind a quiet "No one to text?" link that opens them in place. Medium.
7. **Talk it through from SOS should come back to SOS.** The SOS link replaces SOS (sos.tsx:274), so the X on Talk lands on
   Today, the urge is never logged, and Today greets the person with the tip-jar card. Push instead of replace, so the X
   returns to the tools, and hold the one tip ask for a few hours after any SOS or slip. Medium.
8. **Learn from Talk it through the way SOS learns from tools.** Moves whose plan held (talk.a.went false) should be offered
   first on "Meet that need another way", with "Held 3 of 4 times" under them, the way SOS tags its tools. Medium.
9. **Surprise me spins for 2.9 seconds** before the idea can be read (scene.tsx:363-375, fifteen flips slowing down). One
   second is plenty; a person in an urge is staring at the screen for all of it. Low.
10. **Add one line after a night SOS at the morning stop:** "Last night you rode one out at 1:30 AM" (the slip path already
    has the sunrise check; the win has nothing). It is the best moment to ask "What helped?" and offer the note for next
    time, which today is asked at the end of the check-in while the urge is still fresh. Medium.

### 3. Bugs, ranked by harm

1. **Get curious and Play it forward lose what the person picked.** tool/[id].tsx:116 gives the Stage a new key for each
   step, so the tool component is unmounted and remounted and its state resets. Play it forward: SOS, Next, Play it forward,
   tap Ashamed and Empty, Next, Proud, Next: "Giving in: You did not pick anything." (ride.tsx:404-405, state read from memory
   that is only written at step 2). Get curious: pick Chest then Tight; at "Now just watch it" the line "Tight in your chest."
   never appears (ride.tsx:26-28, 120). The whole point of both tools is the person's own words. Fix: key the Stage inside the
   tool, as Move and Halt do, or lift the answers into Tool. Medium.
2. **A go-ahead with no look back leaves no slip** (change 3 above). High.
3. **"Did your plan hold?" inside the hard hours** (change 5). Medium.
4. **"Something that gives you a little a reward."** talk.tsx:599 puts "a little" before the need's own words ("a little a
   break from how I feel"). Use a phrase per need. Low.
5. **"Until then: a real treat: food i love, a game, a show."** talk-card.tsx:33 lowercases the whole move, including "I".
   Lowercase only the first letter. Low.
6. **Two headers saying the same thing.** Name the thought: the frame title "NAME THE THOUGHT" and the eyebrow "Name the
   thought" right under it (ride.tsx:265-267). Looking back: "LOOKING BACK" twice (talk.tsx:984 and 779, 818, 848). Low.
7. **Web console error on leaving SOS:** "Cannot set properties of undefined (setting 'startTime')" in Reanimated's
   unregisterFrameCallback, every time SOS hands off to the check-in or a tool. It comes from useBreathClock (lib/breath.ts:
   60-70: the callback is created with `on` and set active again in an effect, and HorizonSun turns it off in the focus
   cleanup in the same tick as unmount). No visible effect on the web; check it on a phone, where a leaked frame callback
   costs battery. Low.
8. **"You like this" on a tool the person bailed out of twice.** urTags (sos.ts:349) counts picks, not outcomes: the
   10-minute pause was opened and stopped twice in one SOS and came back tagged "You like this". Count only picks that
   ended in "It passed" or a Yes. Low.
9. **A deep link to /sos ends on a blank SOS frame.** When SOS is the first route (a notification or a bookmark), Go to bed,
   Good night, Good night lands on an SOS screen with only the title and an X (sos.tsx:178-183, ur already ended). From
   Today's button it is fine. Low.
10. **Screen reader:** the sun's "Breathe in / Breathe out" and "Breath 1 of 3" are plain text, not a live region, so nothing
    is announced as the breath turns (orb.tsx HorizonSun); "Would you use X again?" is a radiogroup holding two buttons
    (sos.tsx:317-323). Low.
11. **The thumb rule:** Go to bed's note "Tomorrow morning Daybook asks one thing" sits under the main button (scene.tsx:
    309-313); on the SE the SOS tool grid shows four tools above the pinned sheet and scrolls inside 430 points, which is
    fine but tight. Low.

### 4. Word rewrites

| Where                    | Before                                                                                                       | After                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Talk, the need           | What is the part of you that wants it really after?                                                          | What are you really after tonight?                                               |
| Talk, wait until         | Something that gives you a little a reward.                                                                  | A little of that, another way.                                                   |
| Talk, done (wait)        | Decision moved to 9:30 PM.                                                                                   | You decide at 9:30 PM.                                                           |
| Talk, the paths          | All three are honest. The point is to choose, not to drift.                                                  | All three are honest. Choosing is the point.                                     |
| SOS, second screen       | Pick what will help you most in this moment, or start the one below.                                         | Pick one, or start the one below.                                                |
| SOS, suggestion reason   | New for you. Worth a try.                                                                                    | Not tried yet. Two minutes.                                                      |
| What do I need, the link | Something else is true                                                                                       | Pick another need                                                                |
| Go to bed                | Urges are often harder to resist when you are tired. Three things, then a plan for the thoughts.             | Urges are louder when you are tired. Three things, then a plan for the thoughts. |
| Reach a person           | Reaching out is strength, not weakness.                                                                      | Reaching out is strength.                                                        |
| Talk, after going ahead  | It is in your log as a slip: data, not a reset. Nothing you have built is gone, and tomorrow is a fresh day. | It is in your log as a slip: data, not a reset. Nothing you built is gone.       |

Everything else read well at 2 AM: the first SOS screen, "Still here. That is okay.", "A thought is not an order.", the
three paths, "You saw it coming and chose. That is the climb.", the look-back line about wanting and liking, and the
hard-hours card from "11 PM is coming." to "Your hardest hours, held."

### 5. Open questions for the owner

1. **Points on Talk it through.** Making a plan shows "+17 points"; holding it shows a calm move. For someone who has stopped
   caring, a score at that moment can read as a game. Keep the points but show them only on Today afterwards?
2. **The run question's place.** Should "Keep it going / Start fresh" ever be asked at night, or always at the sunrise check,
   with "kept for now" until then? Change 2 assumes the latter.
3. **How much research at the moment.** The cards are good and cited; the question is dose. Two at the moment and the rest
   in a lesson (change 1), or keep all of them and let the person skip?
4. **Talk it through from the first SOS screen.** It is on the second screen only. For "I already have a time and a place",
   should the first screen carry a quiet "Already decided? Talk it through" link, so the tools are not forced on a planned
   slip?
5. **The tip jar right after SOS.** The one ask appeared on Today the moment SOS was closed. A rule like "never within three
   hours of an SOS or a slip" is easy; is it wanted?
6. **Go to bed before setup.** A first-night person at 2 AM with "Very strong" was offered "5-4-3-2-1, then bed". That felt
   right; say so if it is not.

The brief:

```
Review SOS and Talk it through as the person holding the phone at 2 AM: does each screen make a slip less likely and
keep hope alive? Nothing is sacred. Run the web build as five different people, cover the flow (taps and seconds to help),
the words, the questions, what to add, the science, and the bugs with steps to reproduce. Write the report as item 3 in
docs/for-fable.md: verdicts, changes ranked with effort levels, bugs ranked by harm, word rewrites, open questions. Change
no code; commit only the report.
```

Suggested next: Opus at medium for changes 1, 2, 4 to 10 and bugs 1 and 3 to 11; high for change 3 (bug 2).

**Done (October 21, 2026, Opus high):** every change and bug above, with the owner's answers to the open questions: the run
question at the end of Rekindle (kept for now if closed, asked again at the sunrise check); points from Talk it through
show on Today, not on its screens; the tip ask waits 3 hours after any SOS or slip; and a quiet "Already decided? Talk it
through" on the first SOS screen. The research cards are reachable from "Read the research" on Talk it through's short
page; no new lessons. The "stopped caring" path went from 16 taps to 11 (the brief said about 8; the one-liner page and the
"why" page were kept). Open question 6 (Go to bed before setup) was left as it is.
