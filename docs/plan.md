# What is planned next

## After a slip: every way in reaches Rekindle, and the plan names Daybook's own tools (the owner, October 31, 2026; built on branch claude/admiring-williams-999944, which carries claude/rekindle-flow-c29870; not merged until the owner has seen it on the simulator)

The owner: planning a slip and coming back to say it happened skips Rekindle, "the most important" part; the app suggests a ton of
things that have nothing to do with it and never SOS or the journal; and "Next time, what will you do instead?" may not help at all.

**The purpose:** the person leaves believing they are still good, with the next hours and the next hard moment in Daybook's hands.

**What the research supports** (the notes are in the chat; almost all of it is smoking or alcohol, and nothing tests a last screen after a slip):

- Falling confidence and "feeling like giving up" speed up the next lapse (Shiffman 1996; Gwaltney 2005; Kirchner and others 2012). Guilt
  alone does not. So the hope comes before any question, on every path.
- Kindness after a failure raises the effort to improve (Breines and Chen 2012; Adams and Leary 2007). Observed shame predicted relapse (Randles and Tracy 2013).
- The next hours are the risky ones (lab and real-time smoking data; no numbers for porn). Today's last page looks only at a far-off "next time".
- One if-then plan works better than many (Verhoeven 2013), with a replacement and no "I will not" (Adriaanse 2011), from the person's own
  cue. It is lab evidence, and nothing tests a plan made right after a lapse.
- No study shows that "if the urge comes, open SOS" cuts lapses. That part is a judgment: it is one easy move, always the same, that Daybook can bring back and open with a tap.
- Of 170 porn-recovery apps, diaries were the best-rated feature, and only 4% had a panic button (PMC9614626). The quit apps found have a counter and a reset, and no comeback.

**The holes found:**

- The look back asks up to three questions and shows a chart before anything kind, then asks how they feel a second time, and skips the hold. Closing partway writes no slip.
- A new slip in the entry sheet skips the hold. Changing an entry to Slipped there reaches no Rekindle at all.
- A slip logged from Already happened after a go-ahead still gets "Did you go ahead?" on Today later.
- The last page offers five moves, none of them in the app, in the person's lowest moment.
- My plan says the slip plan shows on Today after a slip. Nothing shows it.

**The new flow,** one page per step, and the X keeps what was given:

1. The hold, from every way in: Already happened, SOS, the pause, the entry sheet (new, or changed to Slipped) and the look back.
2. How it feels now, and its answer.
3. After a go-ahead with a number: "You expected 8. What did it really give?", one page, with their own record. "What did it cost?" and the second feelings page go.
4. What was going on just before.
5. **Next time, as a plan already made:** the sentence is the page's heading, "When I feel lonely or low late at night, I will open SOS.", with the SOS button itself big in the middle (a tap opens it) and when Daybook brings it back under it. That is my plan, or Choose another: its own page with the tools that fit that situation (the journal, Reach a person, Breathe, Go to bed, Move), what held before first, and the person's own words.
6. The finish by the fire, "You came back.", with one door for the next hour chosen from how it feels: still pulled, SOS; like giving up, My reasons; ashamed or angry, the journal; late at night, Go to bed. Using it counts as the one small thing.

A plan comes back at its hour as it does today, and now a tap opens its tool. Today's after-a-slip card and the entry sheet offer the same door, with "I did something else".

Picture: docs/rekindle-review/mock-new-pages.png (the mock the owner approved; in the build the plan became the heading, because a heading above a quote said the same thing twice).

**Business:** nothing locked, no ask nearby. It earns by keeping people, and a slip is when they leave. It also teaches SOS as the one reflex, and the journal gets used. Points rules do not change, and nothing earned drops.

**Steps, with the effort each needs:**

- [x] **High.** Core and flow: the look back saves the slip at once and hands to the hold; its Undo puts everything back; a go-ahead is settled once the hold is done, so it is never asked twice; the entry sheet's two paths reach the hold, and changing an entry keeps what it earned. Tests.
- [x] **Medium.** The expected-against-real page, the new last page, Choose another, the finish's door, the Today card, the entry sheet, plans that open their tool. Tools first in Talk it through's moves.
- [x] **Medium.** The words: the slip plan's starting step (with `normSettings`, and the golden fixtures by hand), My plan's stale line, the Sunday story, the faith page's line, and the slip lines of lessons 3, 5, 6 and 32.
- [x] **Low.** docs/design-standards.md ("A slip always reaches the comeback"), the App Store image 03-slip.
- [ ] **Medium.** Web and iOS simulator, light, dark, Reduce Motion; a release build shown to the owner. Not merged before that.

**Also changed while checking it:** the fire on the hold and the finish gives up height on a small phone, so the hold button stays on the screen at 320 by 568 (it had fallen under the fold); a sentence's last word stays with the one before it; Undo of an entry changed to Slipped says only "Changed back.", with no points notice; the entry sheet offers the next-hour door only on today's slip; a plan at its hour sits right under Already happened and Planning a slip?, and the hard-hours line then says "You have your plan."; the fire's glow reaches under the clock with no hard edge.

**Gone for good:** the chart of expected against real, "What did it cost?" and the second feelings page.

**Not checked yet:** VoiceOver and Android. A synced plan with the new `sos` or `journal` move on an older app version reads "do what I planned", since that version does not know those moves.

Left on purpose: what the SOS tools tell a person to do (walk, cold water, phone away: the tool is the app), and the roughly 24 lessons whose "What to do" card names something outside the app and not about a slip (the lessons chat is in those files).

## Lessons that do not look made by AI (the owner, October 30, 2026)

**Where it is:** chosen, not built. Build it on its own branch and show the owner on the simulator before merging. Pictures: `docs/lessons-review/`
(`lesson-combo.png` and `lesson-questions.png` are the choice; `lesson-A.png` and `lesson-C.png` are where it came from).

**What the owner chose:** A and C together, with two cards kept from C.

- One thought at a time, on a sky that goes from night to day as the lesson goes on, with one flame that rises and glides between cards.
- The flame says the key lines in a cream bubble. No small labels and no icon blob. The cover is the flame, the title and Quick or Full. Next stays at the bottom.
- Kept from C: the full sun answer card (dark Next, flame) and the solid violet number card (giant sun yellow number, no sky, no flame, yellow Next).
- Questions: bright pressable answers with a lip, fixed in place. The flame sits between the question and the answers and says the comment. The right answer turns green and the rest go quiet. A wrong pick lets the person try another, and they can move on after any pick.
- At night the journey ends at a warm dawn, not bright day.
- Plan: a palette override through `useTheme`, and an overlay file of short beats per lesson and card, with the original words one tap away as "more". "Behind this" notes stay as they are.

**Open from the same walk:** what happens when the day is finished. Today the card is gone and a few words sit above the line. The owner wants something different.

## The home screen (the owner, October 30, 2026)

**Where it is:** merged to `main`, after the owner saw it on the simulator. The owner chose the "Now" drawing: the warm card and the line on
the left.

**Built:**

- Your day is on the home screen, with the two quiet buttons right under the flame.
- Hard hours are never a card. The next step in them is still the lesson or SOS (the owner: "maybe just let them know"), so the lesson stays
  the big card and one quiet line under it says the hours and offers a plan. The reminders strip is back under the two quiet buttons, and bigger.
- The iPhone uses Apple's own glass tab bar, with SOS in the separate glass circle iOS gives the search tab: the word in the app's letters and
  warm color, never selected, its press opens SOS. The bar never minimizes. Android and the web keep the bar the app draws, with a round SOS and
  a fade above the bar so nothing is cut in half.

- SOS is pushed on purpose: the word fills its circle, and "Feeling an urge? Tap SOS" sits on tinted glass just above it on Today until SOS has
  been opened once, and again around the hard hours (core `sosLead`). It gives way to the reminders strip. iPhone only for now.

**Open:**

- Whether real hard hours notifications should be Time Sensitive, so they get through Focus. That needs an Apple capability on the app.
- The glass bar has not been seen on a real iPhone, or on iOS older than 26, where it looks different.

## No AI slop: every screen reviewed (the owner, October 30, 2026)

**What the owner asked for:** research what separates a well-built app from AI slop, then go through everything and fix it ("nothing's off
limits"), with a review of every single screen, "doesn't mean every screen needs to be changed". The rules are now in
docs/design-standards.md ("The look"), docs/craft-checklist.md, CLAUDE.md and `packages/core/test/craft.test.ts`.

**Result:** 427 screens and steps reviewed, 308 changed, 105 left as they were, 14 read in code only, plus Today and the shared parts. Today
measured 14 font sizes before and 7 after, Pattern 26 pills before and 0 after. Today: the flame in a sky from edge to edge; SOS is the
round button (the big red one on the page went, the owner may correct this); Your day is one line through the day with the squiggle.

**Choices made for the owner, to correct back if wrong:** no points per day in the Pattern list, no tool count on Learn, every earned badge
shows, the if-then plan stays one tap from the Sunday review's end, Add my reasons on the empty reasons page outside SOS, setup no longer
says "no subscription", the reminders strip moved from above the flame to under the two quiet buttons (it keeps its sun color), the
Move tool's seat or feet switch is a quiet link, most lesson reading cards have no icon, and the stamp in Planning a slip? keeps its capitals.

**Open questions (owner decision):**

1. Planning a slip? runs up to 12 steps. Worth one pass together? _Medium._
2. Should today's day page send people to the full-screen check-in, with its form only for past days? _Medium._
3. SOS's More sheet is two columns of tools with a lip; the standard says one column of rows, which makes it twice as long. _Medium._
4. Should a Pattern page have a flame moment (a good week, say)? _Medium._
5. RiskCard's "Hard hours held" and TalkCard's waiting and plan states never draw: show them or remove them? _Medium._

**Known and not fixed:** a note covers the date and part of the flame while it shows; `useFitRoom` (fit.tsx) can over-shrink a picture when a
`Dock` fills the page; a person's Day 1 and the rest of the app were checked on the web with motion off, and only Today on the iPhone build.

## Whole-app analysis: how it connects, how it flows, and whether it helps (October 30, 2026)

**What the owner asked for:** a thorough look at how everything connects and flows, whether the app makes sense, has an
easy flow, and is genuinely positioned to help people. Analysis only, with questions. Nothing is fixed here.

**How it was done:** five Sonnet agents in parallel (the rules engine against CLAUDE.md, the navigation map, the words
and lessons, positioning and the market, the evidence behind each mechanic), while this session walked a fresh install
on the web at 390x844 (setup end to end, lesson 1, an SOS ride, a slip through Rekindle, Planning a slip, Learn, Pattern,
More), ran the story walk (14 of 14 days as expected, after a Playwright Chromium fix on this machine only), and checked
every claim below in the code. `npm run typecheck` and `npm test` pass (3,028 core tests, 121 API).

### The verdict

The bones are right, and better than the market. SOS, Rekindle and setup are the best-built parts: SOS starts doing
something on the first tap, Rekindle's words ("You did something. You are not something.") meet a person where they are,
and setup teaches the wave, a real breath and the slip-as-data idea in about eight minutes. The free side is genuinely
generous next to Quittr, Brainbuddy and Fortify, which lock nearly everything. The hope-first voice holds in the hard
moments.

Three things undermine it, and they are all fixable:

1. **The app asks before it has helped.** In the first ten minutes a new person meets the account ask (setup), the "Do you
   like Daybook so far?" rating ask (setup end), the Support button (top right of the very first Today), and then, after
   lesson 1, the first badge sheet carries "You earned that. A tip of $5 or more unlocks…". The tip card waits a week
   (`TIP_FIRST = 7`), but the badge and level lines (`tipMoment`) and the Support button (`tipButton`) have no such gate
   (core `support.ts`). A person who has quit many times and feels ashamed is being sold to before the app has helped once.
2. **Two progress systems run side by side, and the old one still resets.** The hero shows "days that hold" (no-slip days
   in a window, which never drops to zero). Under it the old run ledger (`runLedger`, core.js) still zeroes a run on an
   unsaved slip, and its words leak into the comeback: "Run saved. You came back." (seen in the story walk), "Keep
   counting from N, or start fresh?" (sunrise), "A second slip within a week cannot be saved, so a new run starts
   tomorrow" (rekindle.ts). The website promises "89 good days, one slip, all 89 kept". Both cannot be the message.
3. **The flame grows for using the app, not for the spine.** Points come mostly from logging and check-ins. The story's
   made-up person is level 14 (Campfire) with 0 of 45 lessons done. The daily lesson is gated at lesson 4 behind an
   account that earns nothing (only a tip opens sync), so the spine is the one thing a free person loses on day 4.

### What holds up (keep it)

- Setup: 30 pages on the web, every question skippable, the Brief Pornography Screen with a warm reply, the wave page, a
  real 30-second breath, "a slip is data" shown as a chart, and a hold-to-commit review. It ends knowing the plan.
- SOS: breath first, one move at a time, "It passed" always one tap away, the More sheet only if wanted, "I slipped" at
  the bottom of it, and the ending ("You rode it out", +15, what helped, what set it off) is warm.
- Rekindle: the hold, "This is a slip, and you can recover from it. Level 3, 50 points and 1 urge ridden out: all still
  yours", the feeling after with a kind answer each, the situation, one if-then plan. The honest-log badge comes in quiet.
- Today after a slip: the hero keeps the days ("Tonight is logged. Your 7 days stay yours."), the care card sits under
  SOS, every ask is off. The morning after looks like a calm day with one fewer day in the window. That is hope first.
- The words: almost no contractions or hedges anywhere, no "addict" as a label, and the best lines are very good.
- Talk it through: the three honest paths, with the research one tap away.

### The findings, ranked by how much they hurt a real person

Each carries the Opus effort it needs. **Owner decision** marks a choice that is the owner's.

**A. Trust and hope**

1. **Three asks in the first ten minutes** (above). Proposed: give `tipMoment` and `tipButton` the same week gate as the
   card; move "Do you like Daybook so far?" to the first comeback or the first week, not the end of setup; drop the tip
   bullet from the account page. **Owner decision:** the account ask at setup end stays (your rule); the rest. _Medium._
2. **The run ledger contradicts the promise.** Proposed: retire the run as a visible thing. Keep the days that hold as
   the only measure on Today, Journal and My numbers; remove "Run saved", "start fresh", "cannot be saved" and the
   Journal's "Next run starts tomorrow"; keep `longest` as a quiet Milestones fact. The comeback card then says only "You
   came back: N comebacks." **Owner decision**, since you chose keep-or-fresh on October 22. _High (counting)._
3. **Hours since the slip as the biggest number on Today** for 72 hours after a short-run slip, counting up from "Under
   an hour" (hero.ts). Your October 21 call, but it is a count that starts at zero on the screen that promises none.
   Proposed: the days that hold stay the number; hours become the chip. **Owner decision.** _Medium._
4. **The second slip gets the coldest path, and the evidence says it is the dangerous one.** Kirchner, Shiffman and
   Wileyto (2012, about 1,000 real-time lapses): the reaction to the first lapse did not predict relapse; falling
   confidence after repeated lapses did. Today a second slip within 7 days "cannot be saved", zeroes the run, and gets the
   same four pages. Proposed: the second slip in a week gets the most care, not the least: a shorter Rekindle, a line
   that names it ("Two in a week is where most people give up. You are still here."), and a plain door to a person (the
   safe person's text, 988 where it fits, and the "What therapy is like" lesson). _Medium, high where the run changes._
5. **The public pages break the owner's own rules.** `apps/mobile/public/llms.txt:44` still links the GitHub repository
   ("Never link to the code"; the October 23 commit took it off the pages but not this file). `about.html` says "Coming
   soon to the App Store" twice while docs/launch.md says 1.1.0 is live. `support.html` says the lessons are free;
   `about.html` says "No account needed" and "Never locks care behind a paywall"; the app locks lesson 4 behind an
   account. A brand that sells honesty loses more from one visible contradiction than a normal app would. _Low._
6. **Faith: setup says the answer "only changes which lessons come up", and nothing reads it.** `lessonPath()` has no
   filter; the flag only marks the four God lessons, which sit in everyone's path at about day 17. Proposed: filter them
   by the answer (and offer them in Learn), or change the sentence. _Medium._

**B. Flow**

7. **Rekindle has no SOS door** (log.tsx passes no top-right pill, unlike talk.tsx and setup.tsx). Right after a slip the
   urge is often not done; the only way to SOS is the "Still pulled" answer two pages in, which `router.replace`s
   Rekindle away, so the situation and the plan for next time are skipped and that SOS ends on a celebration. Proposed:
   the SOS pill in Rekindle's bar, and "Still pulled" pushes SOS over Rekindle instead of replacing it. _Medium._
8. **Two slip paths never reach Rekindle:** a slip added in the entry sheet (from a day page) and the slips counted on
   Welcome back. Proposed: the entry sheet's slip goes on to the feeling step, no hold; Welcome back stays as it is but
   offers "Talk through the last one". _Medium._
9. **Every open starts with something to dismiss.** In the story's 14 days, 11 opened on a level-up or badge sheet and 9
   closed the "How are you feeling today?" pop. Levels arrive every day or two (60 levels), so "Level up" stops meaning
   anything by week two. Proposed: celebrations only for a new form, a badge, or a comeback; levels inside the bar on
   the hero, no sheet; the day-feel pop only on days with no sheet. _Medium (high where points or levels change)._
10. **The lesson band and Your day duplicate the same stop with the same button** (both from `openTile`). The Fable
    review of October 22 asked for one owner of "next"; two Start buttons remain. _Medium._
11. **The thumb rule in SOS:** "It passed" and More are 36-point circles in the top bar, and "Which thought is loudest?"
    puts its seven chips in the top half with the bottom empty. Proposed: "It passed" as the Dock's main button, the
    thought chips low. **Owner decision** (the SOS passes of October 24 set the bar). _Medium._
12. **Compact Today on nearly every iPhone.** `ROOM_FULL = 832` points; a notched 390x844 iPhone has about 750 to 770, so
    the full layout is only for Pro Max and tablets. The pull-to-journal hint is then never seen; the journal is found
    only from More. _Low to decide, medium to change._
13. **Celebrations never show on the Pattern tab** (`TABS` in celebrate.tsx has no `pattern`), and can show over the
    journal. _Low._
14. **Small things seen on the walk:** the lesson's guess and check can be passed with Next and Finish without an answer
    (so the "one check" is not one); the rode-out page's "What helped?" chips are generic and do not name the SOS moves
    just used; the setup's screens-off page does not show on the web and the review says "Screens off 11:00 PM" as if
    chosen; the "Quit, starting tomorrow" goal gives two Day 1s on the first Today ("TRACKING Day 1" and "Day 1: Oct
    31"); two React DOM warnings in development (`transform-origin` in rekindle.tsx, hearth.tsx, flame.tsx, big-flame.tsx;
    `collapsable` on the talk research page). _Low._

**C. Content and the science**

15. **Lessons that are missing for this audience:** what recovery feels like and when it gets easier (the flat, low-drive
    weeks that read as "I am broken"); partners, and a partner who found out; sexuality after porn; what to do at day 30,
    60, 90 and after (complacency, "I can test myself"). The identity lessons (34 to 37) and the tool lessons (21 to 28)
    come weeks after the person needs them. Lessons 25 to 28 lean on cigarettes, chocolate and calories; about 20 of 45
    proof cards are smokers, dieters or students. The strongest five are 3, 9, 10, 5 and 6; the weakest are 42 to 45
    (programs, alcohol evidence) and 39. Proposed: four new lessons (above), identity moved into week 2, tools into
    week 2 to 3. _Medium (words), and the owner's rule that lessons inspire hope leads._
16. **What the evidence supports most, and the app under-uses:** if-then plans (d about .3 to .65, Gollwitzer and
    Sheeran; Sheeran 2025) are the best-supported thing here, and they are made once and rarely rehearsed. Proposed: the
    hard-hours card and the Sunday review ask the person to say their plan once. A validated measure: the five-question
    screen is already in setup; re-ask it every 30 days and show the score falling, since the trials count reduction as
    success (74% cut use by 70% or more in Crosby and Twohig 2016; only 35% stopped). Practice one calm-state strategy
    daily rather than rotating eight moves (Lopez, Ochsner and Kober 2022). _Medium._
17. **What the evidence does not support or warns about:** points and 60 levels (small, fading effects); "clean" as the
    identity word (Grubbs: moral conflict and self-labeling drive distress apart from use; the app uses "clean" six
    times); a 12x12 feelings grid at the moment of an urge (a design cost, not an evidence point); daily lessons as a
    treatment (they are an engagement habit; the "Put it to work" step is what carries weight). The no-reset window is
    untested but consistent with the habit and lapse data; it is the app's most original idea.
18. **Words that break the voice** (counts from grep): "for now" 12 times in user-facing text; "clean" 6; "Streak 5" and
    "A new best" inside the Fit the shapes tool during an urge; the nudge mascot voice ("Brain snack time 🍪", "Hey, it
    is me again 🔥", "Level N and climbing 📈"); "Unlock the extras" and "Grow with it" tie a purchase to growth; "not a
    reset" is now the most repeated phrase about the thing it denies (20 times). Two contractions, both in the texts to a
    safe person (core.js:195-196). _Low._

**D. Positioning and money** (the market agent's figures carry sources in its report; the verdict is mine)

19. **"The quit app that does not reset" is not unique** (Reset Ladder and Relay claim it; Reframe and I Am Sober show a
    counter). What is rare is the combination: free care, local-first privacy, a non-resetting measure, a mascot and a
    lesson spine. The headline ("Quit porn without shame") is the generic part; the "0 versus 89" graphic below the fold
    is the real pitch. Proposed: lead with the contrast in words ("Keep your 89 days after one slip") and keep "without
    shame" as the second line. _Low._
20. **The tip jar can cover costs, not a livelihood,** unless Daybook reaches tens of thousands of downloads a month: at
    0.5% to 2% paying an average of $8 after Apple's 15%, each 1,000 downloads yields about $35 to $135, once. The
    category's lifetime prices run $50 to $200, so people here do pay more than $5 once. **Owner decision**, since
    products need your yes: a single clear product (the pattern, previewed from the person's own log), monthly $2.99
    or lifetime about $20 to $30, with the $5 tip kept as the starter. _High (payments)._
21. **The account gate earns nothing and costs the spine.** The account is free; only the tip opens sync. The lock on
    lesson 4 adds friction on day 4, creates email-linked health data, and produces no revenue, while the person is
    asked three ways (setup, the Today card, the lock). **Owner decision:** keep the account for sync only and let the
    tip be the one ask, or move the gate to lesson 8 (after the first week). _Medium._
22. **The count modes are six concepts for one question** (strict, gentle, step down, switch for me, tracking week, Day
    1), never asked of a new person, and More says "How I count days: Strict", which sounds like a test. The Settings
    help still says "finish the Rekindle quest". Proposed: hide the modes until a rough patch, rename strict to
    "A day counts with no slip", and rewrite the help. _Medium._

### Questions for the owner (each with a recommendation)

1. Retire the run ledger as a visible thing, so the days that hold are the only measure? **I would.** It is the one place
   the app contradicts its promise, and the hero already does the right thing.
2. Keep hours-since-slip as the hero number for 72 hours (your October 21 call), or make it the chip? **The chip.**
3. Gate every tip line and the Support button behind the first week, as the card already is, and move the rating ask to
   the first comeback? **Yes, all three.**
4. The account gate on lesson 4: keep, move to lesson 8, or account for sync only? **Account for sync only.** If the
   gate must stay, lesson 8.
5. Give the second slip in a week the most care and a door to a person? **Yes.** This is the strongest evidence in the
   whole review.
6. Filter the faith lessons by the setup answer? **Yes.** Otherwise the sentence in setup is untrue.
7. Add the four missing lessons and move identity to week 2? **Yes**, four lessons, in your voice.
8. Re-ask the five-question screen every 30 days and show the score falling? **Yes.** It is the measure the trials use,
   and it lets someone at "much less" see a win.
9. Products: one clear paid thing beyond the tip? **Your call before any work.** My pick is the pattern, previewed from
   the person's own log, at a monthly $2.99 or a lifetime $19.99 to $29.99.
10. Fix the public pages now (the code link in llms.txt, "Coming soon", the lesson claims)? **Yes, today.** It is low
    effort and the code link breaks a standing rule.

**The owner's decisions (October 30, 2026):**

- 1 (the run ledger): refactor it, but the counting modes keep their meaning, because people can switch. On strict, a
  slip puts the count to 0 (the person chose strict). On gentle, a slip is forgiven (one day off, never to zero). Step
  down stays hours since the slip and the best stretch. One count per mode, shown the same everywhere (Today, Journal, My
  numbers, Milestones, the comeback words); the keep-or-fresh question and the three-day rescue go, since the mode decides.
- 2 (hours since the slip): the days stay the big number; the hours become the chip under it.
- How the work runs (the owner, October 30): separate sessions, one per effort level, all at once, each on its own branch.
  Fable only where it buys a better result; here Opus does high and medium, Sonnet does low.
- 3: the tip lines on badges and levels wait for the first week, as the card does. The Support button stays from day 1,
  and the rating ask stays at the end of setup (the owner: asking at first download is common procedure).
- 4: the account gate moves from lesson 4 to lesson 8.
- 5: yes, the second slip in a week gets the most care and a door to a person.
- 6: yes, filter the faith lessons by the setup answer. The owner believes in faith and God as part of the process and
  plans more about Jesus later, so for a person who said yes the faith lessons stay first-class, and the filter only keeps
  them out of the path of someone who said no.
- 7: yes, the four missing lessons, and identity moved into week 2.
  Done October 30: lessons l46 (what getting free feels like, lesson 5), l47 and l48 (partners and sex after porn, closing
  Shame and kindness) and l49 (day 30, 60, 90 and after, last on the path). The first week is How it works and Why it is
  hard to stop; identity is lessons 10 to 13; the tools 14 to 21; faith moved from 17 to 22, and Shame and kindness from 9
  to 26. Finished lessons stay finished for people mid-path. **Not said because it is not known:** a figure for how long a
  flat stretch or low desire lasts, or for how long trust takes.
- 8: yes, the five-question screen again every 30 days, with the score shown falling.
- 9: yes to one clear paid product beyond the tip (the pattern, previewed from the person's own log; the prices the owner settled on are below).
- 10: yes, fix the public pages.

**Daybook Pattern, decision 9 in detail (the owner, October 30, 2026: "Yes, all your picks"). Built on branch
claude/high-product-087e62, off until `PATTERN_FROM` is set.** Why it moved the deep pattern: a $5 tip opened the whole pattern
for good, so a pattern product had nothing to sell. It helps the person (a monthly read of what is changing, in their own
numbers) and it helps Daybook earn (a tip covers costs, not a livelihood, finding 20).

- Products (the owner changed the prices the same day): monthly $3, lifetime $10 (the marked pick), or $30 to give more, plus a quiet
  $5 tip. Lifetime is simply a tip of $10 or more: the live Generous product is the $10, Amazing moves from $20 to $30, and the same
  rule reads the web payments, so the only new product is the monthly plan. One screen holds all of it. Why not separate products:
  a $10 tip that opened less than a $10 lifetime would have no reason to exist. The cost, said to the owner: at $10, four months of
  the monthly plan costs more than lifetime, so expect most people to take lifetime and treat monthly as the low-commitment way in.
- What opens what: free keeps every care tool, the one look, the slip gaps and My numbers. A $5 tip from launch on opens sync and
  the safe copy. Daybook Pattern opens the deep pages (when, what sets it off, hard days, what helps), What changed this month,
  and sync. Tips from before launch keep everything, including the month read, and are never asked.
- The ask: one card on the locked section and one row on More, led by a true line from the log; no line, no ask. Not in the
  TIP_CALM days after a slip or TIP_QUIET hours after an SOS, then the card is a kind word with no price. Tips and their
  moments are unchanged.
- Web: lifetime only, for now. Lapse: three grace days, then the tip rules; finished month reads stay; sync stops saving and
  says so. What the owner sets up: docs/launch.md, section 7b.
- Two things the tests caught, kept as rules: an account on Daybook Pattern is never read as grandfathered from its data, and
  between two paid tips a lifetime one wins, else the earlier one, so what a person holds never shrinks (core `tipBetter`).
- **Next (high, when the owner has set up the products):** turn it on, as docs/launch.md 7b step 6 says, then the sandbox list in
  step 8. Refunds on the monthly plan rely on the date running out, as tips do; a webhook could be added if refunds become common.

**Built (findings 2 and 3, decisions 1 and 2, October 30):** one count per mode (core `hero.ts`, `view.ts`, `journal.ts`,
`miles.ts`). Strict: days in a row, 0 on the day of a slip. Gentle: the days that hold (`todayMeasure`). Step down: unchanged.
The chip under the number holds the hours since a slip, for 72 hours. Gone: `app/sunrise.tsx`, `app/deeper.tsx`, the run
question, the rescue, the run-ended card and the words. Migration: `st.countFrom` is stamped on the first open of this version
(`keepCounts`), and slips up to it keep the old rule in `runLedger`; `seen.longest` is a floor so a switch of mode never lowers
the longest run. New people start on gentle (the owner's decision the same day), and step down never lands on strict by
itself; people already on strict stay there.

**Done on October 30, 2026 (asks, gates and doors, medium):** findings 1 (tip lines only), 21 (lesson 8), 6, 7, 8 (the entry sheet; Welcome back not changed), 4 (the medium part), 9, 10, 16 (the 30-day screen and the Sunday review; the hard-hours card not changed) and 22 (words only). A plain level and a full ring are a toast; the five questions say "in the last 30 days", where the setup says six months, so the score can move.

**Suggested order:** 5 (pages), 1 and 3 (asks), 7 (the SOS door in Rekindle), then 2 and 4 (the run and the second slip)
once the owner decides, then 9 and 10 (one owner of "next", fewer sheets), then 15 and 16 (lessons and the measure).

**Not checked:** the iPhone build, haptics and notifications; a real sign-in, sync and payment; dark mode and Reduce
Motion on this pass; the 375x667 size (the October 27 audit covered it).

## The feelings grid, its own look (the owner, October 29, 2026; on branch feelings-own-look, not merged)

The feeling chart itself (energy one way, pleasantness the other, four corners) is the Mood Meter's, a well-known chart
anyone can use. The look of today's picker (a pannable field of bubbles that swell under the thumb and morph into
shapes) is How We Feel's signature, and the owner wants the grid to lead the SOS marketing, so it gets Daybook's own look
first (Apple's guideline 4.1, copycats, and the comments a copied look would draw). Fifteen directions are drawn in
`docs/feelings-review` (`all.png` is the sheet); the owner picks, then the chosen one is built on this branch and shown
on the simulator before anything merges.

1. Ember field: embers on a night sky; the one under the thumb flares into a little flame.
2. Sparks from the fire: feelings rise as sparks from the hearth; higher is more energy.
3. Move the sun: the SOS sun is the picker; raise it for energy, slide it from storm to clear sky.
4. Inner weather: storms, sun, rain and a quiet moon, sized by strength.
5. The flame shows it: the mascot takes the feeling's color and shape from one pad under the thumb.
6. Constellations: four constellations (The Storm, The Spark, The Fog, The Hearth); a star lights and says its name.
7. Lanterns: rows of paper lanterns; the one you stop on lights up.
8. Only words: the chart is made of the words, the one under the thumb big.
9. Two slides, then a word: energy, then pleasant, then four word chips. Close to Apple's State of Mind.
10. Four doors, then a word: Wound up, Lit up, Weighed down, Settled; then six words.
11. The dial: a thumb dial round the flame. Feeling wheels are everywhere, so it is common, not ours.
12. The sea: wave height is energy, the water's color is pleasantness.
13. A map of feelings: a small land like the lesson map; feelings are places.
14. Swipe the card: one big card, swiped toward how you feel. Close to Moodnotes' swiped face.
15. One color field: a soft gradient and a loupe. Nearest to How We Feel's colored canvas.

What the research says (a research agent, October 29): naming a feeling calms the body even with one quick word (Lieberman
2007); finer words predict fewer lapses after treatment, and the skill grows with practice; under stress, a coarse first
choice (about four) and then nine to twelve words beats 144 at once.

**The owner's decision (October 29): the grid stays.** None of the fifteen beat it. What can change is the shape a
feeling takes, how the grid starts, and the lighting; the next round looks only at those, inside today's grid.

Round two, on the real grid (`docs/feelings-review/round2`, one row picture per question, each led by today's look):

- A, the shape a feeling grows into: A0 today's shape families; A1 every feeling becomes the flame in its own color;
  A2 a fire for each corner (crackling, tall, low, a glowing coal); A3 the mascot itself, with a face that matches.
- B, how it starts: B0 today's four jelly circles; B1 four fires; B2 the four colors around the flame, the grid pouring
  out of it; B3 from SOS, the sun just breathed with split into four quarters.
- C, the lighting: C0 today's flat bubbles; C1 firelight (the middle lights its neighbors, the far ones sink into the
  night); C2 each bubble lit from within; C3 the sky glowing from below in the color being rolled over.

Recommendation: A2, B2, C1. A fire for each corner keeps a shape per kind of feeling (the meaning the shape families give
today) while every shape is Daybook's; the grid pouring out of the flame puts the heart of the app at the start; firelight
is the most alive and makes the roll feel like carrying a light. Effort: medium.

**The owner's decision on round two (October 29): the grid does not change, except to try squares in place of circles;
the first screen ("Where is the feeling sitting?") becomes B3, the SOS sun in four parts, with today's wandering twins
behind.** Round three (`docs/feelings-review/round3`) draws that: S1 four quarters, S2 one sun with whole-sun twins, S3
soft quarters, S4 with turning rays; T1 the gold core kept with the colors as a ring, T2 ring and rays, T3 big and low, T4
soft with more glow; G1 to G3 the grid with circles (today), rounded squares and squircles.

## Whole-app UX audit: five people walked start to finish (October 27, 2026)

**Done (October 27, 2026; the owner: "do it all", at high effort, owner decisions as recommended).** Every finding below
is fixed on `main`, with these left as they are:

- 20, Goodnight at 8:32 PM ticking the wind-down: intended (core `offOnTime`, tested).
- 14, the night of a slip: the "After a slip" card still puts the SOS card below the fold. The round SOS tab stays in reach.
- 8, the lesson end: the flame shrinks to about 84 px on a 390x844 page to keep the answer and the button in reach.

**Since fixed (October 29, 2026):** 14 and the night of a slip. On Today, SOS and its two buttons end above the tab bar at
390x844 and 375x667 on an ordinary day and the day of a slip (that day the "After a slip" card sits just under SOS), and
setup's Hold to commit is on screen at 375x667.

Not checked, as before: the iPhone build and haptics, a real sign-in and sync, and a real Stripe payment.

**What the owner asked for:** walk the web app as five people (a new person through setup, the first Today and lesson;
an urge in SOS that passes and one that does not; Planning a slip; Already happened on day 3 and after a 40-day run;
someone back after two weeks, with and without an account), plus More, the plan, badges and levels and the account ask.
Look for bugs, for how SOS, Planning a slip and Already happened hand off to each other, for whether every screen
serves the one goal, and for whether setup teaches what the person meets after it. Audit only: the owner picks what to fix.

**How it was walked:** four walkers drove a web build of `main` at 5c8c7c7 (sync pointed at a dead address, so the
account screens show but cannot finish) in Chromium at 390x844, 375x667, dark and Reduce Motion, with the clock set to
the person's hour in America/Chicago. About 650 pictures. I judged the worst ones by eye and checked each claim below in
the code. No page errors in any walk.

**What holds up:** the SOS ride is strong (Breathe first, one move at a time, "It passed" always in reach, every tool
one tap away). Rekindle after a slip is warm and complete (the hold, the feeling before, how it feels now, a plan for
next time, "Still pulled toward it" leads straight back into SOS). Setup's second act teaches exactly what SOS does
(the wave, then a real 30-second breath), and its slip page sets up Rekindle. Undo after a mistaken slip from SOS
reopens SOS. Nothing in any walk shamed the person.

**The handoff map, today** (a picture went to the owner in chat):

```
              Today: SOS · Already happened · Planning a slip?
        (first open of the day: "How are you feeling today?" covers all three, at any hour)
          │                        │                              │
          ▼                        ▼                              ▼
   SOS (the ride)  ──day only──▶  Planning a slip?             Already happened
   ⋯ More: tools,                 three paths:                  rode it out → trigger → done → 3 pop-ups
   I slipped ───────────────────────────────────────────────▶  slipped → Rekindle → plan for next time
   It passed → celebration  ◀──  ✕ no way to SOS              "Still pulled toward it" → Open SOS
          ▲                       go ahead → slip logged ──✕──▶ (never gets Rekindle: ends on a chart)
          └────────────────────────────────────────────────── Undo a slip → SOS again
```

Dead ends: none trap a person. The gaps are missing doors (Planning a slip has no SOS; SOS at night has no Talk it
through), two endings that skip the comeback, and three different "it passed" endings.

**Does setup teach what comes after?** Mostly. It teaches the wave, a breath, the slip as data, the plan and the day's
three stops. It never shows the two buttons under SOS (Already happened, Planning a slip?), the flame growing, or
the morning after a slip, which are the parts a person meets first on a hard day. It is still concise for what it does
(34 pages on the web, about 43 taps, a dozen of them one-tap answers, about 8 minutes): fix this by adding to existing
pages, not by adding pages.

### The findings, ranked by how much they hurt a real person

Each is marked with the effort it needs. **Owner decision** marks a choice that is the owner's to make.

**A. Hurts hope, or stands between a person and help**

1. **At 11 PM with an urge, the first thing the app shows is "How are you feeling today?"** It opens on the first
   open of every day, at any hour (`dayFeelDue` in core `day-feel.ts`, opened from `(tabs)/index.tsx`), and covers
   SOS. One tap closes it, but that is the worst moment to ask for one. Proposed: never open it by itself in the
   person's hard hours or after the wind-down starts, and give the sheet an SOS chip, as setup has. _Medium._
2. **Back after two weeks away, a day-31 person sees "QUITTING Day 1 is today"** until they answer the gap question
   (More says "day 31" at the same time). It reads as a reset, the one thing the app promises never happens. While the
   gap is unanswered, the hero should keep the last known measure ("30 of 90 toward graduation") with the "14 days not
   known yet" row under it. _High (counting and what was earned)._
3. **Day 40 slip: the words make the run sound like a loan.** "Your 39-day run is kept for now." "Coming back saves
   it… by Friday night." "Your 39-day run waits for you." Keep or start fresh was the owner's decision (October 22, kept
   as is); only the words are in question. Proposed: lead with what is permanent and make the quest a way to keep
   counting, never a rescue: "Your 39 days are yours for good. Ride out one urge or have one day with no slip by
   Friday, and the count goes on from 39." Remove "for now" everywhere (`rkEmbers`, `rkLightLine`, `srEnd`, the sunrise
   card). The Rekindle hold also tells a 39-day person "It is down to embers", which is too low for a long run. **Owner
   decision:** the words. _Medium._
4. **Planning a slip has no door to SOS, and SOS at night has no door to Planning a slip.** Someone talking it through
   can be mid-urge, and nothing on any Talk page leads to SOS. SOS's More sheet swaps "Talk it through" for "Go to bed"
   after dark (`app/sos.tsx`, the `big` list), which is exactly when a slip gets planned. Proposed: the SOS chip in the
   Talk header (as setup has), and Talk it through as a row in SOS's More at every hour. _Medium._
5. **"Go ahead, with your eyes open" never reaches the comeback.** It logs a slip and the look-back ends on a bar chart
   and "It is in your log as a slip". No flame, no "how do you feel now", no plan for next time: the warm half of
   Rekindle is skipped. Proposed: after the look-back's last page, go on into Rekindle's comeback at the feeling step
   (the hold is not needed: the slip is already saved). _Medium._
6. **"NO SLIP 7 of the last 7 days" in big letters right after logging a slip.** It is by design (today counts once
   it ends, and a run of 7 days or more keeps its measure), but read straight after a slip it looks broken or dishonest.
   Proposed: the same number with a quiet line under it, such as "Tonight is logged. Your 7 days stay yours." _Medium (words on the hero)._
7. **Celebrations pile up and mix with asks.**
   - After the first lesson and check-in, four sheets come in a row (First step, First lesson, Level up, Checked in).
   - After "Welcome back", a badge carries a tip ask, then the feeling sheet, then an account card.
   - Undo of a slip still gives the "Honest log" badge, straight after "Removed. Nothing was saved."
   - A slip's points reach a new level, but the level-up shows only the next morning.

   Proposed: one celebration at a time, joined into one sheet when several are due. No asks inside a celebration on a
   day the person came back. Fix the Undo badge. _Medium (the Undo badge and levels: high, since it touches what was earned)._

8. **The flame is small on the first Today.** A new person's Spark is a ~60 px dot in a ring inside a 360 px sky; it
   is also a dim thumbnail on the review page and small on the lesson end. CLAUDE.md: "the flame stays big and alive on
   Today." The early forms can be small flames and still be drawn big. **Owner decision:** draw every form at the same
   size on Today, with the growth shown by the form, not the size? _Medium._

**B. Breaks the flow or the thumb rule**

9. **SOS celebration: the only button, Done, is under the bottom edge** (y 842–888 on an 844 px screen; off-screen on
   a small phone), and the page scrolls sideways a little (the confetti, 417 px wide on 390). Put Done in the Dock. _Medium._
10. **No "How is it now?" after a tool in SOS.** The ride replaced it, but `useFinishTool` still sets `step: 'after'`,
    which nothing reads, and docs/design-standards.md still promises it. The X on a tool goes back to the ride, not to
    the tool list. **Owner decision:** keep the ride as the answer (and update the standards and remove the dead step),
    or bring back one quiet question after a tool ("Better" / "Still strong", where Still strong opens the tool list).
    I would bring it back: it is the moment the person notices the urge shrinking. _Medium._
11. **Three different "it passed" endings.** The ride's "It passed" gives the big celebration. The 10-minute pause's
    "It passed" goes to a plain log page ("Saved · Rode it out", "What set it off?"). Already happened, "I rode it
    out" gives a form and then three pop-ups. One urge ridden out should feel the same everywhere: the celebration page. _Medium._
12. **"It waits on Today" is not true for a changed plan.** After "Change the plan", Today shows nothing of it. A
    decide-later shows only when its time comes. Show the plan, quietly, under SOS until its moment has passed. _Medium._
13. **"Did your plan hold?" comes the next morning,** before the plan's moment (late at night) has come round again.
    Ask after the next time its moment passes. _Medium._
14. **Small phone (375x667):**
    - On Today, the SOS card is cut in half by the tab bar, and Already happened and Planning a slip? are below the fold.
    - In setup, the review page's "Hold to commit" needs a scroll (known since October 26).

    _Medium._

15. **Learn: a lesson's card opens behind the tab bar,** cut off (lesson 4 on the map). _Medium._
16. **Milestones opens blank for 2 to 7 seconds** the first time from More, with no spinner. It may be the test
    machine; check on the iPhone. _Low to check, medium to fix._

**C. Small bugs and words** (_low_, unless marked)

17. Chart and dial labels draw in a serif font on the web (setup's minutes dial, curve, tries and slip pages): the SVG
    text has no font family.
18. Words and numbers:
    - Typo in a Talk research card: "Calm you guesses low."
    - Pattern says "16 clean days" and "Current run 17 days" on the same page.
    - The account error says "Your log is safe on this phone" on the web too.
    - The old error stays after "Back to sign in".
    - Today's check-in row leaves out urges ("Mood 6 · Stress 7").
19. Layout:
    - Setup's screens-off times wrap onto two lines ("9:30 / PM").
    - In dark mode, the hours page's "You guessed" bar almost disappears.
    - "Hold to commit" has low contrast while it fills.
    - Toasts sit over the date and the Support button.
    - The check-in's "More about today" fold pushes Goodnight off the screen.
    - The feelings field's title sits over the bubbles.
20. Small behaviors:
    - The "When did it happen?" day strip offers days before the person started.
    - "Ashamed" quietly sets a slip's trigger to stress.
    - Goodnight at 8:32 PM ticks the wind-down when screens-off is 11:00 PM (possibly intended).
21. On the web, a tip opens Stripe in the same tab, so the person leaves Daybook. Open it in a new tab. _Medium (payments)._
22. **The docs have drifted from the app** (the owner's own files, so the owner's call):
    - CLAUDE.md says "A tip never unlocks anything" and "An account opens sync, a safe copy". Since October 23 a tip of
      $5 opens sync, the safe copy and the full pattern (core `supporter.ts`). Every screen follows the new rule, so
      CLAUDE.md is what is out of date.
    - docs/design-standards.md describes "How is it now?" and the tool list (see 10).

**Not checked** (web only):

- The iPhone build, haptics, notifications and the keyboard.
- A real sign-in, sync, and coming back with an account (the account screens were walked up to the failure).
- Every lesson past the first.
- The reminder page in setup, which does not show on the web.

**Suggested order:** 1, 2, 4 and 9 first (a person in trouble meets them). Then the words in 3 and 6, once the owner
picks them. Then 5, 7, 10 and 11 together, as "one ending for each kind of moment". Then the rest. Effort: 2 and the
earned parts of 7 are high; 21 is medium; the rest is medium or low.

## Premium experience: the unglamorous states, one journey, failures that build trust (October 26, 2026)

**What the owner asked for:** check the whole app against three principles from a video on premium apps. (1) The
person always knows what is happening (loading, saving, syncing, empty, offline), can undo a mistake, and is led
through an error to a next step. (2) The app is one journey: errors, confirms, toasts, spinners, empty states, the X
and the words match everywhere. (3) The scariest moments (a tip that fails, a restore that finds nothing, a sync
failure, an expired sign-in, deleting the account) are designed so well that they build trust: a calm message, what
happened, what is safe, and a way to reach a person (`SUPPORT_EMAIL`).

**How it was found:** five read-only sweeps (system states, undo and confirms, payments, sync and accounts, shared UI),
with the claims that could lose a log or a tip checked by hand in the code.

**What already holds up:** there is not one system alert in the app (every confirm is the inline `dangerSoft` box with
"Keep it"); every toast goes through one `say()`; every network call stops after 20 seconds; Cognito errors are in
plain words; a tip is kept on the phone before the server answers; level and badges have a floor in `seen`; an erased
account keeps a copy for 7 days; and the sweep found no contractions and no shame words.

**Why it matters for Daybook as a business:** a tip that fails quietly or a restore that says "no tip found" is how a
supporter becomes a one-star review; the same moment answered well is how they become the person who tips again.
And a person who loses a week of honest logs to a sync quirk loses hope, which is the one thing the app protects.

**The gaps, ranked.** Each is marked with the effort level it needs.

High (sync, accounts, payments, anything that can lose what a person logged, earned or paid for):

1. **Two phones, one day: entries vanish.** A day is one record and the newer copy replaces it whole
   (`mergeRemote` in core `sync.ts`, `putIfNewer` in the API store). An urge logged offline on one phone and a slip on
   the other the same day: one of them is gone from both, and nobody is told. Settings merge the same way, so lesson
   marks and notes can go too; `keepEarned` runs only at the first join. Fix on the device side: when both sides
   changed a day, join the events by id, keep the newer check-in, stamp it newer and send it back; run `keepEarned` on
   every settings merge. **Owner decision:** an entry deleted on one phone that the other still has. Proposed: the day
   keeps the ids of deleted entries, so a delete wins over an older copy.
2. **The log fails to open at launch, and the app acts as if the person is new** (`store.tsx`, the first `load()`
   swallows the error and marks the store ready, empty). Setup could then save over the real settings. Fix: a calm
   "Your log could not be opened. It is safe on this phone." screen with Try again and the support line, and no writes
   until it loads.
3. **A paid web tip loses its proof.** `buyTip` keeps the Stripe id only when the error is "no connection";
   `syncTips` clears it for any other failure (still processing, server busy). Fix: keep it until the server says yes
   or a clear "not found", try again later, and tell the person their tip is safe.
4. **"Use my account's log here" erases days that are only on this phone**, with no counts and no copy, and it deletes
   before it writes (`replaceFromAccount`). Fix: show both counts ("This phone: 41 days. Your account: 6 days"), keep
   this phone's log for 7 days with "Bring this phone's log back", write before deleting. **Owner decision:** make
   "Combine" the highlighted choice.
5. **Every tip outcome but success is silent.** Cancelled, waiting for Ask to Buy, store not answering, web sheet
   closed, not confirmed: all return null and the buttons just come back; `tipError()` is never shown in the sheet,
   and an Ask to Buy approved a day later opens the extras with no word. Fix: `buyTip` says which it was, and the sheet
   says one calm line for each ("Nothing was charged." / "Waiting for approval. Nothing was charged yet." / "Your tip
   is safe. Daybook is confirming it."), with the support line.
6. **Restore purchases says "No earlier tip was found" when the store simply did not answer** (`ownedTips` returns
   nothing on any error). Fix: "Could not reach the App Store. Your tip is not lost. Try again." apart from a real
   none, and the real none offers "Write to us with the email on your receipt".
7. **An expired sign-in makes the delete messages wrong**: "Could not reach your account. Nothing was deleted." when
   the real problem is the sign-in, and a delete that timed out after the server finished also says "Nothing was
   deleted". "Sign in again" opens Create account with an empty email. Fix: say "Sign in again first", open the Sign
   in tab with the email filled, and say "may have partly happened, try again" when unsure.
8. **Points can drop** when an entry is deleted or changed: level and badges have a floor, the points total does not.
   CLAUDE.md says points are never taken away. **Owner decision:** keep a high-water mark of points, except the "Undo
   this entry" just after a mistaken log, which is meant to take its points back.
9. **Saving fails quietly or after a success message.** "Logged. That counts." shows, then "Could not save that change
   on this device." with no next step; settings saves swallow the failure. Fix: one line that says it is on screen but
   not saved yet, and what to do.
10. **A delete on another phone wipes this phone with no word.** Fix: say once "Your log was deleted from another
    device. Your account keeps a copy until [date]." with Bring it back.
11. **Sign-in dead ends:** a code or password reset that worked, then a sign-in that failed on the network, leaves the
    code used up and the person stuck; signing up with an email that has an account does not switch to Sign in. A
    keychain read error shows as an expired session.
12. **The raw server text reaches the screen** (`body.error` into the sync status), there is no Try again outside
    Settings, and nothing tells offline apart from a server error.
13. **Small money and data guards:** the tip double-tap guard is React state, not a ref (two web sheets can open);
    Rode to Slipped on an entry throws away what the person did (`paused`, `did`); "Record again" deletes the old
    voice note before the new one is kept, and recording has no try/catch; a restored backup (owner builds only) does
    not run `keepEarned`.

Medium (screens, words, small rules):

14. **No way to reach a person.** `SUPPORT_EMAIL` is not used anywhere in the app. One shared line, "Still stuck? Write
    to …", under every error above, plus the crash screen.
15. **No crash screen.** A render error is a blank screen, even in SOS. Export an `ErrorBoundary` from the root layout:
    "Something broke. Your log is safe." with Try again and the support line.
16. **Undo, built once.** The toast cannot carry an action, so every Undo is hand-built and most deletes have none.
    Proposed: an Undo on the toast (8 seconds, the one word "Undo") after deleting an entry, removing a list line or a
    custom answer, and changing the counting mode or Day 1. **Owner decision:** the toast becomes tappable.
17. **Sync and account words:** "Something went wrong." in three places; the Settings header says "On" while sync is
    failing; the error state hides the last-synced time and the changes waiting; signing out or deleting does not say
    the unfinished lessons go back behind an account, and signing out says nothing after.
18. **Tip sheet details:** it shows $5.00 before the App Store answers and never updates to the real price; no "store
    not answering" state; the return page (`tipped.html`) can stay on "Taking you back" forever; the small Support
    button on Today ignores the quiet hours after an SOS.
19. **Labels that mislead:** "Close for tonight" under Rekindle only closes (remove it); "Not now" in the lesson skips
    the practice ("Skip practice"); "Not now" when signing out keeps the logs apart ("Keep them separate").
20. **Permission failures are silent:** the microphone (no "Open settings") and reminders turned down ("Reminders stay
    off. You can turn them on any time in Settings.").
21. **SOS mis-tap:** Undo after "I slipped" from SOS cannot go back to the tools; let it reopen SOS.
22. **Thumb zone:** the counting-mode screen has its choices mid-page; the check-in's Done is not in `Dock`.
23. **The X:** `close()` and `closeAll()` are the same code, so an X in a chain goes to Today, not one step back as
    `docs/design-standards.md` says. **Owner decision.**
24. **Empty states:** one look (`EmptyChart`) and one shape ("No reasons yet." then what fills it) everywhere; Weeks
    and the week page have none.

Low (mechanical):

25. One `copyText()` helper (the "Could not copy" line is pasted in 8 files).
26. Shared words for repeated lines: notifications off (4 versions), the empty text box (4), counts on and off (2), the
    restore line (3).
27. Toast time grows with its length (long lines get the same 3.2 seconds now).
28. One small spinner (`Busy`, the accent color) and an ellipsis on every "Sending…", "Loading…".
29. The voice note and "Delete everything" confirms get the `dangerSoft` box, the question and "Keep it", like the rest.

**The owner's decisions (October 26):** build all of it at Opus high, medium and low items by Sonnet agents; a delete wins
over the other phone's copy and sync goes entry by entry; Combine is the choice for most people; points never go down
except the Undo right after a mistaken log; the toast carries Undo; the X goes one step back.

**Built (October 26, 2026).** All 29. Choices made along the way, for the owner to know:

- Sync joins a day entry by entry on the device instead of sending each entry as its own record: the same result (no
  entry lost, a delete wins), with no change to the API or the stored records, so no account needed migrating and an
  older app version keeps working. A deleted entry leaves a one-way mark in its day (`goneMark`), never its id, so
  nothing about it (not even when it was made) stays in the account; the privacy page says so.
- One corner is left as it was: if one phone deletes the last entry of a day while the other logged a new one that same
  day before syncing, the delete wins and the new one goes with it (the owner's "a delete wins").
- Points: the floor is written only when a change lowers them (`seen.pts`), not on every log, so settings are not sent
  more often.
- The Undo toast is the one toast that sits low (in thumb reach, just above a sheet's main button); every other toast stays
  at the top.
- A log that cannot be opened at launch shows a calm page with Try again and the support line, and nothing is saved until
  it opens. That page has no SOS (it cannot read the log); it is a storage failure, which should be very rare.
- "Use my account's log here" keeps this phone's own log for 7 days on the phone (Settings, Sync, Bring this phone's log
  back). On the web this uses the browser's storage, so a very large log may not fit; the choice still goes ahead.

**Finished too (October 26):** Undo on a slip from the pause tool on its own opens SOS with its tools; Today shows a quiet
strip with Try again (or Sign in) when sync has not worked for more than a day, and nothing for a short time offline;
the setup's backup restore uses the shared words, like Settings and the welcome page.

## Logging a slip, second look, and Rekindle rebuilt (the owner, October 27, 2026; on branch slip-again, not merged)

The owner: do not ask how they felt before a slip ("the answer is going to be horny"), the Already happened flow needs
another look, and the Rekindle celebration is really bad. Two agents researched it.

- **Ask about the situation, not the feeling.** Right after a slip, shame is at its peak and stays up for hours (Henry
  and others 2025, a daily-log study of porn use). The most reported triggers there were could not sleep, craving,
  internet or social media, bored, lonely and stressed. "Craving" tells nothing about next time. Marlatt's lapse
  management turns "I have no willpower" into one situation not handled well, so the useful question is what was
  going on. The feelings grid is gone. In its place is "What was going on?", with the same answers as after an urge
  (late in bed, lonely, bored, stressed, tired, scrolling, the person's own, Not sure), so slips and urges count
  together.
- **The new order:**
  1. Rekindle.
  2. How do you feel now, and its kind answer. Like giving up shows the 988 line.
  3. Just before.
  4. Next time: "When it is late and I am in bed with my phone, I will ...", saved with `ft`, the situation.
  5. The finish, by the fire.
- **Rekindle, rebuilt (components/hearth.tsx, Reanimated and SVG, no new native module).** Relief, not a prize:
  - Charred logs on embers that breathe.
  - A hold whose ticks speed up under the finger.
  - At the catch: a white flash, a squash, a flame springing past its size, a heartbeat buzz (heavy, then soft), and
    warm light over the whole screen.
  - Embers rise and drift, and a few keep rising.
  - The words land after the fire. Nothing jumps.
  - With Reduce Motion on, it simply fades up.

Not yet: the first tap on Next after the hold sometimes did not register on the simulator (it did before this change
too), and Android and VoiceOver are not checked.

## Logging a slip, rebuilt from the ground up (the owner, October 25, 2026; on branch slip-redesign, not merged)

The goal: after a slip, the person comes back stronger and is less likely to slip again. Three agents researched it
(the studies, How We Feel, Apple's State of Mind and other quit apps, and the code a slip touches). What the research
supports, most important first, and what the new flow does with it:

1. **Answer "I already blew it" first.** Feeling like giving up after a first slip was the one reaction that predicted a
   faster second one (Shiffman and others 1996, smokers, real-time logs); lower confidence after a slip predicts the
   next (Gwaltney and others 2005). The flow opens on Rekindle's hold, with what is still theirs.
2. **Never reset, never shame.** A broken streak makes people drop off even when behavior is the same (Silverman and
   Barasch 2023); shame predicts relapse, guilt about the act does not (Randles and Tracy 2013); kindness after a
   failure makes people try harder (Breines and Chen 2012). Every word is about the act, never the person.
3. **Name the feeling from before it, precisely** (lesson 8: the habit as an exit from a feeling; Baker and others 2004,
   Brand and others 2019). People better at telling feelings apart had lower daily odds of a lapse (Anand and others
   2017, OR 0.73). The four colors and the field of feelings from SOS; the word comes back big, breathing in its color,
   with what that feeling was asking for and what the habit gave it instead, and the person's own pattern.
4. **Notice what it really gave.** How it feels a few minutes later, answered kindly and truly, with their own record
   ("After 3 of your last 4 slips, you felt flat or empty"). Updating the reward value lowers the pull (Brewer and
   others 2011; Taylor and others 2021). Still pulled toward it leads straight to SOS.
5. **One if-then plan from the feeling,** read back once and asked about the next morning ("When I feel lonely late at
   night, I will text someone."). If-then plans: d = 0.65 across 94 studies (Gollwitzer and Sheeran 2006). Late at
   night, the moves that mean going out swap for ones that work at home.
6. **Short, skippable, private.** One tap a page, every page can be closed, each answer saved as it is given. The care
   screens never name the habit. Despair words (Hopeless, Despairing, Helpless) show the 988 line.

Kept: the hold, Today's "one small thing now" card (the research's next-hour step), the sunrise check, points.
Dropped: the "Did you wait first?" slider for slips logged from Today (SOS and the pause still measure the wait), and
the hand-off to Talk it through after a slip (the plan is made inside the flow now).

The data: two optional fields on a slip, `fb` (the feeling word before) and `fa` (how it felt after), and `fw` on the
after-slip plan (a talk-through with pr 1). Older app versions drop these fields when they edit that day.

Follow-ups, done (October 29, 2026; on branch worktree-agent-a1a5d71da18700c7c, not merged):

- **The plan at its hour.** A plan made after a slip is for the next time its moment comes round: late at night from
  9 PM to 5 AM, the evening from 5 PM to 9 PM, a slip in the daytime the same hour the next day. Today shows it under
  SOS from an hour before until the moment ends ("Your plan for tonight"), and not in between; "Did your plan hold?"
  waits until after it. With the heads-up switch on, one quiet note comes at the moment's start ("Your plan for tonight",
  "The plan you made: put the device out of reach."). It takes the hard-hours heads-up's place on its day, so a day
  still has at most two notes, or three with one heads-up. A plan in the person's own words is not put on a locked
  screen. This also fixed the plans made since October 27 (they carry `ft`, not `fw`), which were being asked about the
  morning after the slip, and a slip at 11:50 PM no longer settles the plan made for it at 12:05 AM.
- **The situation before slips, in Pattern and the Sunday review** (the feeling before, `fb`, is no longer asked, so the
  situation in `trigger` took its place). Once at least 3 of the last six slips have a situation and the most common
  one is behind at least half: "Being in bed late with your phone came before 3 of your last 5 slips. Your plan for
  that moment is ready." Pattern shows it at the top of What sets it off?; the Sunday review's slips screen shows it in
  place of "Most came with".
- **How it felt after, at the next urge.** In SOS, at the hour after (the two hours, a calm move), once at least 2 of
  the last 5 slips have how it felt afterwards and most were flat, ashamed or like giving up: "After 4 of your last 5
  slips, you felt flat or ashamed." Never in a practice ride or the first 30 seconds (Brewer and others 2011).

Not yet: the hard-hours card still offers "Make a plan for tonight" when a plan made after a slip is already waiting
for the same night, and the iPhone build and VoiceOver are not checked for these.

## The QA list of October 24, 2026 (the owner)

Done: the "How are you feeling today?" prompt (once a day, Today only, never on a slip day); the evening check-in cut to mood,
urges and stress with one Goodnight tap (saves, records phone down, the going-to-bed picture); the morning-after card and its
questions removed (coming back counts as the sunrise check; a morning-only card asks a run question still open); the "and one
more: your sunrise check" line fixed; the next stop in Your day grows into a card with its own button; Log a slip is three
screens (did you wait first, hold to rekindle, talk it through or close). The SOS button in the tab bar stays, by the owner's choice.

**Lesson order: the owner decided (October 24, 2026): lessons open one at a time, in path order.** Nothing finished ever
shows after Up next on the Learn map (done lessons past Up next "make the app feel poorly thought out"), and lessons need
no lock (the owner: "lessons don't need a lock"). **Done** (helps the person: the next step is always the one lesson, and
the map reads as a road walked; helps Daybook: the account rule on top of it is unchanged).

- **The rule** (core `lessons.ts`: `lessonWalk`, `lessonGate`, `nextAfter`). Up next and every lesson behind it open in
  full (reading again is always allowed); a lesson further on opens as its key idea. The account rule stays on top
  (`accounts.ts lessonOpen`). Today, the lesson reminder, the hard-hours card and the map all read Up next from the walk.
  No rate limit: two in a row is fine.
- **The map** keeps its look: done stones with a check, Up next bright and raised with the pin, its ring now filling as its
  section does. Every stone after Up next is quiet (flat, a soft gray-tinted version of its section's color, its number,
  no lock), and a land still wholly ahead has its picture drawn quiet. A quiet stone's card says "Opens after lesson N"
  with a button to Up next. When Up next moves on, a few sparks fly from the new stone once (they only fade under Reduce
  Motion). The free-account line above the map lost its lock icon too (a shield now).
- **Links to a lesson further on** (help pages, My plan, the review's "Why it matters", nudges, the hard-hours card,
  tools) open a one-card key idea in `lesson/[id].tsx`: the title, the question it answers and its key (`L.key`, the same
  line its Done card shows; every lesson has one, so no new field was needed), the tools it points to (practice `go`, care,
  never locked), and "This is lesson N on your path. It opens as you go." It saves nothing and earns nothing. Help pages
  say "The key idea, for now" under such a lesson.
- **Lessons read before this rule** stay finished with their points (`lessonsEarly` reads them from the order lessons
  were finished). On the map they are quiet stones until the path reaches them; then Up next is that lesson as usual, and
  it opens as a welcome back: the flame, "You read this one on <date>.", the key idea, its own recall question
  (`lessonBackRecall`, plain "Quick recall"; once answered, the next lesson does not ask it again that day while the
  app stays open: `lessonRecallOf`'s `asked`), then "Keep going"
  (`lessonReach`: a marker in `settings.learn.back`, no points, no lesson day, kept through a sync join) and a quiet
  "Read it all again" (the full lesson; finishing it also moves the path on, and earns the usual read-again points).
  Keep going opens the new Up next.
- **Checkpoints follow the path** (`lcheckPair`, `lcheckOrder`, `lcheckNo`). Each checkpoint keeps its two lessons and
  its record (`wr.c1` to `wr.c16`), so writing is never re-labeled; the pairs were always two lessons of one section,
  side by side on the path. What changed: one comes after its later lesson is reached, in path order (the faith
  section's two come before Skills for the moment), and the number shown is its place on the path (Learn, the checkpoint
  screen, My plan, the copied playbook). The checkpoint screen said "lessons 2n-1 and 2n"; it now gives their path
  numbers.
- **Golden fixtures** `random-11` and `random-23` were edited by hand: both logs read a lesson early, so Today's lesson
  line now names that lesson's welcome back.
- **Screenshot mode** froze on `/lesson/<id>?at=practiced`: the studio read `?at=` as the demo clock, and a word is not a
  date. Only a date sets the clock now. The real app never had the problem.

Chosen on the owner's behalf: the history list under the map ("In the order you finished them") still lists lessons read
early, as a record; the count above the map counts the road walked. If a lesson is ever added in the middle of the path,
everything finished after it becomes "read early" and gets a welcome back, by this same rule. **Not tested:** iPhone and
Android (web only); the sparks with full motion on a phone; a sync between two devices with welcome backs passed.

## Setup as a story: three acts, three payoffs (the owner, October 22, 2026)

**What the owner asked for:** setup has to be the best-built part of the app: better visuals, more excitement, better
teaching, following what is known about good onboarding. Research first (cheap agents), design and flow by Claude, the
building outsourced.

**What the research holds up** (most onboarding advice is vendor blogs; this is the part with some evidence behind it):
value before the end (Calm opens with a breath before any question; Reframe's quiz teaches while it asks, and its
"building your plan" screen works because something is being built); a question earns its place only when the answer
changes something the person sees; the account ask comes last (Duolingo's own number: about +20% daily use); and for a
shame-free app, no dependency score, no urgency, and no pledge that frames a future slip as a broken promise (the
abstinence violation effect, Marlatt). Nobody has a credible number for the right length; the setup funnel in the counts
will measure ours per page.

**What the walk found** (all 39 web pages at 390 by 844, light and dark): the question pages work (clean, low, one tap),
and so do the five statements, the hours reveal, the real pictures and the sourced "Behind this". The problems: no arc
(41 pages, 50 to 60 taps, 8 to 10 minutes, every page the same white card, the bar resetting seven times, "about 5
minutes" not true); pages 20 to 31 are twelve "read it, tap Next" pages in a row, a tour of the app before the person has
used it, and nothing in them uses the answers except the SOS line and the pattern chart; nothing happens (the first tool
is tried after setup); the payoff is flat ("Here is your plan" is a list that appears, "Welcome in" a small static
flame); placeholder icons in pale circles; two asks back to back at the end (tip, then account); and off-standard
details (teaching pages put the title at the bottom, a hand-rolled track instead of `Slider`, hard-coded colors, no
Reduce Motion, no page transition).

**The owner's decisions (October 22):** merge the five tour pages (SOS, lessons, your day, pattern, flame) into one and
let Today teach the rest (this reverses "setup keeps every screen" from October 17, for the tour pages only; every
question stays); the tip page leaves setup (the tip jar stays in the app: Today's one ask and the row on More; "free, no
ads, no subscription" moves to the welcome page); a real 30-second slow-breathing moment inside setup, skippable; keep
"Hold to commit" as the one ceremony, the hold lighting the flame, the promise about honesty and never about not slipping.

**The design.** Every question stays. The flow becomes a story in three acts, each ending on a payoff, each looking
different (its own color washing the whole screen on its opening and payoff pages, white cards for the questions):

1. **You** (hello, how, aim, years, freq, mins, faith, the five statements, heard with "far from the only one" folded in,
   costs, guess) → **payoff: your hours**, the number counting up on a full-color page.
2. **Your hardest hour** (when → "Late at night, in bed. Here is what an urge does there", the wave full-bleed → **try it
   now: 30 seconds of slow breathing**, the real SOS breath, skippable → the loop, "the way out is people" → who could be
   your safe person, so the teaching sits inside the question → one page, "A day in Daybook", in place of the five tour
   pages) → **payoff: you just rode one out.**
3. **What to expect, and your plan** (curve, tried, tries, slip as a short full-bleed story; "takes" folds into the
   welcome page → goal, reasons, if-then, screens off, becoming) → **payoff: the plan builds itself**, row by row from the
   answers as each is computed, then the hold that lights the flame, then "Welcome in" with the flame alive, the level bar
   filling to +20 and the first step.

Then the account ask (as now) and the reminder page. About 33 pages and 40 taps, and the person leaves having done one
real thing. Across the whole flow: one progress bar for the full setup with the three act names, an honest time on the
first page, titles at the top on every page, a page transition, `Slider` for freq and mins, the flame alive, Reduce
Motion honored, theme tokens only, and the pale-circle icons drawn as real small pictures or dropped.

**Steps (each one commit; each marked with its effort; the owner has not set a level, so the work runs at Medium):**

1. **Medium.** The structure: `OB_PAGES` in the new order with the merges (heard+common; sos, lessons, day, pattern and
   flame → one `tour` page; takes → done; `breathe` new, after when; loop just before person; so into the plan act; free
   out), `OB_SECS` as the three acts, one progress bar over the whole flow, the honest time and the free line on hello.
   `PULSE_KEYS` and the privacy page list follow the page ids in the same change; the setup fixtures' `pages` are updated
   by hand (the order is a design change, not a rule change); the walk-through (redo) still works. **Done.**
2. **Medium.** The look: act openings and payoffs as full-color scenes, titles on top everywhere, a slide-and-fade between
   pages, `Slider` on freq and mins with the big value in the middle, the flame alive, Reduce Motion, theme tokens, the
   placeholder icons replaced or dropped. **Done** (setup runs on `SceneFrame` and `Stage` now, with new `bar`, `bare`
   and `topRight` props; the white card is drawn by `SceneFrame` only when `bar` is set, so no other screen changes).
3. **Medium.** The payoffs: the hours count-up as the act-one close; the breathe page on the SOS breath (`ToolTimer`,
   `SQUIGGLE`, design-standards.md); the plan assembling row by row; the hold lighting the flame; Welcome in with the
   level bar filling (display only, points rules unchanged). **Done.**
4. **Medium.** The walk: a Playwright pass of the whole flow as a new person and as a walk-through, light and dark, 390 by
   844 and the SE height, screenshots to the owner; the funnel checked against the new ids. **Done** on the web build
   (the reminder and account pages do not show on the web, so they were checked by reading, not walking).

**Done (October 22, 2026).** 35 pages, about 40 taps. Chosen on the owner's behalf: the "+20 points" chip merged into
the level line on Welcome in ("Level 1 → Level 2 · +20 points", the bar filling); the walk-through's end page lost "Back
to Today" (Done did the same); the breathe page keeps breathing after its 30 seconds instead of stopping dead. Known and
left: on a 375 by 667 phone the review and the longer answer pages scroll, with the main button below the fold (fitting
them would mean cutting content); the freq and mins track is the app's one `Slider`, which is pale before an answer, and
changing that is a change to `slider.tsx` for the whole app; a new person who had setup half done before this change
resumes at an index into the old order (pre-release data only); the funnel's setup ids changed, so early totals mix old
and new names. **Not tested:** the reminder and account pages, and the hold and the breath on a real phone (the owner,
on TestFlight: the breath's haptic at the end, the hold, Reduce Motion on).

## Today, with its flame back (the owner, October 22, 2026)

**What the owner said** about the one-card Today: it is simpler, but it lost its soul. The flame is the mascot, the
whole app is built around leveling it up and watching it grow (the picture of getting free), and Today shrank it to a
60-pixel thumbnail. It is still hard to know what is next in the day. The goal is a lesson every day. Maybe the morning
check-in is not needed: start on the lesson and trust the night. SOS, Already happened and Planning a slip? matter a lot,
and the app should lead people to its tools, but the goal is not pure function. (Now in CLAUDE.md, "The flame is the
heart of the app".)

**What I think.** The owner is right, and the review I followed was half right. Its diagnosis held: three "Start"
buttons for the same two minutes, "+N points" four times, a game voice over the identity voice. Its cure went too far:
it treated the flame as one of the "six systems" crowding the screen, when the flame is what the other systems are
for. The fix keeps the one owner of "next" and puts it on the flame: the flame is the top of Today, and the one next step
hangs right under it, so what you do and what it grows are one picture.

**The picture** (`docs/today-review/flame-calm.png`, a working prototype on the branch `proto/flame-today`, not on
main): the flame big in its sky, the number that never drops to zero, "Level 11 · Campfire" with the bar to the next
form; under it one band, "Lesson 1 of 41 · You do not need to feel ready · Start"; SOS with Already happened and
Planning a slip? still above the fold; Your day below. `flame-morning-after-rough.png` tries a sunrise sky for the
morning after; it is rough because the flame drawing carries its own night circle, so the art needs a dawn version.

**What stays from the one-card work:** core `moment.ts` still decides the one next step, and the moments with their own
choices (the hard hours, a talk-through, the comeback flames, a run that ended) still show in full, under the flame, when
they are the moment. "+N points" stays off Today (a number to chase); the level and its bar come back (the flame
growing is the point). The comeback, the save rule and the story tests stay as they are.

**Steps (each one commit; each marked with its effort):**

1. **Medium.** The flame back on Today: its sky, the number, the level and the bar, tap to say hi, the sky opening
   Milestones (the old hero, restored). The one next step as a band under it, the whole band one button. The bigger
   moments shown in full under the flame. The small flame row goes. SOS block, Your day and the asks as now. Stories and
   their expectations updated.
2. **Medium.** The flame grows when you do something. Back on Today after a lesson, a check-in or an urge ridden out,
   the bar fills to where it now is and the flame glows once, with one quiet word ("Your flame grew"). A new form keeps
   its celebration. Display only; points rules unchanged.
3. **Medium.** The flame's sky follows the day: a sunrise the morning after a slip (a dawn version of the flame art in
   core `flame-art.ts`), and the quiet night once the day is done ("All done. Rest well." under a sleeping flame).
4. **High, needs the owner's yes.** The day starts on the lesson. The morning stop (Last night: sleep and screens-off)
   leaves the day for everyone who has not turned it on themselves, and its two questions move into the evening check-in
   as "last night" (a day late, but the pattern charts keep them). The lesson becomes the first stop and the one the
   day is built around. Points: the morning stop's points stop being offered, nothing earned is taken away; golden
   fixtures only if a counted rule changes.
5. **Medium, needs the owner's yes.** One daily notification, for the lesson, at a time the person picks in setup
   ("A new lesson is ready. Two minutes."). The check-in reminder becomes a backup, as in rule 4 of the notification
   plan. No word that says what Daybook is for, and no fear of losing anything.
6. **Medium.** Leading people to the tools: a lesson that teaches a tool ends with "Try it now" and "Add it to my SOS";
   the SOS screen shows the person's own tools first. No new cards on Today.

Choices to make: steps 4 and 5 (the morning stop, and the lesson notification and its words).

**Done (October 22, 2026): steps 1 and 2** (the owner: "It is really good. Go ahead and build that"). The flame is back
at the top of Today (`hero.tsx`) with the one next step under it (`moment-card.tsx` `Band`); the day of a slip keeps
its full card. Back on Today after points come in, the bar fills from where it was, the flame blooms and "Your flame
grew" shows for a few seconds, once any celebration that came with it is closed (`useCelebrating` in `celebrate.tsx`).
Choices made: the band's button keeps a short word ("Start", "See it", "Fill in"), with the full action in its
screen-reader label; the quiet line (what was logged today, the week's goal) sits under the next step. Not seen on a
real phone yet. Steps 3 to 6 wait (3 and 6 are medium; 4 and 5 need the owner's yes).

## Notifications, second pass: the rhythm, the mood, words that learn, the flame in the note, and the ask (the owner, October 22, 2026)

**Steps 1 to 6 built** (October 22): core `notify.ts` and `nudges.ts`, the pictures in `apps/mobile/assets/notify`, the
Android icons, `lib/reminders.ts`, `components/notify-banner.tsx` (pictures: `docs/today-review/notify-banner.png` and
`notify-banner-off.png`), setup, Settings and the privacy page. Step 7, the owner's check on a phone, is next. Choices made
while building: "Turn on" on the banner asks the phone first and turns the check-in and the Sunday review on only after a
yes; the come-back notes use the tender words when the slip was today or yesterday (a slip late last night is yesterday's
log day); the heads-up asks for exact times through a row under it in Settings ("Allow exact times", Android only), not by
opening the phone's page on its own; the first wording of each kind is the old one, and with nothing known the day's jitter
picks, so the first check-in note may not be the setup sample's words.

**What the owner asked for:** notification logic as good as Duolingo's: track how often the person uses the app and how
they feel, research how the best notification systems are built and replicate them, send different pictures with the
notes, back off when the person has been away and then say "we have not seen you in a bit", ask for permission in setup,
and when notifications are off, a banner at the top of Today that says so, like Duolingo's. The owner: "go ahead".

**What is already there** (October 19, "Notifications that fit the person", core `nudges.ts`, below): every note is about
a thing the person turned on and is skipped when it is done; at most three a day, an hour apart; kinder words after a
slip; the check-in note becomes a backup once the habit holds; a kind that is ignored three times steps down and then
pauses, said on Today; four come-back notes (days 2, 4, 7, 14) at the time of day the app was last open, then silence; the
setup page with the sample lock-screen note and the phone's one prompt; the Reminders section in Settings; the offers at
the end of a check-in, the Sunday review and the risk card; an Android channel per kind; nothing on a server, nothing
synced. The words never say what Daybook is for, because a note can show on a locked screen. Hold on to all of it.

**What is missing, against the ask:**

1. **The app's own rhythm is not learned.** `opens` keeps three days, only to judge a note. The come-back notes land at
   the time of day the app happened to be open last, clamped to 10 AM to 7 PM.
2. **The person's mood is not heard.** The check-in records motivation, connection, energy, stress and sleep every
   evening, and no note changes with it.
3. **One wording per kind, for ever.** Duolingo's bandit, the system the owner wants, exists to fix this.
4. **The come-back ladder is short, fixed, and only for some.** Fourteen days, the same four lines, and only for people
   who turned on a regular reminder. Someone with only the hard-hours heads-up, or who said "Not now" in setup and later
   turned notifications on from the banner, gets nothing when they go quiet.
5. **No picture in a note, and a broken icon on Android.** The plugin sets no small icon, so Android draws the launcher
   icon through its alpha mask: a white square in the status bar.
6. **Nothing on Today says notifications are off.** After "Not now", or a deny on the phone's prompt, the only word is
   in Settings.
7. **Setup's "Not now" forgets the time the person picked**, so a later "Turn on" cannot use it.
8. **Android timing is loose.** Scheduling uses AlarmManager; without `SCHEDULE_EXACT_ALARM`, Android 14 and newer deliver
   "within one hour" of the time. An hour late is fine for a check-in and wrong for a heads-up 90 minutes before the hard
   hours.

**What the research says** (three sourced briefs, October 22; the sources are in the steps below where they matter):

- **Duolingo's bandit** (Yancey and Settles, KDD 2020, research.duolingo.com/papers/yancey.kdd20.pdf): the arms are
  hand-written templates, each with an eligibility rule (a template "sleeps" when its rule fails). The reward is a lesson
  done within two hours of the note, not an open. Each arm's score is its lift over the other arms on the rounds it was
  eligible, minus a recency penalty that decays with a 15-day half-life (reusing yesterday's template cost 0.5%), chosen by
  softmax so new arms get tried. Lift: +0.5% daily users, +2% new-user day-7 return. Their timing rule that always won
  (Shuttleworth, Duolingo growth, on Sub Club): the next note comes 23.5 hours after the first practice of the day, not at
  a fixed hour. Their lapse ladder: seven daily notes, then "These reminders don't seem to be working. We'll stop sending
  them for now.", and reactivation is "tough sledding" after day 3 or 4. **No rich images in their notes**: the sad owl
  lives in the widget and in limited-time app icons (melting, sick, dead Duo), which the company says drove opens and the
  press called guilt and manipulation. Those, the "streak ends in 10 minutes" saves and the passive-aggressive characters
  are the parts that run on guilt and loss, and Daybook does not take them (CLAUDE.md: never shame, earned things stay
  earned).
- **HeartSteps** (pmc.ncbi.nlm.nih.gov/articles/PMC6401341): a fixed walking prompt lost about 3% of its effect a day and
  was undetectable by day 29; what effect there was came from tailoring to context, and the cap was two or three a day.
  **Drink Less** (570 people, PMC10337295): one 8 PM prompt raised opens 3.5 times, and a rotating bank of 30 wordings did
  no better than one fixed line over 30 days. So variety matters when notes run several a day for weeks, and one evening
  note can stay plain. Daybook sends about one a day: a few wordings per kind, not thirty.
- **Receptivity** (Künzler, PMC9494762): responses are highest 10 AM to 6 PM and when the phone was just used; a goal met
  one day predicts a better response the next. Sending the instant the screen turns on cut use (PKU field study); a
  minute or two later beat it. OneSignal reports 23% more opens from sending at each person's usual active time.
- **Mood**: no trial isolates mood-tailored wording. What exists points one way: higher momentary stress predicts lower
  odds of engaging (Nature Sci Rep 2026, s41598-026-39518-z), and support-seeking prompts fit badly when stress or low
  mood is high (PMC12421209). The rule that follows: after a low mood, offer, do not ask. Finch's "First Aid" after a low
  check-in is the one product example.
- **Lapse ladders**: no controlled evidence on cadence or on a closing "we will stop" note. Industry practice: Braze
  waits 14 days then weekly, timed before the person's usual high-use hour; every sequence exits the moment the person
  returns; Google's Android design guidance forbids a "Haven't seen you in a while!" that carries no value.
- **Frequency**: 37% of people disable notifications at 2 to 5 a week they did not want (Localytics); contextual notes open
  three times as often as generic ones (Batch, CleverTap). Opt-in (Batch 2025): iOS 56%, Android 67% since Android 13
  asks; a pre-prompt that explains the value lifts it; in-app messages to people who opted out lift it another 14%
  (Airship 2025).
- **The platforms** (docs.expo.dev/versions/v58.0.0/sdk/notifications/): iOS shows its prompt once; afterwards only
  Settings. A local note on iOS can carry an image (`attachments: [{ identifier, url, typeHint }]`, a `file://` URL,
  PNG or JPEG up to 10 MB, no service extension); `expo-asset`'s `Asset.loadAsync(require(...))` gives the file. **Android
  local notes cannot carry a per-note image** in expo-notifications 58 (only the static plugin `largeIcon`, 64 dp beside
  the text); the small `icon` is a 96 by 96 white-on-transparent PNG. App Store 5.1.2(i): an app may not require
  notifications to use it; a dismissible banner that opens Settings is fine; one that blocks the screen or gates care is
  not. Android 13 and newer: the system dialog can be shown twice, then only Settings; `Linking.openSettings()` opens the
  app's page on both platforms. iOS keeps the soonest 64 pending notes (Daybook plans about a dozen). A web page cannot
  schedule a note (Notification Triggers is abandoned), so the web stays as it is.

**The design** (every rule in core, tested; the app schedules and shows):

- **The rhythm.** `opens` keeps 28 days of open times (capped at 200). `usualHour(log, now)`: the hour with most opens in
  the last 28 days, recent days weighing more, between 9 AM and 9 PM, else the hour the app is open now, else 6 PM. It
  times the come-back notes. The judging of a note (two hours to open) stays as it is.
- **The mood.** `weekFeel(days, tk)`: `heavy` when the mean mood (motivation, on days saved before October 24, 2026) of
  the last three check-ins is 3 or lower or the mean stress is 7 or higher (0 to 10), `steady` otherwise. On a heavy day, the routine notes offer and do not ask: the
  check-in note becomes "A short check-in is enough tonight. Nothing to get right.", the morning and wind-down notes go
  passive (no sound), and the hard-hours heads-up stays as it is, because it is care. Never a number, never a word that
  says what Daybook is for. The kinder words after a slip (already there) win over the mood words.
- **Words that learn.** Three wordings per routine kind, in `NUDGE_WORDS`. Each note carries `w`, the wording's id. The
  log keeps `w: Record<id, { n: shown; h: helped; last: DayKey }>`, filled by `nudgeLearn` next to the kind's count.
  `pickWords(kind, log, tk)`: score = (h + 1) / (n + 2) minus 0.1 times 0.5 to the power of (days since last sent over
  15), plus a jitter of up to 0.02 from a hash of the day and the id (exploration without randomness, so tests hold);
  highest score wins. Duolingo's mechanics at Daybook's size: yesterday's wording loses unless it is clearly better, a
  never-sent wording gets its turn, a wording that helps keeps winning. Eligibility is the kind's own rule (the mood
  words and the kinder words replace the pick for that day).
- **The ladder, for everyone, with value in every note.** Come-back notes on days 2, 4, 7, 14 and 30 after the last
  open, for anyone whose phone allows notifications and has not turned the notes off (the Settings switch stays), at the
  usual hour. Two sets of words, picked by how the person left: `tender` when the last day was a slip day or the week felt
  heavy, `plain` otherwise. Each note gives something, never only "we miss you": day 2 "Daybook is here when you are
  ready. Your plan is one tap away."; day 4 "Nothing is lost. Everything you wrote is kept, and the next lesson takes two
  minutes."; day 7 "A week is a long time. A minute today is enough, and Daybook starts where you are, not where you
  were."; day 14 "Everything is kept. Whenever you come back, the door is open."; day 30 "This is the last note for now.
  Daybook stays quiet until you open it, and everything is kept." The tender set says the same with the slip in mind
  ("One hard night does not undo the rest. Everything you built is still here.") and no "lesson". The plan is remade on
  every open, so coming back ends the ladder at once (as now).
- **The flame in the note (iPhone).** Five pictures made from the flame art (`tools/make-icons.mjs`, from core
  `flame-art.ts`), in `apps/mobile/assets/notify/`: `flame-bright` (routine notes), `flame-warm` (the kinder words after
  a slip, and the check-in on a heavy day), `flame-steady` (come-back day 2 and 4), `flame-ember` (day 7 and 14),
  `flame-asleep` (day 30, a small ember, still lit: the flame is never shown out). Each `Nudge` names its picture (`pic`);
  the app attaches it on iOS. On Android the plugin gets the small `icon` (a white flame silhouette, 96 by 96) and
  `largeIcon` (the flame badge), which fixes the white square; no per-note picture, because expo-notifications 58 does not
  do it for local notes. The flame backs off with the person, and never looks sad, sick or dead: the pictures are a
  flame resting, not a mascot guilting.
  **Taken out on October 25, 2026** (the owner): on iPhone a note's picture shows beside the app icon, and the flame
  picture looked like the same icon twice. The notes carry no picture now; the flame's forms became app icons instead
  (see "Notes with a voice, and app icons" at the end).
- **The ask on Today.** Core `notify.ts`: `notifyAsk(env, mem, days, st, tk)` says whether the banner shows and what it
  says. It shows while this phone can notify (a phone app, not the web), setup is done, notifications are not granted,
  the person has not chosen "Stop asking on this phone", the X was not tapped today, and it is not the day of a slip or
  the day after (CLAUDE.md: ask only at good moments, never after a slip). Two forms: `allow` when the phone can still
  ask ("Turn on reminders. One short note a day, at your time, and never a word about what Daybook is for.", button
  "Turn on"); `off` when the phone has said no ("Notifications are off for Daybook on this phone.", button "Open
  settings", which opens the app's settings page). It sits at the very top of Today, above the flame, full width, in the
  sun color with the bell icon and an X, like Duolingo's: the one place Daybook nags, by the owner's choice. It is never
  a modal and never blocks anything (App Store 5.1.2). "Turn on" turns on the check-in note at the time setup remembered
  (else 6 PM) and the Sunday review when nothing is on yet, then asks the phone. Its memory (`daybook.notify` on the
  device: `quiet` the day of the last X, `never`, `n` the count of X's) is never synced.
- **Setup and Settings.** Setup's "Not now" keeps the picked time in `checkinAt` with `checkin` off. Settings, Reminders
  gets "Stop asking on this phone" (shown while the banner can show) and, on Android 14 and newer, "Exact times" when the
  exact-alarm permission is not granted, opening the system page. The hard-hours channel asks for exact alarms when the
  heads-up is on; the others take "within the hour" as it comes.
- **Nothing leaves the phone**, as before: the rhythm, the mood words, the wording counts and the banner memory are on the
  device. The privacy page gains one line: the times the app is opened are kept on the phone for 28 days, to time the
  notes.

**Choices made for the owner to know:**

- **The banner comes back every day** until notifications are on or "Stop asking on this phone" is chosen, as Duolingo
  does and as the owner asked. I would stop it after seven X's in a row and leave the row in Settings; the owner can say
  so and it is a one-line change (`NOTIFY_MAX_X`).
- **Three wordings per kind, not thirty.** Drink Less showed a rotating bank did nothing for one evening note; the bandit
  is there for the people who run several notes a day for weeks, and so the app can tell which words help this person.
- **The ladder ends at 30 days, not Duolingo's 7**, because Daybook's ladder is five notes in a month, not seven in a
  week, and the last one says plainly that it stops. No "we miss you" without something in it.
- **Pictures on iPhone only.** Android's expo-notifications cannot attach a per-note image to a local notification; the
  fixed small icon and large icon are what Android gets. Said here so no one spends a day on it.
- **No provisional (quiet) permission on iOS.** It would deliver notes without asking after "Not now"; the owner's wish is
  the real prompt plus the banner, and "Not now" should mean not now.
- **The lesson note** (step 5 of "Today, with its flame back") is not in these steps: it still needs the owner's yes. The
  wording work here makes it a small step later.

**Steps (each one commit; each marked with its effort):**

1. **Medium.** Core `notify.ts`: `NotifyEnv` (`offered`, `granted`, `canAskAgain`), `NotifyMem` with `normNotifyMem`,
   `notifyAsk` with the two forms and every rule above, `NOTIFY_MAX_X = Infinity`. Tests in `test/notify.test.ts`: shows
   the day after "Not now"; not on the web; not before setup; not the day of a slip or the day after; not after the X until
   tomorrow; `off` form when the phone cannot ask; never after "Stop asking".
2. **Medium.** Core `nudges.ts`: `opens` to 28 days, `usualHour`, `weekFeel`, the come-back ladder on days 2, 4, 7, 14, 30
   for everyone allowed (the plan takes `allowed`), the two sets of words, `pic` on every nudge, and the mood words on
   heavy days. Tests: the ladder's days and hour from a made-up month of opens; tender set after a slip; heavy day words;
   the kinder words win over the mood words; the cap of three still holds; nothing at night.
3. **Medium.** Core `nudges.ts`: three wordings per routine kind, `w` on each nudge, `log.w` learned in `nudgeLearn`,
   `pickWords` with the score above. Tests: rotates when nothing is known; yesterday's wording loses to a fresh one;
   a wording that helped 5 of 6 keeps winning over one that helped 1 of 6; deterministic for a given day.
4. **Medium.** The app's side. `tools/make-icons.mjs` makes the five pictures plus `notification-icon.png` (white
   silhouette) and `notification-large.png`; `app.json` plugin gets `icon` and `largeIcon`, and `android.permissions` gets
   `SCHEDULE_EXACT_ALARM`. `lib/reminders.ts`: attach `pic` on iOS via `expo-asset`; the Follow-ups channel at LOW
   importance and the come-back notes passive on iOS; `exactAlarmsAsk()` for the Hard hours channel (`get/requestExact
AlarmPermissionsAsync`), and `openPhoneSettings()` (`Linking.openSettings`). `_layout.tsx` passes `allowed` into the
   plan. Read the v58 docs first (apps/mobile/AGENTS.md).
5. **Medium.** The banner and the wiring. `components/notify-banner.tsx` at the top of Today (`(tabs)/index.tsx`, above
   `Hero`; pull `main` first, the Today work of this morning is there), `lib/prefs.ts` memory `daybook.notify`, setup's
   "Not now" keeps the time, Settings' two rows. `npm run shots` or a story picture of the banner through screenshot
   mode (`EXPO_PUBLIC_SHOTS=1` can fake `offered`), saved to `docs/today-review/notify-banner.png`.
6. **Low.** `apps/mobile/public/privacy.html` (the 28 days of open times), this plan marked done, `[deploy]` on this
   last commit.
7. **Owner, on a phone.** A fresh install: setup's prompt, "Not now", the banner next day, "Turn on", the check-in note at
   its time with the flame picture (iPhone) and the right icon (Android); a deny on the phone and the `off` form opening
   Settings; a week away on a test clock: the day 2 and 4 notes at the usual hour.

Waits on the owner: stop the banner after seven X's (my suggestion) or keep it daily (as asked); the lesson note.

## The roadmap: the quit app that does not reset (2026-10-22)

**The strategy.** Every quit app fails at the same moment: the slip. The count drops to zero, shame rises, and the person
leaves. Daybook is the one built for the morning after, so that is its whole identity: "Everyone slips. Daybook is built
for the morning after." Success is measured in comebacks (how soon a person returns after a slip, and whether the gaps
between slips grow), not in days clean. The danger for Daybook is not missing features; it is being too much to feel
calm. On October 21 the owner, who built every part, could not tell what Today wanted from them (six systems on one
screen). So the next work is fewer, sharper things, and learning from real people.

**In order:**

1. **Learn from real people.** Launch the iPhone app, find 20 to 50 people (r/pornfree fits Daybook's spirit far better
   than r/NoFap), and stop adding features for about three weeks. Build the two ways to hear from them first:
   anonymous feedback and opt-in counts (below). _This is the first piece of work._
2. **Today shows one thing at a time.** One card, picked by the moment (the morning after a slip, hard hours ahead, a
   talk-through due, a calm day); everything else one tap away. Then every system is checked against CLAUDE.md's
   question (does this help the person see themselves as free?), and what does not is merged or cut: quests, levels
   against points against badges, the modes. Earned things stay earned; they only stop crowding the screen.
   Effort: medium for the screens, high wherever points or runs change.
3. **Rekindle, rebuilt as "the comeback, noticed".** No task list: three flames that light themselves from what the person
   really does (logged it honestly, at once; the sunrise check; the next urge ridden out or the next day with no slip),
   each naming what was done; a comeback count that only goes up ("You are someone who comes back"); a run is saved by
   coming back, not by errands. Open question for the owner: is "next urge ridden out or next clean day" the right third
   flame? Effort: high (runs and points), the card medium.
4. **See the hard night before it comes.** The hard-hours engine (risk.ts) learns each person's pattern on the phone. Use
   it earlier and calmer: "Tuesday after a long day is your hardest night. Want a plan before 8?" Effort: medium.
5. **One person, kept private.** An ally link: someone the person picks gets only what is sent ("rough night", "I came
   back", "30 days"), never the log. Only after the launch feedback says people want it. Effort: high.

**Not now:** more lessons, tools or game pieces; money beyond the tip jar; Android polish before iPhone people say what
matters.

**A working habit:** story tests. Scripted weeks of a made-up person's life, walked through the real web app with a
picture of each day, so a change to one feature cannot quietly break another (the "Time to decide" and Rekindle bugs of
October 21 only showed across days). Effort: medium.

### Today, one moment at a time (the Fable review, October 22, 2026; the owner: do it)

**The verdict.** One card at a time is the right shape for the top of Today, but on its own it is a half fix. Today is
crowded because three systems each own "what to do next" (the Rekindle missions, the Next up band on the flame, the
open tile in Your day: three "Start" buttons for the same two morning minutes), and because the game voice (points,
"+5", levels, "1 of 3 lit") talks over the identity voice ("you came back"). Fix the owner of "next" and the voice, and
the one-card rule follows. Keep every rule that counts progress; cut most of what displays it on Today.

**What the pictures showed** (`docs/today-review/`, a made-up person: `before-*.png` the app today, `mock-*.png` a
rough mock, not the app):

- The morning after a slip on day 9 of quitting: the Rekindle card, then the flame with "TOWARD GRADUATION 7 of 90". The
  gate is seven clean days in a row, which arrives on day 7 or 8 for anyone doing well, so the 90 shows up the morning
  after their first slip. That is a big goal pushed early.
- A calm day: "Lesson 5 · Start" on the flame band and again, bigger, in Your day. "+N points" four times on one screen.
- Stepping down, the morning after a slip: nothing says a slip happened. The full Rekindle fires only for the first slip
  in seven days, so the people who slip most often get the least care the next morning.

**What decides the one card.** One pure function in core, `moment.ts`, takes the log and the clock and returns one
card. First match wins:

1. A pause in progress (the slim banner; it is live).
2. In the hard hours now: SOS forward, plus "talk it through".
3. The morning after a slip, until the sunrise check is done. In every mode, including step down, for every slip, not
   only the first in a week.
4. The day of a slip, after it: the care card, one small thing.
5. A talk-through due: decide now, it passed, look back.
6. Hard hours in the next two hours: the plan card.
7. Days away not known: the fill-in row.
8. The Sunday review, Sunday and Monday.
9. One-time moments: first week done, Day 1 tell the safe person, a counting switch note, a paused reminder.
10. A calm day: the day's next stop (last night, lesson, check-in, wind-down). Everything done: "All done. Rest well."
    and the identity line.

When two moments overlap, the second becomes the card as soon as the first is done, and a one-line "and one more" under
the card names it. The asks (account, tip, counts) are never the card: they stay one at a time under Your day, with
the rules they already have.

**Always visible, in this order.** The date and the "who I am becoming" line. The moment card. SOS with "Already
happened" and "Planning a slip?" under it (care is never locked; these are the log's doors). One standing row: a small
flame, one number, one line, opening Milestones. Your day as plain rows; the open stop lives in the card above, never as
a second tile with its own button.

**The one number** holds what was earned and never drops to zero. Quitting: no-slip days in the last 7, and in the
first week "6 of your first 7 days". Stepping down: this stretch, with the best beside it. For 72 hours after a
run-ending slip, hours since it (the owner, October 21). The way to graduation stays off Today until 30 days hold, and
lives in Milestones from day 7 as now.

**One tap away, and where.** Level, points, badges and the forms: Milestones, from the flame row. The mode chip: More
only. The days card and the step-down ruler: Journal, Days (already there). Today's entries: Journal, Days, today. The
Sunday goal's "2 of 5 nights": the standing row's line, Monday to Saturday. The first-pattern line: a one-time calm-day
moment, then Journal, Pattern.

**Merge or cut, by CLAUDE.md's question.**

- Points: keep the rules (the source of truth for levels; earned stays earned). Remove every "+N points" and the level
  bar from Today. A number to chase is a cost.
- Levels and badges: keep both, in Milestones. The flame's form name is the only level word on Today ("a Torch"). The
  level-up celebration stays (the flame growing is the identity picture). Badge pop-ups become quiet toasts.
- Weekly quests: already retired. Remove the quest card and quest celebrations from the app; the legacy rule stays so
  points earned stay.
- Rekindle missions: rebuild as roadmap move 3. Until then, take "Decide now" off Today: the run question belongs in
  the sunrise check, where the owner put it.
- Modes: keep all three rules (step down is real clinical practice). Cut the chip from Today. The auto-switch notes
  stay as one-time moments.
- Streak-like numbers: "best 56 h" and "longest run" hold what was earned and may stay in the standing row. "7 of 90"
  moves as above.
- Nudges: keep, as a low-priority moment.
- Asks: keep the tip jar, the Support button at the top, and the rules. All three asks stay below Your day.

**Risks and how they are met.** Two hard things at once: the "and one more" line and the promotion rule; the hard-hours
card outranks everything but a live pause. The big flame sky leaves Today: the small flame row keeps it one tap from
Milestones, where the form still grows. "Today so far" moves to Journal: the toast after logging and the standing row's
"1 logged today" cover it. Showing or hiding is UI only, so nothing earned or synced changes; the graduation gate is
display only (`ready` and the award stay). The sunrise check for every slip in every mode adds sunrise points for more
people, which only adds.

**Steps (each one commit; each marked with its effort):**

1. **Medium.** Core `moment.ts`: the priority list as data with words and the action, plus tests across scripted days.
2. **Medium.** Today rebuilt on it: header, the moment card, the SOS block, the standing row, Your day as rows, the asks
   under it. Points chips, the level bar and the mode chip removed from Today.
3. **Medium.** The pieces moved: entries to Journal, the Sunday goal line into the standing row, the mode label on
   More, the small flame row opening Milestones.
4. **Medium.** The graduation number on Today waits until 30 days hold; Milestones keeps the line from day 7. Tests in
   `graduate.test.ts` and `hero.test.ts` updated.
5. **Low.** The quest card and quest celebrations removed from the app; `core.js` untouched.
6. **High.** Roadmap move 3: the sunrise check and the comeback flames for every slip in every mode, lighting themselves
   from what the person really does, the run question inside the sunrise check and off Today. Points for the sunrise
   check unchanged; nothing earned is taken away.
7. **Medium.** The story-test harness: a scripted week of a made-up person walked through the real web app with a
   picture per day (Playwright against `expo export --platform web`, the clock fixed with `page.clock`, the log seeded
   into `localStorage` under `daybook:` keys; the review's pictures were made this way).

**Done (October 22, 2026), all seven steps.** Today is the one card (core `moment.ts` `pickMoment`), SOS, the standing
row (`standRow`) and Your day as rows. The sunrise check comes after every slip in every mode (`sunriseDue`); three
flames light themselves (`rkLights`); from `RK_BACK_FROM` (2026-10-19) a waiting run is also saved by the sunrise check
plus the third flame (core.js `rkThirdOf`, beside the old missions, which still save it). `npm run story` walks two
made-up people through the web app.

**Changed (October 24, 2026): no "morning after" card.** The owner: it asked "what came before the slip" with no context,
and it sat on Today all day (seen at 5:27 PM). The card and its questions (what came before, last night's screens, the
if-then plan) are gone. Coming back is now the sunrise check: Today marks it (`srDone`) the first time it opens on the
day after a slip (or a later day while the run waits), so the second flame, the +15 points and saving a run by coming back
all still work with nothing to answer. The rule for points did not change, so past days count the same. The one question
left is the run's, when the slip's Rekindle closed before "keep it going or start fresh?" was answered (`sunriseAsk`):
a sunrise-check card says "Your run question from last night is waiting", in the morning only (rollover to noon), until
it is answered; unanswered, the run is simply kept for now. The sunrise screen asks only that.

**Changed (October 24, 2026): the next stop grows in Your day.** The owner asked for both: the card at the top of Today
stays, and in Your day the stop that is next grows in place into a bigger card in its own colors, with a full-width
button (its own word: Start for a lesson, Check in, Start the wind-down). The other stops stay slim rows. Both open the
same thing (core `openTile`, which also turns a lesson behind an account into a re-read).

Choices made on the owner's behalf, to revisit if they feel wrong:

- The third flame is "the next urge ridden out, or a full day with no slip" (the open question above).
- The talk-through waiting to decide ("Deciding at 9 PM") and the "Your plan, talked through" state are not the card;
  the card shows decide now, it passed and look back, as listed.
- The "hard hours held" card left Today; the toast when they are kept says it, and the count stays in Milestones.
- The Sunday goal's extras (the if-then plan, the harder day, the note) moved with the goal card to Journal, Days.
- The first pattern is the card for one day only (kept on the device), then it lives in Journal, Pattern.
- A reminder note that is not "paused" is the card only once the day is done.

Left, not in the seven steps: badge pop-ups as quiet toasts (the review's "merge or cut" list; the story runs show
pop-ups most days). The slip's own Rekindle scene still lists "one small thing" as its only mission.

### Feedback and opt-in counts (the owner, October 22, 2026)

The owner chose: **opt-in counts** (off until the person says yes), an **anonymous feedback box**, and four questions to
answer first: do people come back after a slip, where setup loses people, which features are used, and do people stay
(1, 7 and 30 days). This changes the rule "never add analytics" in CLAUDE.md, by the owner's choice, to the narrower
rule below.

**The promise (what CLAUDE.md, the privacy page and the store label will say):**

- Off until the person turns it on. Asked once, at a calm moment (never after a slip, never in the hard hours), and a
  switch in More at any time. Saying no changes nothing else.
- What is sent is a short list of counts, once a day, for days already over: "opened SOS 2 times", "finished setup",
  "came back 1 day after a slip", "day 7 of using Daybook". Never a word the person wrote, never a time, never a trigger,
  never an id, never the log.
- The server keeps only **totals per day** ("SOS opened 41 times on October 30"). It never stores one person's counts,
  so nothing can be traced back to a person, even by the owner. No IP addresses are kept.
- The words of every count are listed on the privacy page, and the app shows the person exactly what it would send.
- Feedback is typed in the app and sent with no name and no email, unless the person adds one to get a reply.

**How it is built.**

- **Core, `packages/core/src/pulse.ts` (new).** The fixed list of counts (any other name is refused on both ends); the
  day's counts kept on the device; the batch for the days that are over; the counts worked out on the device:
  - _Do they stay:_ one "active" count a day, in a band of days since Daybook was first opened (day 0, 1, 2 to 6, 7 to
    13, 14 to 29, 30 and on). Totals per band give the 1, 7 and 30 day picture without knowing who anyone is.
  - _Setup:_ the furthest setup page reached and whether setup was finished (kept on the device from the first page,
    sent only once the person says yes, so a person who closes setup and comes back later still counts).
  - _Features:_ SOS opened, each tool used, Talk it through finished, a lesson finished, a check-in, the sunrise check,
    the morning questions, a Rekindle step.
  - _Comebacks:_ when the app is next opened after a slip, how soon, in bands (the same day, the next day, 2 to 3 days,
    4 to 7, longer). Only the band is sent, never the slip.
  - The platform (iPhone, Android, web) and the app version, so a bug in one build shows.
- **Server, a new function `daybook-pulse`**, apart from the sync function, so the open (no sign-in) door can never reach
  anyone's log. Its own table `daybook-pulse` (pk = the day, sk = the count's name, n = the total; feedback as its own
  items, kept 180 days). Routes, through CloudFront like `/sync`:
  - `POST /pulse` (no sign-in): one day's counts. Every name is checked against the list, every number capped, the body
    small; a ceiling on writes a day, so no one can run up a bill.
  - `POST /pulse/feedback` (no sign-in): the words (up to 2,000 characters), an optional reply address, the platform and
    version.
  - `GET /pulse` (signed in, and only as the owner): the totals for a range of days and the feedback.
  - Its role is made in `infra/bootstrap` (**the owner runs it once**, as before): it may only add to and read the pulse
    table. The function, table and routes are in `infra/app`, so a deploy makes them.
- **App.**
  - The ask, once: a Today card on a calm day from day 2 ("Help make Daybook better for the next person?"), Yes / No
    thanks, with "See exactly what is sent".
  - More: a switch, the list of what was sent last, and **Send feedback** (a sheet: a text box, an optional reply
    address, Send).
  - **Stats** in More, seen only when signed in as the owner: comebacks, the setup funnel, features, the 1/7/30 day
    picture, and the feedback.
- **Words that change:** CLAUDE.md (the rule), `privacy.html` (a section that lists every count), `about.html` and
  `llms.txt` ("no tracking" stays true; "no analytics" becomes "anonymous, opt-in counts"), `docs/launch.md` (the App
  Store privacy label: Usage Data, Product Interaction, not linked to the person, not used for tracking, and the same in
  Google Play's Data safety form). **The owner updates the labels in App Store Connect and Play Console before a build
  with this ships.**

**Steps (each one commit; each marked with its effort):**

1. **High.** CLAUDE.md's rule, and core `pulse.ts` with its tests (the list, the bands, the batch, the device-side
   counts; nothing in a batch can carry a word, time, trigger or id).
2. **High.** The `daybook-pulse` function and its tests (checks, caps, totals only, owner-only reads); `infra/bootstrap`
   role; `infra/app` table, routes and CloudFront path; deploy workflow builds it.
3. **High.** The app sends: the counts wired into the screens, the daily send, and nothing at all while it is off.
4. **Medium.** The ask on Today, the switch and "what is sent" in More, Send feedback.
5. **Medium.** The privacy page, About, llms.txt and launch.md.
6. **Medium.** The owner's Stats page.
7. **Owner.** Run `infra/bootstrap` once; set the GitHub secret with the owner's account id (Stats shows it); update the
   App Store and Play privacy labels.

**Done (2026-10-22, high):** steps 1 to 3. The counts are built and tested end to end against a stand-in server, but
nothing is sent yet: the pulse is off in Terraform (`var.pulse`) until the owner applies the bootstrap stack, and the app
only asks once a build has `EXPO_PUBLIC_PULSE_URL`. Setup's funnel counts every page up to the furthest reached,
including pages that were skipped because they did not apply (the reminder page on the web, the tip page on Android, the
account page when signed in), so read those three as an upper bound. Next: steps 4 to 6 (medium).

**Done (2026-10-22, medium):** steps 4 to 6. Today's ask (core `pulseAsk`: from day two, 9 AM to 8 PM, no slip today or
yesterday, not soon after an SOS, never beside the account or tip ask), the Anonymous counts sheet (`/counts`: what is
sent, what never is, the last batch exactly, the switch), Send feedback (`/feedback`), the privacy page (every count
name, with a test that fails if one is missing), llms.txt, and the store labels in launch.md. Stats (`/stats`) reads the
totals and feedback as the owner; it appears on More once this device has opened it as the owner, so the first time it
is opened by its address. Stats signed in as the owner is not tested yet (it needs the pulse on). Left: step 7 (owner).

## iPhone bug hunt (October 19, 2026)

The iPhone app was walked in the iOS Simulator (iPhone 16 Pro, iPhone SE 3rd generation, iPhone 16 Pro Max, iOS 26.5) as
made-up people: A, brand new at 11 PM (SOS before setup, the whole setup, the first check-in); B, day 3 the morning after a
slip (Sunrise, the Today cards); C, about 60 days in (many logs and lessons, a slip on day 60, the Sunday review, the
Journal calendar, the pattern). Also dark mode, the largest text size, VoiceOver labels, the keyboard, a forced quit, and
the notification prompt. Every log was made up on the spot; no one's real data was used.

**Found and fixed**

- **A big gap above every tab page's title.** `Screen` padded the top by the safe area and iOS added it again
  (`contentInsetAdjustmentBehavior="automatic"`). It is `"never"` now. Sheets (points, a day, an entry, a badge, the
  account) had the same extra band and lose it on iOS too.
- **Learn flashed a wrong layout when it opened** (the header, then an empty map, then a jump to the next lesson). The page
  scrolled to the next lesson only after it was drawn, and the lands near it were drawn a moment later. It stays out of
  sight until it is in place, then shows.
- **The points number was cut off at the top** ("How your flame grows"). A 30-point number sat inside a body line with a
  21-point line height, and iOS clipped it. It is its own line now. The other big numbers (Today, the slider, the Sunday
  review, setup) were checked and are whole.
- **Opening and closing a tile in Settings (and every collapsible tile) lagged for up to two seconds.** Timing it showed the
  animation restarting about 60 times per tap: the content was squeezed with the growing box, its measured height
  changed every frame, and each change started the animation again. The content is measured out of the flow now; one
  tap is one animation of about 290 ms.
- **The Journal calendar put every date under the wrong weekday.** Seven cells of 100/7 percent rounded up on iOS, so
  Saturday wrapped to the next line. The month is drawn in week rows now.
- **The loop picture's arrows (setup, the habit lesson, Talk) were drawn off their lines**, one pointing backwards: SVG
  markers render badly on iOS. The heads are drawn as part of each arrow.
- **At the largest text sizes, words broke in the middle** ("Tuesda / y", "Tod / ay") and the tab bar covered half the
  page. Every Text now comes from `components/text.tsx`, which lets text grow up to 1.5 times (headings 1.25 times, tab
  labels and words on pictures about 1.15 times). The hero card and SOS were fixed at that size too.
- **Setup forgot its place.** It was kept only in memory, so if iOS closed Daybook in the background, a new person started
  again at the first question. It is kept on the device now (never synced) and let go once setup is saved.
- **On a phone with a Home button, the raised SOS button covered half of its label.**
- **The reminder offered after a late check-in was 11 PM**, against the rule that Daybook never picks a night time by
  itself. A check-in after 10 PM offers 10 PM.
- **Setup's sample "When it happens" chart had its hour labels in the wrong places** ("6 PM" under the 10 PM bar).
- Smaller: a band of the page color behind the clock and battery, so scrolled cards no longer run under them; Journal days
  say what their times are ("Logged at 9:30 PM"); Rekindle writes points with a comma; the Sunday review's week bars all
  show their date; lone links at the bottom are centered; setup's 10:00 PM fits on one line; "Very strong" fits in SOS;
  the backdrops that close a sheet are buttons for VoiceOver.

**Checked, nothing wrong:** points and level never dropped with a slip on day 60 (2,935, then 2,940 for the honest log;
level 38 kept); SOS before setup saves the entry and carries it into the first day; Sunrise and Rekindle; the keyboard
never covered a text box; the notification prompt shows on the setup page from a fresh install; dark mode; the Pro Max.

**Left, with why**

- **The day after a first-week slip, Today's flame says "No slip · 0 of the last 1 day."** It is the rule for the first
  week (`graduate.ts`), but a big zero is the first thing seen the morning after. A design call for the owner.
- **The Sunrise plan choice "Use Reach a person in Daybook."** reads oddly. The words are in the legacy rules and the
  golden fixtures, and saved plans hold them, so changing them needs a word map in `normSettings`. The owner's call.
- **The Sunday review's clock picture is shrunk to make room** even when there is room to spare (the shrink-to-fit for
  short phones). Changing it touches every page that fits a picture; worth its own careful pass.
- **Seen once, not repeated:** with the on-screen keyboard up, the first tap on "Add" in the review's own-words box only
  closed the keyboard; in setup, a second tile tapped right after the first was not picked. Both worked every other time.
- **Not walked:** a real account (user D). Signing up needs an email code, and the simulator has no address I control, so
  sign up, sync, sign out, sign in and Delete my account were not tested. Rotation is off on purpose (the app is portrait
  only). The SE could only be checked through links: tapping on it needs a one-time OK in the simulator panel.
- Support opens the tip page in Safari on iOS. App Store rules (3.1.1) are strict about payments that leave the app; it is
  worth a look before review, if that has not been settled already.

### Part 2: the screens part 1 did not walk

Walked on the iPhone 16 Pro (light and dark), the largest text size, the iPhone SE (3rd generation) and the iPhone 16 Pro
Max, as the made-up person C (about 60 days in): the More tab and every Settings section, My plan (all four panes, an
if-then plan and a reason edited, a calm move added, the slip steps), a full lesson read, practiced and finished, a
checkpoint, Talk it through to the end, every SOS tool's first screen and a breathing session, the morning questions,
the wind-down and good night, Going deeper, the mode, growth, milestones, points, day and entry sheets (an entry edited
and deleted), every help page, the sources and privacy.

**Found and fixed**

- **The keyboard covered text boxes low on a page.** No page, sheet or full-screen moment made room for it: in My plan,
  "Add a calm move" sat completely under the keyboard. They all make room now, and a page or sheet lets the keyboard be
  dragged away.
- **Owner's rule: no link that only does what the X does.** "Not yet" (wind-down), "Not now" (SOS, the log, Going deeper
  twice, Reach a person) and "Later" (morning) are gone. The pause keeps its "Not now", because it also stops the timer.
  The rule is in CLAUDE.md.
- **The wind-down did not fit:** its note ran into the home bar and "Not yet" was off the screen; on the SE the main button
  was too. The night sky shrinks, then steps aside. Good night's button was below the fold for the same reason.
- **The sleep and check-in sliders jumped about 70 points under the finger** on the first touch, because "Skip this one"
  vanished. The link keeps its room now.
- **"Behind this lesson" stopped short of the screen bottom**, with the lesson's Next button peeking out under it. It is
  laid over the whole screen now.
- **In a lesson's question, the comment under a picked answer could land below the card's edge.** The card scrolls to it.
- **A page opened over a sheet or a full-screen moment had an empty band at the top** (Settings from the privacy sheet;
  My plan, help or Settings from a lesson). It no longer pads for the status bar there. The checkpoint's "Read it in My
  plan" leaves the checkpoint first, so Back says the right place.
- **"Add an entry" had its two answers at the top.** They sit low now, by the thumb.
- **Deleting an entry asked below the fold**, cut off. The sheet scrolls to the question.
- **At the largest text size, My plan's tabs broke mid-word ("Learne / d").** Tab names stay on one line.
- **Settings said the Rekindle quest must be done "by the next night"**; the rule is three days (Where I am says so too).
- Smaller: the slip steps editor said "If I slip" twice; Settings' screens-off time had two labels; Settings said "Changes
  save as you type" where nothing is typed; the reasons editor put four group buttons between the box and Save (the
  groups come first now, so Save stays above the keyboard).

**Checked, nothing wrong:** every Settings switch, stepper and chip, the theme, the celebration preview, reminders (the
notification prompt), the lock prompt, saving and restoring (the file pickers open), the delete-everything question
("Keep my log"); reordering and reading reasons; the safety net and next steps; Talk's science cards and its plan; the
breathing timer; the help pages' links and Copy buttons; points never dropped. Graduation was not reachable (62 of 90),
and its route sends a person who has not graduated to Milestones, as it should.

**Left, with why**

- **Today offers a locked lesson as "Next up" with Start and "+10 points"**, and Start opens the account sheet. Without an
  account this happens every day after lesson 3, including the morning after a slip, which the account rules otherwise
  keep quiet (`accountAsk`). A design call: skip locked lessons in Next up, or say "opens with a free account" on the card.
- **On the SE, a few full-screen moments scroll** (Good night with its tips, a lesson's cover, Move's list). Everything is
  reachable and the main button is the last thing; the screens are simply taller than 667 points.
- **The software keyboard could only be tested on one page** (My plan's lists): the simulator lets it be turned on only
  while it is in front. The same setting is on every page, sheet and moment, so the rest should behave the same.
- A dev build shows "Open debugger to view warnings" on a cold start; it is not in the shipped app and was not traced.

### Part 3: graduation, the on-screen keyboard, and the iPhone SE

Walked on the iPhone 16 Pro and the iPhone SE (3rd generation) as a made-up person G: Day 1 on July 11, ten slips in the
last 100 days, so October 19 is 90 of 90 (seeded straight into the simulator's storage; nothing real). The hardware
keyboard was turned off, so every text box was tried with the on-screen keyboard. The SE's moments were measured (content
height against the 667-point screen), not only looked at.

**Found and fixed**

- **Graduation never happened on a fresh open.** At 90 of 90, opening Daybook went to Milestones instead of the
  celebration, and the award was not kept. Today records graduation as soon as it draws, but on a cold start the store
  still held the empty starting snapshot at that moment, so the change was made to nothing and lost. The store now holds
  what it loaded before anything draws. The same timing could drop the other changes Today makes on opening (the start
  moving to the first log, step-down counting). Checked after: the celebration opens once, the date is kept, a later
  visit to Today does not open it again, Milestones shows "See your graduation", and Today keeps the same cards with the
  flame in its cap and "Graduated · 90 of the last 100 days".
- **The graduation screen scrolled on every phone**, with "Keep going" as a small button in the middle of the page. It
  is a full-width button at the bottom now, and the flame gives up room on a short phone.
- **The keyboard covered the Save, Add and Done buttons under text boxes.** iOS scrolls a page only far enough to show
  the caret, so the box's lower edge and its button stayed under the keyboard (My plan's own-words lines, an entry's
  note in its sheet, and others). Every text box now brings itself and its button up to just above the keyboard
  (`components/keyboard.tsx`, used by every TextInput). In a sheet it also allows for the sheet starting lower on the
  screen. Checked with the keyboard up: My plan (Why, own words, a new rule, calm moves added and reworded), My reasons
  (add and the longer why), an entry's note, and the check-in's line about the day.
- **On the SE, Today's "90 of the last 100 days" ran under "Level 47 · Full Sun".** The words beside the big number
  wrap to a second line now.
- **On the SE, the check-in, the morning questions, the wind-down and the graduation scrolled** by 2 to 30 points. On a
  short phone a moment's parts sit a little closer, the big slider number is a little smaller, and the slider's waiting
  ring is smaller. All of them fit now, with the main button at the bottom. Talk, SOS, the quick log, the Sunday review,
  Go deeper and the tools (pause, breathe, move, 5-4-3-2-1, what do I need, name the thought, reasons) already fit.

**Checked, nothing wrong:** the largest text size on the graduation screen (it scrolls, the picture steps aside, Keep
going is the last thing) and on Today with the graduated card; setup's first pages and Talk's first steps; a slip after
graduation does not take the award away (the core test covers it; it was not walked in the simulator).

**Left, with why**

- **On the SE, Good night still runs about 60 points past the screen** because of its tips card ("If the thoughts get
  loud"). Everything is reachable and the button is last. Folding the tips into a tap is a design call.
- **Reach a person** is a list, so it scrolls on the SE by design. Sheets scroll too, as pages do.
- **On the SE the graduation flame steps aside** to fit the facts and the button. The cap still shows on Today and in
  Milestones. If the flame matters more on the celebration than the tip line, the tip line could move to the award page.
- **The yellow bar under Today's "90 of 90" is level progress,** and right under the graduation count it reads as
  progress toward graduation. Worth a look when Today is next touched.
- **Not walked with the keyboard:** setup's later text boxes (its own words, the person, who I am becoming), Sunrise's
  own plan (Sunrise only opens the morning after a slip), the Sunday review's note, and the SOS tools' own-words boxes.
  They use the same text box and the same pairing with their button, so they should behave the same.

**Decided after part 3 (October 19, 2026; the owner asked Claude to pick):**

- Next up never offers a lesson that needs an account. Without one, the lesson stop is a re-read of an open lesson.
- The day after a slip with no slip-free day in the window, Today says "Still going · Today counts" instead of a big zero.
- The Sunrise choice now reads "Open Reach a person in Daybook." (rules and golden expectations updated; old days keep
  what they saved).
- Good night folds its loud-night plan into one tap on phones shorter than 700 points, so it fits the SE.
- ~~The tip link is on the web only.~~ Reversed by the owner on October 20: the tip jar is part of the app and was
  wanted. It is back on iPhone (US storefront, 3.1.1(a)); see "Tips" under Launch site.
- Left as they are: the review clock's shrink-to-fit, the graduation flame stepping aside on the SE, and the level bar
  under "90 of 90".

**Onboarding and sign-in pass (October 19, 2026):**

- Setup is hard to skip. The "Skip setup and start a tracking week" link is gone. Closing SOS (or a tool or log opened from
  it) brings setup back, and so does Daybook coming back from the background. Only setup's own X keeps the welcome page up,
  until the next time. Checked on the web build and on the iPhone 16 Pro simulator.
- Setup ends with "Your plan is ready. Keep it safe.": a free account as the main button, "Keep it on this phone for now"
  as the quiet link. It is the last page before "Welcome in", after the plan is saved, and it drops out by itself once the
  person is signed in. No Back button there (the plan is already saved).
- "Sign in" on the welcome page and setup's first page now opens the account sheet on its Sign in tab, titled "Welcome
  back", instead of on Create an account. The keep-me-signed-in box no longer shows on the welcome page before sign-in.
- The free page said "Nothing locked"; lessons after the third open with a free account, so it says "No subscription",
  and the support page says "nothing behind a paywall".
- SOS before setup says "Setup can wait. This comes first." instead of "You can set up Daybook later."
- Not tested: creating an account and the email code (it needs a real inbox), and signing in to an account that already has
  a log. Those need the owner on TestFlight.

**Sign-up without an emailed code (October 19, 2026):** the pre-sign-up trigger confirms new accounts made in the app and
leaves the email unverified; Settings offers "Confirm your email" (a code, then password reset works), and a reset for an
unconfirmed email says so plainly. Built and tested (unit tests, Terraform validate); the owner applied `infra/bootstrap` and
`auto_confirm` is on. Not yet tried against the real Cognito from a phone.

## The remap (October 17, 2026)

A full walkthrough at phone size (new, day 3 after a slip, day 60) found that Daybook has grown into too many separate
systems: about 13 counters on Today with five different day counts, six reward systems, and a plan that read like a form.
The fix is fewer, bigger things, with nothing earned taken away. The owner's answers (October 17): yes to moving the day
numbers off Today, as long as Today stays extremely useful and motivating; yes to retiring quests and the wins ring; yes to
the merges; **no** to shortening setup (see step 5).

| Step | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Effort |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | Smoothness: pages, panes, opened cards and lesson cards ease in; Back names the page underneath; closing a tool or lesson returns to the page it was opened from; setup wording. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Medium |
| 2    | Today: one flame card with one day measure (the last 7 days, then the graduation count), one "Your day" list; runs and the month move to Journal. Today must stay extremely useful and motivating. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Medium |
| 3    | Progress: the flame and badges only; retire weekly quests and the wins ring (points already earned stay); five plain lines for how points work. **Done** (quests stop for weeks that start on or after October 19, 2026).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Medium |
| 4    | My plan and My playbook as one page (Why, Plans, Lists, Learned) that reads like a page and changes in place. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | High   |
| 5    | Setup keeps every screen; they are there for a reason. **Later, once the remapping is finished:** rework the setup screens' look, and bring back the old app's pictures of the app itself (`legacy/index.html` `obPicToday`: a small phone showing Today with notes pointing at the flame, the lesson and SOS; `obPicSos` with the tab bar). The owner found the old setup visuals much better. **Done** (October 18: each part washed in its own color, the page a white card, the legacy pictures back, answers low).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | High   |
| 6    | More and Settings as one tab; Learn: one path numbered in order, one lock line; Journal day rows. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Medium |
| 7    | The day's stops: Last night is two big taps that finish themselves (celebrations wait until then); the check-in is a one-minute full-screen moment, one question at a time; "Phone away" finishes the wind-down, and Good night carries the plan for a loud night and a missed check-in; Next up says "2 of 4 done"; the check-in's save words use the no-slip measure, not a run. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Medium |
| 8    | Talk it through: for a slip that feels planned, owed or certain, or when caring is low. Who it is for, what the mind is doing (moving pictures, each with its source), a talk (what the wanting is after, how much a different night is wanted), then three honest paths: change the plan, decide later, or go ahead with eyes open and look back (expected against what it gave, kept as evidence; the slip is logged). In SOS, the tools, and a low-motivation check-in. **Done.** Its science is also lesson 9 in Learn, “The picture and the real thing” (with Rekindle’s).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | High   |
| 9    | Hard hours: Daybook learns the two-hour window when slips (and urges, and talk-throughs) cluster, weekdays and weekends apart when it can. From two hours before, a bold card at the top of Today pushes Talk it through; a phone heads-up 90 minutes before (Settings, on by default); after a clean window, "You got through 9 to 11 PM", a calm move kept for good. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | High   |
| 10   | Rekindle, rebuilt in the style of Talk it through: the embers, then everything kept appearing one by one; "Right now, how do you feel?"; up to three short cards that fit the feeling (moving pictures, each with its source; cards read before are one line), always ending with kindness; your own record of clean days before each slip (also on the morning-after Sunrise); then the quest. A run "can keep going" instead of being "on the line". **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | High   |
| 11   | Your pattern (Journal, in place of Patterns): up to three plain sentences at the top, each jumping to its graph; are slips getting further apart (clean days before each slip with a trend line, and ridden out week by week); when (a 24-hour clock with the same hard hours as Today, and the days of the week); what sets it off (and what the pull was after); what is different on hard days (only differences that mean something); what helps. Points each day moved to the Points page. **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | High   |
| 12   | The Sunday review, in place of the older ten-minute weekly review: a walk through the week on Sunday (and Monday, while last week is open), one screen at a time like a year-in-review story: the seven days, urges ridden out, when it came, what set it off, what helped, the slips (kindly), sleep and the other foundations, last week's goal, and eight weeks side by side (a better week is named; a harder one says what held). Each screen has one line of science with its source and lesson, and one longer card fits the week's hardest pattern. Then your take (what worked and what to change (Daybook's suggestions from the log, each with what it saw, or your own words), and one small goal for the week, then All done, with optional extras: an if-then plan for the hardest moment (shown in SOS and on Today), the harder days ahead (marked on Today), and a note to yourself, shown from Wednesday on. Goals the log can count (phone away, winding down, sleep, check-ins, reaching out, a lesson) show their progress on Today all week; older reviews stay readable in Journal > Weeks; an optional Sunday reminder on phones. **Done.** | High   |

| 13 | Learn as a map (October 18, the owner picked "stepping stones" from eleven mockups, and asked that it not look like Duolingo): the lessons are stones on one path through a land for each section, top to bottom, each land with a picture of its topic (core `section-art.ts`), its own sky and hills, trees and flowers, and a warm evening with stars and fireflies in dark mode. Done stones carry a check, the next one has a pin over it and its name beside it, the road walked glows gold; a tap opens a card with Start (or Read it again, or the account a locked lesson needs). A signpost starts each land, a trophy ends the path, and a floating card says which section is on screen. The order finished moves under the map. Lessons are often done out of order (from Today, a check-in, a help page or a review): each shows as done in its own place, the road glows gold between any two finished lessons, a lesson finished today wears a Today tag, and Up next is always the first lesson not done, the same on Today, the map and a lesson's Next button. Layout and its tests in core `lesson-map.ts`. **Done.** | High |

## The walk of October 18: three people, five fixes

After the remap, Daybook was walked at phone size (390 by 844) as three people: someone opening it for the first time at
11 PM, someone on day 3 the morning after a slip, and someone on day 60 who has just slipped after 49 clean days. Mockups of
each fix (the real screen with the change painted on) went to the owner in the chat. The owner said to build 1, 3 and 5, and
to think 2 and 4 through first (October 18).

Ranked by how much each one protects hope, and how likely it is to make someone quit:

| #   | Fix                                                                                                                                                                                                                                                                                                                                                                                                                       | Who it hurts now                                                                                                                                    | Size   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | **Help comes first, even before setup.** SOS works with nothing set up (`sos.tsx` redirects home when there are no settings); an "urge right now?" row on the first setup page and an SOS pill on every setup page; Learn, Journal and More say what setup opens instead of being blank. **Done.**                                                                                                                        | The 11 PM first-timer: SOS first appears on page 20 of 40, and a tap on SOS before setup does nothing. This breaks "never lock care".               | Small  |
| 2   | **After a slip, the run waits.** The first slip in 7 days no longer puts the run on a one-day clock: it waits three days while the Rekindle quest is done, every mission still required (the owner's reason: keeping a run after a slip should take work, but stay possible). A quest that closes unfinished, or a second slip, is told the next morning with what is kept. Thought through below; **done as version 2.** | The day-60 person: "Keep your 49-day run going · 0 of 4 lit · ends tomorrow night", at the top of Today a minute after the slip.                    | Medium |
| 3   | **One day number, and never "Day 1" after a long run.** "Day 1 of your comeback" became "The morning after" on Today and "Welcome back." on the sunrise check ("49 days, still yours" waits for fix 2, since the quest still asks to keep the run); the tracking-week chip "Day 1 Sun" says "Counting starts Oct 25". **Done.**                                                                                           | Everyone: Today shows two or three day numbers at once ("day 61", "Day 1 of your comeback", "58 of 90"; "Day 1 of 7" and "Day 1 Sun").              | Small  |
| 4   | **The morning after: one thing at a time.** The sunrise check holds last night's questions; Today shows it, SOS, and "the rest of today can wait"; the Sunday review waits until later in the day. **Thinking it through.**                                                                                                                                                                                               | The day-3 person: six asks at 7:40 AM (sunrise check, one small thing, Last night, the Sunday review, Good morning, the lesson), two of them alike. | Medium |
| 5   | **Never cover the answer.** Messages (like "+5 points, you got through 9 to 11 PM") never sit over answers, wrap instead of cutting off, and wait while a slip is being logged. **Done:** at the top in full-screen moments, low on the tabs, and one from before stays behind when SOS or the log opens.                                                                                                                 | The day-60 person: the message covers the "I slipped" button at 10:45 PM.                                                                           | Small  |

Also seen, smaller, and decided by the owner (October 18, **done**): a level reached on a day with a slip is earned and
shown at once, but its celebration waits for the next day's first tap (core `checkNew`); "Quit for good" suggests "Quit,
starting tomorrow", on a first try too, and the tracking week stays for "understand my pattern" or no answer (core `obSuggest`). (The Sunday review's
seven-day strip looked wrong in the first screenshots, but that was its pop-in animation caught halfway; it is right.) What worked well: Rekindle itself (the embers,
"Still burning. Still yours.", the cards and the record of clean days), the Sunday review's kind words about the slip, and
the graduation count holding at 58 of 90 through the slip.

### Fix 2, thought through: the Rekindle quest (October 18)

**Why it exists.** A run is a record of keeping your word, day after day. Without a save, one slip drops it to zero, and a
cliff like that is exactly when "I already blew it" wins. The quest is the bridge: the first slip in any 7 days can be saved,
but only by doing what stops one slip from becoming a slide (one small thing within the hour, the phone away that night, the
sunrise check the next morning, and for a run of 14 days or more, tracing it back or telling someone). If saving were free,
the run would only count days since install, a slip would cost nothing, the recovery work (which is the actual treatment)
would have no pull, the person who handled a slip well and the one who spiraled would look the same, and saves would become
routine. The owner: keeping a run after a slip should take work, and it must stay possible.

**How it works today** (legacy `runLedger` and `rkOf`): first slip in 7 days only, a run of 1 day or more; three missions,
four from 14 days; all done by the end of the next day; a saved slip day counts in the run; 3 of 4 counts for nothing;
"screens stayed on" for that night makes it impossible at once; a second slip within 7 days cannot be saved.

**The walk** (four people and one more, screenshots sent in the chat):

- Feels right: the embers ("Still burning. Still yours.", "49 days. That is huge, and it still counts."), the missions
  themselves, and the save (celebrations, the badge, "Run saved: 51 days", the gold mark on the calendar).
- Threatened: the quest's headline "Keep your 49-day run going ... by tomorrow night" a minute after the embers; "0 of 4 lit ·
  ends tomorrow night" at the top of Today; "Finish the rest by tonight", shown right above "You are in your hard hours".
- Hopeless: 3 of 4 done, the deadline passes, and Today says nothing (Journal: "Longest run 49 days · Next goal 3 days");
  a second slip 3 days after a save ends the run in one line ("Your next run starts tomorrow"); and an honest "Not this
  time" to "did screens go off?" ends the run on the spot, under "Honest beats perfect. It counts either way."
- Confusing: Rekindle's record says 16 clean days before the slip while the quest says a 9-day run (the record counts the
  tracking week).

**Versions** (all keep the first-slip-in-7-days limit, every mission required, and the 4th mission for 14 days or more):

1. **Same quest, fair rules.** The clock stays (through tomorrow night). Phone away counts on either night, so an honest
   answer never ends a run; the words lead with saving ("Save your 49-day run. Four steps, through Monday night.");
   when a run ends (the clock, or a second slip), one card says so the next morning: "Your 49 days are kept", the longest
   run and the graduation count, and that a new run already started. Core: `runLedger`/`rkOf` (the missed rule, phone away
   on either night), the words in `rekindle.ts`, `view.ts`, `day.ts`, `actions.ts`, and a new `rkEnded` for the card.
2. **The run waits for you** (recommended). Everything in 1, and the save window is three days after the slip night
   instead of one: phone away on any one night, the sunrise check on any one morning, before the third night ends. A
   second slip in that time still ends it. Core: the same, with the deadline in `runLedger` moved from the next day to
   three days on, and the missions read across the window.
3. **Most of it is enough** (not recommended): 3 of 4 saves a run of 14 days or more. It ends the all-or-nothing, but it
   lowers the work for the longest runs, which is the opposite of the reason for the quest.

Either 1 or 2 changes golden fixtures on purpose (the save rules), updated by hand and explained in the commit, as before.
Separately: the record's clean days count from Day 1, like the run. **The owner said to choose (October 18): version 2 is built**,
with version 1's fixes, the kept card, and the record from Day 1 (core `RK_DAYS`, `rkEnded`; legacy `runLedger` and `rkOf`
changed in the smallest way). The golden fixtures moved on purpose, by a guarded script: only moments where a slip day's
save went from ended to waiting, or a phone-away now counts on a later night (with its Rekindled bonus, so some points and
one level went up, never down), and the changed words. Next to show the owner: "Next goal 3 days" after a long run.

## Money and the App Store (October 19, 2026)

The owner's decision: Daybook stays free for everyone, with a tip jar that unlocks nothing, so it is worth the time to keep
building. No subscriptions, no ads (they need tracking), no paid streak protection (it sells fear of losing a run).

1. **The tip jar** (core `support.ts`, built; hidden until `SUPPORT_URL` is set). Today asks once: a month in, from 9 AM to
   8 PM, never within four days of a slip (which covers the Rekindle quest), never beside the account card or within three
   days of its "Not now". The account card already owns the first week, so the tip ask waits a month, when a person knows
   whether Daybook helps. After either answer it never comes back; the link stays as a quiet row on More and a line under
   graduation. The owner then asked for it to be more like ScreenZen, with How We Feel's look (October 19): the setup says
   "Everything in Daybook is free" just before its end, with a Leave a tip button low and Continue as the main button;
   Today keeps a small Support button at its top right, hidden in the four days after a slip. Messages ("+5 points") now
   sit at the top on the tabs too, so they never cover a button. On iPhone, a link out to pay is allowed on the US App Store only (3.1.1(a), after Epic v. Apple; Apple may
   win back a small fee at the Supreme Court, not before mid-2027), so the iPhone app is offered in the US only while the
   link is in it. Google Play allows outside donation links only for tax-exempt groups, so when
   Daybook goes to Google Play (the owner, October 19), tips there go through Google Play's own payments, which take
   Google Pay: a few fixed tip sizes, unlocking nothing, with the same words. The same store tips (Apple's in-app
   purchase, which takes Apple Pay) would let the iPhone app reach countries outside the US. The tip page is a Stripe Payment Link (live October 19; the giver picks the amount).
2. **The App Store, from any computer.** Actions, App Store, Run workflow (`.github/workflows/store.yml`) runs the checks,
   builds on Expo's servers and sends the build to TestFlight. The one-time setup, the listing words, the privacy label
   and the review notes are in [launch.md](launch.md).
3. **Then marketing**, in this order once the morning after a slip (fix 4) is settled: the store and a home page, search
   (lessons as public articles), communities as the owner (said plainly, asking for criticism), counselors and group
   leaders, then launch sites. No paid ads, no fake reviews or accounts, nothing aimed at teenagers, and no counting of
   people in the app: only the stores' own download counts, the tip count, and a feedback link.

## Notifications that fit the person (October 19, 2026)

The owner: plan when and how Daybook notifies, from the best apps, by how the person is doing, and adapting to how they
respond, so people do not turn notifications off. The owner said to go ahead on the suggested answers. **Built** (core
`nudges.ts`, tested in `test/nudges.test.ts`; the app's `lib/reminders.ts`, `_layout.tsx` and `components/nudge-card.tsx`).

What was there before: all made on the phone, no server. Morning, check-in and wind-down
reminders and the Sunday review are off until turned on; the heads-up 90 minutes before the hard hours is on; Talk it
through can set a one-off. They repeat daily whatever happens, the phone is asked for permission only when one is turned
on, and one Android channel holds them all.

What the best apps teach:

- **Duolingo** picks each day's reminder with a bandit that learns which messages work for each person, times it from
  when they last practiced, and stops when reminders are ignored ("These reminders don't seem to be working. We'll stop
  sending them for now."). Its strongest lever is the streak about to end. Daybook takes the learning, the timing and the
  stopping, and never the loss: a notification that sells fear of losing a run breaks "earned things stay earned".
- **Headspace and I Am Sober** ask for a time during setup and tie the reminder to the person's own commitment (a set
  time is an if-then plan). Asking in context, with a sample of the notification and how often it comes, is the common
  advice for the one permission prompt iOS allows; a "Not now" keeps that prompt for later.
- **HeartSteps** (a study of exercise prompts) found the same prompt lost about 2% of its effect each day until, by four
  weeks, it did nothing: people get used to a fixed reminder. Its next version sent prompts only when they fit the moment,
  with a daily cap. So a reminder that never changes is a reminder that gets ignored, then turned off.

The rules:

1. **Every notification is about something the person chose, is useful now, and is skipped when the thing is done.** A
   check-in done at 2 PM means no 6 PM reminder.
2. **At most three a day, an hour apart** (three, because Settings has always offered three routine reminders a person
   can choose; the setup turns on one, so most people get one a day, and a heads-up on hard days). The hard-hours
   heads-up wins over a routine reminder. Daybook never picks a time at night on its own: only the times the person set,
   and the heads-up before hard hours that fall at night, which is what it is for.
3. **After a slip, never more notifications, only kinder ones.** The next day's check-in says "A new day. Everything you
   built is still here." While the Rekindle quest is open, the check-in reminder says "Your Rekindle quest is still open.
   One small step today." On a Sunday, the check-in reminder carries the Sunday review too, so it is one notification. This joins fix 4 (the morning after).
4. **The habit takes over.** When the person checks in on their own before the reminder on 5 of the last 7 days, the
   check-in reminder becomes a backup: it comes 90 minutes after the set time (but half an hour before screens-off at the
   latest), and only if they have not checked in. Today says so once, with "Keep it at 6:00 PM" as the other choice. The goal is a person who does not need the app.
5. **Ignored kinds get quieter, then pause, and say so.** On the phone, each kind keeps a count: a tap, opening the app
   within two hours, or the thing done that day is a help; none of those within three hours is a miss. Three misses in a row step it down (daily, then every other day,
   then paused); one help steps it back up, never above what the person chose. When one pauses, Today says: "The
   check-in reminder has not been helping lately, so Daybook paused it." with Turn it back on and Leave it off (not in the
   two days after a slip, and never beside the account or tip card). Turning a reminder on in Settings starts it fresh.
6. **The time follows the person, with their yes.** When the check-in is usually done more than an hour after the set
   time (the middle of the last two weeks, at least five check-ins), Today offers to move the reminder there (again a
   month after "Keep") ("You usually check in around 9:40 PM. Move the reminder?").
7. **When the app goes quiet, Daybook fades, and stops.** Notifications are planned as one-offs (not daily repeats) for
   today and tomorrow, and planned again each time the app opens or the log changes. So if the person stays away, the
   routine ones stop after two days and four come-back notes take their place, at the time of day the app was last open
   (kept between 10 AM and 7 PM), only for someone who turned on a regular reminder, and Settings can turn them off
   ("If you are away for a while"): day 2 "Daybook is here when you are
   ready.", day 4 "Nothing is lost. One tap to pick up where you left off.", day 7 "A minute today is enough.", day 14
   "Daybook will stay quiet now. Everything is kept for when you come back." Then nothing, until they open it. This is
   the moment most people quit after a slip, so the words are all hope, never guilt.
8. **By stage.** The first week: the check-in, the Sunday review, and the heads-up once the log shows hard hours; small,
   close goals only. No milestone or points notifications ever (they are shown in the app, and pushing them makes a game
   of it). Still to build: after graduation, Daybook suggests the Sunday review alone, with a choice.
9. **The phone's own settings stay easy.** Each kind has its own Android channel (Check-ins, Hard hours, Sunday review,
   Follow-ups), so a person can quiet one without losing all. On iPhone, the morning and Sunday ones arrive quietly (no
   sound or light, `interruptionLevel: 'passive'`) and the rest normally; none is time-sensitive. If the person turns
   notifications off in the phone's settings, Daybook never asks again on its own; Settings says how to turn them on.
10. **Nothing leaves the phone.** No push server and no analytics: the counts live in the phone's storage, are never
    synced, and cost nothing at any number of people. The words still never say what Daybook is for.

**The ask.** A setup page right after the review (on a phone only, and on a walk-through only while the check-in reminder
is off): "When should Daybook check in with you?", with the time big and a sample lock-screen notification in the middle,
six evening times low, a line on what else comes and that none come at night, then Remind me (the phone's one prompt;
the check-in and the Sunday review turn on) and Not now. While no check-in reminder is on, the end of each check-in offers
one at about that time ("Remind me at 9:45 PM each day"); the hard-hours and Sunday offers stay as they are.

**How it is built.** Core `nudges.ts` holds the rules with no UI: `nudgePlan` returns the notifications to schedule (kind,
time, words, screen), `nudgeLearn` judges what was delivered when the app opens, and `nudgeCard` picks the one thing to
say on Today. The app's `_layout.tsx` runs them; `lib/reminders.ts` schedules the plan (about ten at a time, well under
iOS's 64) and hears taps; the count lives in `daybook.nudges` on the phone. A one-off from Talk it through is apart from
the plan and its cap. On the web nothing changes: a page cannot remind, so the setup page and the card do not show.
A real phone has to confirm the timing (TestFlight).

Earlier tiers, all done:

The owner's direction is in CLAUDE.md ("What the owner has asked for"). Everything here follows it. Build the tiers in order;
each tier ends with typecheck, tests, a look at the web build, and a merge to `main` (which publishes it).

| Tier | What                                                                                                | Model        |
| ---- | --------------------------------------------------------------------------------------------------- | ------------ |
| 1    | Graduation: a fun, permanent award (and remove the lighter Today). **Done.**                        | Opus, high   |
| 2    | Accounts: anyone can sign up in the app; sync, backup and most of Learn need an account. **Done.**  | Opus, high   |
| 3    | Levels: the new ladder, its pacing, and keeping every earned level. **Done.**                       | Opus, high   |
| 3b   | Accounts, redone: native sign-up and sign-in inside the app, no popup, and a better lock. **Done.** | Opus, high   |
| 3c   | Lessons: any "add this to your plan" is a one-tap button (first: the prayer lesson). **Done.**      | Opus, medium |
| 4    | Levels: the look, the art and the animations. **Done.**                                             | Opus, medium |
| 5    | Words and polish pass (long runs, slips, Milestones), and the owner's notes. **Done.**              | Opus, medium |

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

## Tier 2: Accounts

What the owner asked for: a public app. Anyone can install it, go through setup and start using it with no account. A few
things wait for an account: sync, cloud backup, and Learn after the first lessons.

1. **Never lock care.** SOS, logging, Rekindle, the plan, the tools and Today always work with no account. Learn: the first 3
   lessons in the daily order are open; the rest show "Sign up to keep going" (the lesson list stays visible, so people see
   what is waiting). Lessons already finished stay readable.
2. **Sign up in the app.** Turn on self sign-up in Cognito (`infra/app`), with email verification and the same sign-in page
   (PKCE, no secret). "Create an account" and "Sign in" sit side by side wherever an account is asked for.
3. **Ask at good moments, never in a hard one.** A friendly card after the first level-up, after the first week, and when a
   locked lesson is tapped: "Keep your progress safe, and unlock every lesson." Never on SOS, Rekindle or after a slip.
   "Not now" waits a week.
4. **After signing up**, the log already on the device uploads (sync's first run does this), so nothing starts over.
5. **Strangers' data in the owner's account**: a short, plain privacy page in the app (what is stored, that it is private to
   them, how to delete it), "Delete my account" easy to find, and CLAUDE.md's privacy rule updated (logs are kept per person,
   only readable with that person's sign-in).
6. **Abuse and cost**: keep the per-person write cap and throttling; a daily cap on new sign-ups; Cognito's built-in email
   (about 50 a day) is enough at first; move to SES (about $0.10 per 1,000 emails) only when sign-ups pass that, and tell
   the owner first. The $5 budget alert stays.
7. **Tests**: the lock rules (which lessons are open, finished ones stay open), the prompt timing, and that nothing about care
   ever checks for an account.

## Tier 3b: Accounts, redone (the owner: "native in the app, no popup, extremely smooth")

The browser sign-in page (Cognito's hosted page, opened as a popup) and the lesson lock box are replaced.

1. **Native screens, no browser.** One account sheet inside the app: email, then password (with show/hide), then the
   6-digit code from the email, which fills itself from the clipboard or the keyboard's suggestion and moves on by itself.
   Sign in, "Forgot password" (code, new password) and "Send the code again" in the same sheet. Clear, kind errors.
2. **Talk to Cognito directly** from `apps/mobile/src/lib/auth.ts`, with plain `fetch` to the Cognito endpoint (no SDK, no
   secret): SignUp, ConfirmSignUp, ResendConfirmationCode, InitiateAuth (USER_PASSWORD_AUTH, then REFRESH_TOKEN_AUTH),
   ForgotPassword, ConfirmForgotPassword, RevokeToken. In `infra/app`: allow USER_PASSWORD_AUTH on the app client, and add the
   Cognito endpoint to the web app's Content-Security-Policy. Tokens are kept as today (keychain, or the browser per trust).
3. **Right after confirming the code, the person is signed in** (no second login), and sync joins the device's log.
4. **The lock, rebuilt.** Locked lessons stay in the list with their titles; tapping one opens the account sheet straight
   away, with one line on why, and after signing up the lesson opens by itself. No wall screen in between. The account card on
   Today opens the same sheet.
5. Remove the hosted-page flow (expo-auth-session, the redirect handling) once nothing uses it.
6. Tests: the request shapes against a fake Cognito, the code step, errors, and that a confirmed sign-up signs in.

## Tier 3: Levels, the ladder

Today: 30 levels, 10 flame forms with 3 small steps each, points from `5 × i × (i + 3)` (level 30 at 4,640 points).

1. **Measure first.** From the golden fixtures and a few made-up months, find the points of a light, a steady and a full
   day. Write them down in `levels.ts` so the pacing is checkable.
2. **The new ladder: 60 levels in 12 forms of 5 steps.** Pacing goals, against a steady day:
   - Day 1: a level-up from setup alone. First week: about 5 levels. First month: the third form.
   - Then each form takes a little longer, and the last forms are a year or more away, so there is always something ahead.
   - Two new forms at the top beyond Full Sun (for example **Constellation** and **North Star**), so long-time users have
     somewhere new to go.
3. **Every form looks clearly different**, and every step inside a form adds something you can see (a new element, not just
   a brighter color). The 12 forms keep the story: a spark, kindling, campfire, torch, beacon, rising (it took the lighthouse's place on October 19), sunrise, daybreak,
   bright day, full sun, constellation, north star.
4. **Nobody goes down.** Points stay the source of truth. Every old level maps to a new level at the same form or later
   (`OLD_TO_NEW`), the kept floor in `settings.seen.level` is converted once, and the new curve is checked so that no point
   total lands lower in form than before. Level badges keep their ids.
5. **Move levels to TypeScript.** `STAGES`, `LEVELS`, `levelOf` and `nextLine` move from `legacy/core.js` to
   `packages/core/src/levels.ts` (and are removed from `core.js`), with unit tests for the curve, the mapping and the floor.
   The golden fixtures change on purpose where levels show; say so in the commit.

## Tier 4: Levels, the look

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

## Tier 5: Words and polish

0. SOS and the urge plan (the owner: yes, cleanly, without changing the flow). **Done:** late at night, the tools screen's
   line says "Your plan: When I am in bed late at night, I will …" (core `urPlanNow`, the first sentence of the line for bed or
   late at night), where it already said the Sunday plan; the Sunday plan still comes first. In the day SOS cannot know the
   feeling, so it shows no line. No new step.

1. Rekindle, the Days card, Journal and Milestones: words that honor a long run after a slip ("89 days. That is huge, and it
   still counts."), using the run that just ended. No "lost", "failed" or "reset" anywhere.
2. Setup's "Use it a lot less" goal: keep it as a gentle way in (recommended), unless the owner says otherwise.
3. Anything the owner noticed on the live site in the meantime.

## Fable review (October 19, 2026)

A read of the code, not a walk on a device: `packages/core` (the rules, sync, setup, accounts, graduation, nudges),
`apps/mobile/src` (the store, sync, auth, the setup, Today, the log, Settings, the account sheet), `services/api` and
`infra`. The iPhone bug hunts above were taken as known, and the decisions listed there are not reopened. Every
scenario below uses made-up people and dates. The one test throughout: does it help the person become, and see
themselves as, someone free of the habit?

The short version: the rules are sound and well tested; the app's words keep hope first; the weak spots are at the edges
that no test or walk has reached yet, and three of them can cost a person something they earned.

### Bugs

**1. A second device's first sign-in can replace the settings that hold earned things.** _Blocks testers._
Evidence: `apps/mobile/src/lib/sync.tsx:235-258` (`join`) and `:287-307` (`choose('combine')`), with
`packages/core/src/sync.ts:90-103` (`mergeRemote`: the newer settings record wins). The settings record holds `start`,
`day1`, `gradAt`, `seen`, the lesson notes and practice marks, the reasons, the plan and the setup record, and points
count some of it.
Reproduce: Person P has 60 days on the phone and no account. P opens the web app, does the setup there (a fresh settings
record, `start` today) and makes the account at its end. P then signs in on the phone. The account holds only a settings
record, so `accountHasLog` is false, the phone merges rather than asks, and the web's newer settings replace the
phone's. Day 1 jumps to today, the graduation count starts over, lesson notes and the plan are gone, and points drop.
"Combine them" does the same whenever the other device touched its settings later.
Fix: in `join`, when the device has a log and the account has none, drop the account's settings record before merging
(the device's settings go up with `markAllDirty`). In combine, settings follow the side with the real log (more days, or
the earlier `start`), never the newer clock. One client test: a fresh setup on a second device never replaces a log's
settings.

**2. Today asks for an account the moment setup ends, right after the person said "Keep it on this phone for now".**
_Hurts trust._ Evidence: `SETUP_PTS=20` (`packages/core/src/legacy/core.js:677`), level 2 starts at 18 points
(`packages/core/src/levels.ts:169-178`), `accountAsk` returns `level` at level 2 (`packages/core/src/accounts.ts:38`),
and the setup's link only moves on (`apps/mobile/src/app/setup.tsx:982`), so `acctNo` is never set.
Reproduce: finish setup, choose "Keep it on this phone for now", go to Today: the account card is there, on day 0.
Fix: the link applies `accountLater` (a week of quiet, the rule that already exists), and the level gate moves to the
first new form (Kindling, level 6, two or three honest days), which is the "first level-up" the plan meant.

**3. "Your account is ready" shows even when joining the account failed, and the next launch looks signed out.**
_Hurts trust._ Evidence: `apps/mobile/src/app/account.tsx:57-62` sets `done` before `startWith`; the done body
(`:129-149`) says "Your log is kept safe" unless the status is `busy` or `ask`; `startWith` catches the failure into an
`error` status with no `kept` (`sync.tsx:264-285`); at launch a session with no `kept` becomes `out`
(`sync.tsx:191-195`), which locks the lessons and shows the sign-in card again.
Reproduce: make an account with the sync API unreachable (airplane mode right after Cognito answers, or the gateway
throttled). Fix: the done step reads the status; on `error` it shows the message and a "Try again" that calls
`startWith` again. At launch, a session with no `kept` runs `join` instead of showing `out`.

**4. A stalled connection leaves "Syncing…" up for good, and no later round can run.** _Hurts trust._
Evidence: `sync.tsx:112` (`fetch` with no timeout) and `:144-148, 166-168` (`running.current` is only freed when the
request settles). Cognito calls have no timeout either (`packages/core/src/cognito.ts:66`), so the account sheet's
spinner can hang. Reproduce: start a sync and walk out of Wi-Fi range mid-request. Fix: an `AbortController` with a
20-second limit on every sync and Cognito call; an aborted round sets the "could not reach your account" status and
frees `running`.

**5. Records the account refuses are dropped without a word, and the status still says "Synced just now".**
_Hurts trust._ Evidence: `sync.tsx:156-160` ignores `r.refused`, which core reports
(`packages/core/src/sync.ts:152-179`, test `services/api/test/client.test.ts:191`). Two causes: a record over the size
cap, and a phone clock more than a day ahead (`services/api/src/sync.ts:103`). In the clock case every push is refused
and every dirty mark is cleared, so nothing ever reaches the account while Settings says it did.
Reproduce: set the phone's date a week ahead, log an urge, sync. Fix: the status keeps the refused ids ("3 changes could
not be saved to your account: check the phone's date and time"), and the clock case keeps the records dirty.

**6. The API's ceiling is 5 requests a second for everyone, and a throttled sync pauses until the next open.**
_Polish now, hurts trust with testers._ Evidence: `infra/app/api.tf:85-88` (burst 10, rate 5, for the whole API) and
`sync.tsx:132-135` (any 429 pauses with "Sync did not work this time"). Fifty testers whose check-in reminders fire at
6 PM is a burst of a hundred requests. Fix: 50 a second with a burst of 100 (still a ceiling; a request costs almost
nothing), and on a gateway 429 retry after a short wait instead of pausing; keep the pause for the daily allowance,
which has its own words.

**7. On the web, Safari can clear the whole log after a week away, and nothing says so.** _Hurts trust._
Evidence: on the web the log lives in the browser's storage (`apps/mobile/src/lib/store.tsx:3`, AsyncStorage is
localStorage there). Safari's tracking prevention deletes a site's script-writable storage after seven days of Safari use
with no visit to the site; web apps added to the Home Screen are spared. Reproduce: use Daybook in iPhone Safari with no
account and no Home Screen icon, use Safari for a week without opening it, come back to the welcome page.
Fix: on the web only, one plain line on the days card and the account card ("In Safari, a site's storage can be cleared
after a week away. Add Daybook to your Home Screen, or make a free account."), and a one-time Add to Home Screen card.
Care is not locked; the person is told.

**8. Day 0 opens with three zeros.** _Polish._ Evidence: `apps/mobile/src/components/today.tsx:117-134` (the tracking
card: 0 days logged, 0 urges ridden out, 0 slips logged). Fix: when all three are zero, one line: "Nothing logged yet.
Your first entry starts the log."

**9. "Sign out and remove it from this device" can lose unsent changes.** _Polish._ Evidence: `sync.tsx:309-325` only
syncs first when the log stays; the card says "Your account keeps your log either way" (`sync-card.tsx:153`). Fix: sync
first in both cases; if that fails, say how many changes would be lost and ask again.

**10. Two browser tabs can lose each other's "not synced yet" marks.** _Polish, web only._ Evidence: `store.tsx:178`
writes the whole dirty list from one tab's memory. Fix: read, merge and write the list in `persist`, or listen for the
`storage` event. Rare, and the loss is one missed push, not the record.

**11. A restored backup drops the Sunday review's picked answers.** _Polish, dev builds only._ Evidence:
`packages/core/src/data.ts:77` keeps `a` and not `sun`. Fix: `{ ...normReview(b.reviews[k], k), u: now }`.

**A design call, not a bug.** Graduation counts days with nothing logged, by the rule that a slip not logged is not a
slip (`packages/core/src/graduate.ts:41-46`). So someone who stops opening Daybook on day 10 and comes back a hundred
days later is graduated on that open. Honest by the rule, but it reads as a party for an app they did not use. A kinder
shape: after 30 days with nothing logged, Today says "Welcome back" and the award waits for the first logged day.

### Risks not yet tested

- **Real accounts against Cognito** (sign-up with no code, sign-in, "Confirm your email", forgot password, sign out,
  delete account). Not tried from a phone yet. Test on TestFlight and the AWS web app with a made-up inbox: make the
  account on the phone; sign in on the web (expect the web to take the phone's log); confirm the email from Settings;
  forgot password from the web; delete the account from the phone and confirm the web says the sign-in ran out and the log
  is still there. Check API Gateway's JWT authorizer takes the access token (`client_id`, not `aud`) on the first call.
- **Two devices and conflicts.** Phone and web, both signed in. Edit the same day on both while offline, go online, expect
  the later edit on both. Delete a day on one, expect it gone on the other. "Delete everything" on one, expect the other to
  return to setup, then "Bring my log back" within the week. Then bug 1's scenario, after its fix.
- **Reading older data.** No shipped version exists yet, so the risk is ahead: `normDay` drops fields it does not know
  (`core.js:380`), so an older build that re-saves a day written by a newer one loses the new fields, and sync spreads
  that. Keep new day fields optional and tolerated by `normDay` one release before they are written. If anyone used the
  legacy web page, their log does not carry over now that backup files are dev-only; worth a line to those testers.
- **Notifications.** Never seen delivered. Test on a phone with the clock: the check-in reminder at its time, skipped on a
  day already checked in, the kinder words the morning after a slip, the come-back notes after two days away, a tap
  opening the right screen, and the pause after three misses. On Android 14 and 15, check the reminder arrives on time
  under battery saving (exact alarms) and that the four channels show in the phone's settings.
- **Android.** Never built or walked. A pass on one real phone: the keyboard over every text box, the status bar band, the
  lock with a fingerprint, the keystore sign-in surviving a restart, the back gesture inside full-screen moments, fonts and
  haptics, and the Play internal track install.
- **The web on phones.** Safari and Chrome on a phone: Add to Home Screen, a cold start on `/setup` (handled), the lock is
  absent on purpose, "Stay signed in" unticked (the sign-in should go when the tab closes), and bug 7. The GitHub Pages
  preview has no sync (no `EXPO_PUBLIC_*` in `preview.yml`), so accounts are only testable on the AWS site.
- **Slow or no network.** Log offline for a day, then sync (the dirty list is tested in memory, not on a phone). A sync
  started on a weak signal (bug 4). The account sheet on a slow connection.
- **Large logs.** Seed three years through the shots seed, then time Today, Journal, the pattern charts and the first join
  (about 1,100 records: three pull pages, six push batches). Points and levels are recomputed on every change; a year is
  fine by reading, three years is unmeasured.
- **Cost with testers.** Fifty testers at thirty sync rounds a day is a few thousand requests a day: pennies. The $5 alert
  stands. Cognito's built-in email now only serves "Confirm your email" and resets, so its 50-a-day cap is not a limit on
  sign-ups.

### Features

Each one judged by the one test. Sizes: S under a day, M a few days, L a week or more.

1. **Identity sentences in Milestones** (S). Every count becomes a sentence about who the person is: "You are someone
   who rides out urges: 14 times." "You are someone who logs honestly: 3 slips, all logged." "You are someone who gets
   through the hard hours: 9 held." Nothing new is counted; the frame changes from score to self. Touches "Progress is
   never all or nothing" (these only go up).
2. **Time given back** (S). The setup already works out the hours a year. From Day 1, one line on Milestones: "About 18
   hours given back so far", from the setup's rate and the days with no slip. A gain that never drops, tied to the life
   the person said they wanted. Touches "No big goals pushed early": it stays off Today.
3. **"Becoming" at the sunrise check and on graduation** (S). The sentence from setup shows once more the morning after
   a slip ("Still true: I am becoming someone who is free of this."), and on the graduation screen. Hope first, in the
   person's own words, at the two moments it matters most.
4. **Tell your safe person you started** (S). Day 1 offers the same hand-off Rekindle has for a slip: a prefilled text in
   the person's own messaging app, nothing sent by Daybook. Someone who does not hide is the identity. Touches privacy:
   nothing leaves the device except by the person's own hand.
5. **The first pattern sentence, early** (M). The pattern needs weeks of data; the sense that "this app gets me" is wanted
   in week one. After the third logged urge, one line on Today: "Two of your three urges came after 10 PM. Your wind-down
   is already set for 10 PM." Built on `risk.ts` with a lower bar for words only (no heads-ups until the real threshold).
6. **A seven-day look back on day 7** (M). One screen, once: what was logged, what was learned, the sentence they chose,
   and the next small goal. It closes the tracking week as a thing finished, not a count to keep. Touches "No big goals
   pushed early": the 90 is not mentioned here.
7. **Add to Home Screen on the web** (S). A one-time card with the two taps. It protects the log (bug 7) and makes the web
   feel like the app.

Ideas that would only win attention, and so are not proposed: a Home Screen widget with the day count (a number to
protect); daily quote notifications (noise, and the words show on a locked screen); a shareable streak image (a streak to
show off, which a slip then "breaks"); any leaderboard or community count; a countdown to graduation.

### Order of work

Before outside testers:

1. Bug 1: settings never replaced by a second device's fresh setup (earned things stay earned).
2. Bug 2: the setup's "Keep it on this phone" records "Not now"; the level gate moves to the first new form.
3. Bug 3: the account sheet tells the truth when joining fails, and launch retries the join.
4. Bug 4: timeouts on sync and Cognito calls.
5. Bug 5: refused records and a wrong clock are said, not hidden.
6. Bug 6: the API ceiling and the 429 retry.
7. Bug 7: the Safari storage line and the Home Screen card on the web.
8. The account walk on TestFlight and the AWS web app, two devices, with the conflict script above.
9. One Android pass on a real phone, notifications included.
10. Bug 8: day 0's three zeros become one warm line.

After:

11. Features 1 to 4 (small, all about the identity).
12. Feature 5, the first pattern sentence, then feature 6, the day-7 look back.
13. The graduation-after-absence design call.
14. Bugs 9 to 11 and the large-log timing.

### The plan, step by step (for the session that does the work)

Each step is one commit, marked with the Opus effort level it needs (see CLAUDE.md, Working style). The order is the "before outside testers" list above. Before each commit: `npm run format`,
`npm run typecheck`, `npm test`; for app changes, `npx expo export --platform web` and a look. Merge to `main` and let
it deploy. Count this month's AWS deploys first (`gh run list --workflow Deploy`).

**Step 1. Settings never replaced by a second device's fresh setup.** _Effort: high._ Files: `apps/mobile/src/lib/sync.tsx` (`join`,
`choose`), `packages/core/src/sync.ts`, `services/api/test/client.test.ts`.

- In core `sync.ts`, add `keepSettingsOf(here: Snapshot, recs: SyncRecord[]): SyncRecord[]`: when `hasLog(here)` and
  the account's records hold no day and no review, return the records without the `settings` record. Pure, tested.
- In `join`: on the merge path (`!there`, or the device has a log and the account has none) merge
  `keepSettingsOf(here, p.records)` instead of `p.records`. The device's own settings then go up with `markAllDirty`.
- In `choose('combine')`: settings follow the side with the real log. Add `pickSettings(here, recs)` in core: compare
  the device's day count with the account's; the side with more days keeps its settings; on a tie the earlier `start`
  wins; on a tie there too the newer `u` wins (today's rule). When the device's settings are kept, bump their `u` past
  the account's before merging (`changeSettings(st, () => {}, Math.max(now, theirs.u + 1))`), so the push wins and the
  other device takes them on its next pull.
- The ask card's words change: "Where both have the same day, the newer one is kept. Your plan and progress stay with
  the log that has more days." (`components/sync-card.tsx:111`).
- Tests in `client.test.ts`: (a) phone with 60 days, account with a fresh settings record only: after join, the phone's
  `start`, `day1`, `gradAt`, `learn.prac` and `reasons` are unchanged and the account's settings record is the phone's;
  (b) combine with the same shape: same outcome; (c) a new device (no days) still takes the account's log as it is.
- Done when: the three tests pass and the existing ten in that file still pass.

**Step 2. No account ask on day 0.** _Effort: medium._ Files: `apps/mobile/src/app/setup.tsx:982`, `packages/core/src/accounts.ts`,
`packages/core/test/accounts.test.ts`.

- The "Keep it on this phone for now" link applies `accountLater(st, tk)` through `apply`, then `go(1)`. `st` is set by
  then (the plan was saved on the review page), so `apply` keeps it.
- In `accounts.ts`, replace `level >= 2` with `level >= ACCT_LEVEL`, `export const ACCT_LEVEL = 6` (the first step of
  Kindling), with a comment: level 2 is 18 points and setup gives 20, so level 2 is day 0.
- Tests: "finishing setup and keeping it on the phone waits a week"; "asks at the first new form, not at level 2".
- Done when: a fresh setup ending in "Keep it on this phone" shows no account card on Today for seven days.

**Step 3. The account sheet tells the truth when joining fails; launch retries the join.** _Effort: high._ Files:
`apps/mobile/src/app/account.tsx:129-149`, `apps/mobile/src/lib/sync.tsx:171-208, 264-285`.

- In `account.tsx`, the done body has a third branch: `sync.status.k === 'error'` or `'expired'` shows the status
  message in the danger tone and a "Try again" button that calls `sync.startWith(session)`; keep the session from
  `keepTokens` in a ref so it can be passed again. "Done" stays available under it, with the line "Your log is on this
  device. Daybook will try again when it opens."
- In `sync.tsx` at launch: the `s && !k` branch sets the session and calls `join(s)` (inside a try, `fail` on error)
  instead of setting `out`. `useAccount` then reads `busy` as having an account, so nothing flashes locked.
- Done when: with the sync URL pointed at a dead address, creating an account shows the error and Try again, and a
  relaunch shows "Syncing…" then the error, never "Off".

**Step 4. Timeouts.** _Effort: high._ Files: `apps/mobile/src/lib/sync.tsx:108-128, 328-342`, `packages/core/src/cognito.ts:58-88`.

- A small helper in `sync.tsx`: `fetchWithin(ms, url, init)` using `AbortController`; 20 seconds for sync, used by
  `transport.call` and `callApi`. An abort throws a plain `Error`, so `fail` gives "Could not reach your account. Your
  changes are kept here and will sync later."
- `cognitoClient` takes an optional `timeoutMs` (default 20,000) and passes an `AbortSignal` in `init`; the `Fetch`
  type gains `signal?: AbortSignal`. An abort becomes `CognitoError('Network', ...)`. `test/cognito.test.ts`: a fetch
  that never settles is turned into the Network error within the limit (use fake timers).
- Done when: the tests pass and a round against a sink address ends in the error status within 20 seconds, with
  "Sync now" working afterwards.

**Step 5. Refused records and a wrong clock are said.** _Effort: high._ Files: `packages/core/src/sync.ts:140-179`,
`apps/mobile/src/lib/sync.tsx:139-169`, `apps/mobile/src/components/sync-card.tsx`.

- In `pushAll`, a record refused for "its time is in the future" is not acked (it stays dirty) and is reported with
  `why: 'clock'`; "too large" and "not a valid record" stay as they are (let go, reported).
- `SyncStatus` gains `{ k: 'on'; refused?: { n: number; clock: boolean } }`. The round keeps the refused list from the
  last push. The sync card's line adds "· 1 change could not be saved: the phone's clock is ahead. Check the date and
  time." or "· 2 changes were too large to save" after "Synced just now".
- Test in `client.test.ts`: the clock case keeps the record dirty and reports `clock`; the next push after the clock
  is fixed saves it.
- Done when: the test passes and the words are plain, with no contractions.

**Step 6. The API ceiling and the 429 retry.** _Effort: high._ Files: `infra/app/api.tf:85-88`, `apps/mobile/src/lib/sync.tsx:130-137`.

- `throttling_rate_limit = 50`, `throttling_burst_limit = 100`, with the comment updated (a ceiling against a runaway
  client, high enough for a few hundred people's reminders at once).
- In `fail`: a 429 whose body has no `error` (the gateway's own) does not pause; the round schedules one retry after
  3 to 8 seconds (random), once. A 429 with the allowance's words pauses as today. 413 pauses as today.
- Done when: `terraform validate` passes in CI and the client test "a gateway 429 retries once, an allowance 429
  pauses" passes (MemoryStore transport that answers 429 once).

**Step 7. Safari's storage and the Home Screen, on the web only.** _Effort: medium._ Files: `apps/mobile/src/components/account.tsx`,
`apps/mobile/src/components/today.tsx` (the tracking card and the sm card), a new `apps/mobile/src/components/home-screen.tsx`
with a `.web.tsx` body and a native stub, `apps/mobile/src/lib/prefs.ts` (one device flag).

- One line, web only, under the days card's sub text and in the account card's small print: "In Safari, a site's storage
  can be cleared after a week away. Add Daybook to your Home Screen, or make a free account."
- `HomeScreenCard`: shows once on the web when `window.matchMedia('(display-mode: standalone)')` is false and the flag
  is unset; two steps for Safari (Share, Add to Home Screen) and two for Chrome; "Got it" sets the flag. No "Not now".
  It sits after the account card on Today.
- `apps/mobile/public/privacy.html` gains one sentence under "On your device": the browser may clear a site's storage.
- Done when: the card shows on a phone browser and not in a Home Screen web app, and nothing shows on iOS or Android.

**Step 8. The account walk.** _Effort: owner, on devices._ Not code. On TestFlight and the AWS web app with a made-up inbox, in this order, writing
what happens into this file as a part 4 of the bug hunt: sign up on the phone; confirm the email from Settings; sign in
on the web (expect the phone's log); edit the same day on both offline, then online; delete a day on the web; "Delete
everything" on the phone, then "Bring my log back" on the web; forgot password from the web; sign out and remove on the
phone, sign in again (expect the account's log); delete the account on the web, expect the phone to say the sign-in ran
out. Then the step-1 scenario.

**Step 9. One Android pass.** _Effort: owner, on devices._ Not code until something is found. A Play internal build on one phone: the list under
Risks. Findings go into this file.

**Step 10. Day 0's three zeros.** _Effort: medium._ File: `apps/mobile/src/components/today.tsx:117-134`. When `f.dl`, `f.rode` and
`f.slips` are all zero, the facts row is replaced by one line: "Nothing logged yet. Your first entry starts the log."
The sub line and the link stay.

**After testers**

**Step 11. Identity sentences in Milestones.** _Effort: medium._ Files: `packages/core/src/miles.ts` (a pure `identityLines(days, st, tk)`
returning `{ who: string; n: number }[]`), `apps/mobile/src/app/miles.tsx` (one card, "Who you are, in numbers"),
`packages/core/test/miles.test.ts`. Lines: urges ridden out, slips logged honestly, hard hours held, lessons finished,
check-ins saved, comebacks (sunrise checks done). A line shows once its count is 1 or more. Words say who the person
is, never what they avoid.

**Step 12. Time given back.** _Effort: medium._ Files: `packages/core/src/setup.ts` (`obHours` already gives the rate), a pure
`hoursBack(days, st, tk)` in `miles.ts`: no-slip days since Day 1 times the daily rate from `st.onb.a`; null when there
is no setup record. One line on Milestones under the identity card: "About 18 hours given back so far." Test: the rate
and the count; null without a setup record.

**Step 13. "Becoming" at the sunrise check and on graduation.** _Effort: medium._ Files: `apps/mobile/src/app/sunrise.tsx` (the `hi`
step shows `st.becoming` under its headline, prefixed "Still true:"), `apps/mobile/src/app/graduated.tsx` (already
planned to show it; make sure it does). No core change.

**Step 14. Tell your safe person you started.** _Effort: medium._ Files: `packages/core/src/rekindle.ts` (a `rkStartText(st)` next to
`rkTellText`), `apps/mobile/src/components/your-day.tsx` or the Day 1 card: on Day 1, when `safePerson` is set, one row
"Tell [name] you started" that opens the messaging app with the text (the same `Linking` call Reach a person uses).
Shown once (a `p.r` mark that day, or a settings flag `toldStart: DayKey`). Test the words.

**Step 15. The first pattern sentence.** _Effort: medium._ Files: `packages/core/src/risk.ts` (a `firstPattern(days, st, tk)` with a bar
of three timed urges, words only), `apps/mobile/src/components/risk-card.tsx` or a small card on Today, shown from the
third timed entry until the real window exists, and never on the day of a slip or the day after. Test: the threshold,
the words, the quiet days.

**Step 16. The day-7 look back.** _Effort: medium._ Files: a new `apps/mobile/src/app/week.tsx` full-screen moment (`SceneFrame`, `Dock`),
`packages/core/src/sunday.ts` or a new `week.ts` for the facts, `_layout.tsx` and `nav.ts` entries. Opens once, from
Today, on day 7 of the tracking week. No 90-day mention.

**Step 17. The graduation-after-absence design call.** _Decided: see "Quiet days" below, which replaces it._

**Step 18. Bugs 9 to 11, and the large-log timing.** _Effort: high for the dirty list, medium for the rest._ Sign out and remove syncs first (`sync.tsx:309-325`); the dirty
list is read, merged and written in `persist` (`store.tsx:168-183`); `restoreBackup` keeps `sun` (`data.ts:77`); then
seed three years through the shots seed and time Today, Journal and the first join, writing the numbers here.

**Large-log timing (October 19, 2026).** Three years of made-up logs (1,095 days, an entry and a check-in on each),
timed on a Mac in Node: points, levels and badges (`gameCompute`) 8.7 ms; Milestones' identity lines 7.7 ms; the month
calendar 2.9 ms; Today's measure 1.3 ms; the days card 1.1 ms; nudges 0.6 ms; hard hours 0.3 ms; merging 1,096 records on
a first join 0.8 ms. A phone is perhaps three to five times slower, so `gameCompute` near 40 ms: fine on each change, and
the first thing to memoize if Today ever feels slow with a long log.

## Quiet days: pause, then ask (decided October 19, 2026)

**The owner's call:** days with nothing logged no longer count as no-slip days forever. After **2 quiet days** the count
**pauses** (it never drops), and when the person comes back, one kind question fills in the gap. A reset after a gap was
considered and turned down: it hits people at the moment they come back, when hope matters most, and punishes the ones who
stayed clean without the app ("Never make a long run feel like something that can be lost").

**Why:** today, from Day 1 on, a day with no slip logged counts as a no-slip day ("a slip not logged is not a slip"), for
runs, Today's measure and graduation's 90 of 100. That is right while the person is around and wrong when they are gone:
someone who stops opening Daybook on day 10 and comes back four months later finds a big count, or a graduation, that
Daybook made up. A clean day must be one Daybook has reason to believe.

### The rules

- **Present.** A day is present when anything was logged (an urge or slip, a check-in, the morning questions) or the app
  was opened that day (a new `p.o: true` on the day, written the first time Today shows each day; it does not start the log
  and earns no points).
- **Quiet.** A day from Day 1 on that is not present. The first **2** quiet days in a row count as now (no slip logged, no
  slip). From the **3rd** quiet day in a row on, each one is **not known** until the person says, and keeps being not known
  while the gap goes on. `QUIET_GRACE = 2` in one place.
- **Not known** counts as neither: not a no-slip day, not a slip. Runs pause (the run before the gap stays, and goes on
  from there on return), Today's measure and graduation count only known no-slip days. Points, levels, badges and
  graduation already earned never change.
- **Coming back** after not-known days: the first open shows "Welcome back" (a full-screen moment, the answers low by the
  thumb, `Dock`), before anything else but SOS:
  - Title: "Welcome back. Everything you built is still here." Under it: "You were away 12 days. How did they go?"
  - **"No slips"**: the days count as no-slip days. The count jumps up, and that is said warmly.
  - **"Some slips"**: a short step: pick the days that had a slip on a small calendar of the gap (each is logged as a slip
    with no time), or "I am not sure which days". Picked days are slips; the others are no-slip days; "not sure" keeps them
    all not known. No Rekindle quest for slips older than its three days.
  - **"I would rather not say"**: the days stay not known. The count picks up from where it paused. Never asked again for
    that gap.
  - The X closes it with the gap still unanswered: it is offered again the next day, once, then stays as a quiet row on
    the Days card ("12 days not known · Fill in"), never a card that asks every day.
- **Where the answer is kept:** `settings.away: { from: DayKey; to: DayKey; a: 'clean' | 'some' | 'skip' }[]` (synced, so
  every device agrees). Slips picked are ordinary slip entries on their days. Not-known days are worked out from the log and
  `away`; nothing else is stored.
- **Before Day 1** (the tracking week, just tracking) nothing is counted, so gaps only change the calendar.
- **Step down:** the stretch since the last slip pauses at the gap too. On "No slips" it carries on as if never paused; on
  "rather not say" it shows the stretch since coming back, and the best stretch stays.
- **Graduation** counts known no-slip days only, so it can never arrive by itself after months away. The 100-day window lets
  not-known days roll off, so a long gap never closes the way for good. `gradAt` once set stays.
- **The calendar** gets a "not known" look (a dotted outline, no color), and the day sheet says "Not logged. You were
  away." Never "missed".
- **Nudges:** the come-back notes stay as they are (2, 4, 7, 14 days). The Welcome back question is never in a
  notification.

### Steps (each one commit; each marked with its effort)

1. **Core rules.** _Effort: high._ New `packages/core/src/away.ts`: `presentDay`, `quietRuns(days, st, tk)` (the gaps
   with their first not-known day), `dayKnown(days, st, k, tk)`, `awayDue(days, st, tk)` (the gap to ask about, or null),
   `answerAway(days, st, gap, a, slipDays)` (returns new days and settings), all pure, with unit tests: a 1- and 2-day gap
   still counts; the 3rd day is not known; each answer; "some" with and without picked days; an answer synced from another
   device; the app opened on a day counts it present.
2. **Wire it into counting.** _Effort: high._ The legacy counting in `src/legacy/core.js` (`statusOf`, `dayKind`,
   `streaks`, `runLedger`, `stepView`) asks `dayKnown` (core.js already imports `levels.ts`; import `away.ts` the same
   way, or move `statusOf` and `dayKind` to TypeScript and remove them from core.js). `graduate.ts` (`gradInfo`,
   `todayMeasure`) and `calendar.ts` count only known days. Run the golden tests: fixtures with gaps of 3 days or more will
   change on purpose; update the expected values by hand in the same commit and say why in the message. Tests: graduation
   never arrives through a gap; a run pauses and resumes; points never drop.
   **Done (October 19, 2026, steps 1 and 2):** `packages/core/src/away.ts` (the rule), `back.ts` (`awayStart`, `answerAway`),
   `dayKind` / `statusOf` / `runLedger` / `stepView` in `core.js` (with the log passed in), graduation, Today's measure, the
   hours given back and the calendar (`'away'` kind), tests in `test/away.test.ts`. One change to the plan: the rule counts
   only from `settings.awayFrom`, the first day the app marks opens. Before it, opening left no mark, so older days count
   exactly as they always did; that keeps every earned count and the golden record unchanged (no fixture moved). With no
   `awayFrom`, the rule is off: it is shipped inert until step 3 turns it on.

3. **Present on open, and turning the rule on.** _Effort: medium._ Both together, never one without the other: Today
   writes `p.o` once per log day and, the first time, applies `awayStart(st, tk)` (sets `awayFrom` to today). A new
   person's setup save sets it too. Not before setup, and not while sync is joining (wait for the log to arrive).
   `loggedDay` (log-start.ts) does not count `p.o`, so it never moves the start.
4. **Welcome back.** _Effort: medium._ `apps/mobile/src/app/back.tsx` full-screen moment (SceneFrame, Dock), opened by
   Today when `awayDue` and not shown today; the gap calendar for "Some slips"; the quiet Days card row afterwards;
   `_layout.tsx` and `nav.ts` entries. Words: no contractions, never "missed", "lost" or "reset".
5. **Calendar and day sheet.** _Effort: medium._ The not-known look and words in Journal and the day sheet.
6. **Words elsewhere.** _Effort: medium._ "How I count days" in Settings, Where I am (`MODE_LEGEND`), and the help page
   on counting say how quiet days count; setup's "A slip is data, not a reset" page stays as it is.
7. **Check.** _Effort: medium._ In the browser with a made-up person: a 2-day gap (counts), a 12-day gap answered each way,
   graduation at 88 of 90 with a gap, step down with a gap, and a second device that answered first.

**Done (October 19, 2026, steps 3 to 7):** Today marks each day opened and starts the rule (`awayStart`), only after the
launch's first sync with an account (a second device must not write a newer copy of today before it has the other's
entries). Welcome back (`app/back.tsx`) opens once on return, once more the next day if closed, then a quiet row on Today
(`components/back-row.tsx`); the not-known days have a dotted, softly filled look in the calendar; Settings and Where I am
say how quiet days count (the Days card's short line is pinned by the golden fixtures and stays). Checked in the browser
with a made-up person: away Oct 6 to 18, "Some slips" with one day picked, and "I would rather not say" (7 of 90, the run
paused at 8 days). Seen in passing, not changed: someone who never logged anything and then answers "Some slips" has that
slip become their first entry, so the existing start-moves-to-the-first-entry rule moves Day 1 to it. Rare, and older
than this work; worth a look if it ever shows up with a tester.

### Quiet days, simplified (the owner, October 19, 2026)

The first version asked too much ("No slips", "Some slips" with a day picker, "rather not say"). Now:

- **Welcome back asks one thing:** "Welcome back. Everything you built is still here. While you were away (Oct 8 to 18),
  how many slips did you have?" The number big in the middle, a slider from 0 low by the thumb (0 to the number of days
  away, capped at 30), and Save at the bottom. No other choices: the X leaves the gap unanswered (asked once more the next
  day, then the quiet row), and an unanswered gap stays gray and counts neither way.
- **Kept as** `settings.away: { from, to, n }[]` (n = slips while away). No slip entries are made: Daybook does not know
  the days or times, so the pattern, hard hours and Rekindle never see them. Older entries with `a` are read as: 'clean'
  is n = 0, 'skip' is unanswered; 'some' keeps its picked slip entries and the rest of the gap is n = 0.
- **How it counts (each slip takes one day):** n = 0, every gap day is a no-slip day. n > 0, the gap gives (days - n)
  no-slip days toward graduation and Today's measure (at least 0); for counting, the slips sit on the last n days of the
  gap, so the run ends at the gap and starts again the day after it. The longest run stays. No Rekindle quest and no save.
  Points never change (they come only from things done).
- **The calendar:** every day of the gap is one gray look (the same for answered and unanswered), and under the month a
  line per gap: "Oct 8 to 18 · away · 3 slips", "· no slips", or "· not known yet" with a Fill in link. A gray day's sheet
  says the same line. The month's chips count the gap's slips with the others.

**Steps**

1. **Core: the count answer.** _Effort: high._ `away.ts`: entries become `{ from, to, n }` (read the old shape as above),
   `dayKnown` true for every day of an answered gap, a new `awaySlipDay(days, st, k, tk)` true on the last n days of an
   answered gap; `dayKind` gives 'slip' there (so runs end), `gradInfo` and `todayMeasure` treat those days as slips, and
   the hours given back skip them. `back.ts`: `answerAway(st, gap, n)` (no entries made). Tests: n = 0 counts every day;
   an 11-day gap with n = 3 gives 8 toward graduation and a run starting the day after; an old 'some' or 'clean' entry
   still reads right; a second device's answer counts here; points unchanged.
2. **Welcome back, one slider.** _Effort: medium._ `app/back.tsx`: the question, the big number (`SliderValue big`),
   `Slider` (components/slider.tsx) from 0, Save in `Dock`; the done words: n = 0 "Then those days count.", n > 0
   "Thank you for being honest. A slip is data, not a reset." Remove the day picker and the "rather not say" link.
3. **Calendar and day sheet.** _Effort: medium._ One gray look for all gap days (`calendar.ts` 'away' kind for answered
   and unanswered gaps, `calendar-card.tsx`), the per-gap line under the month with "Fill in" when unanswered, the day
   sheet's line, and the month's slip chip including gap slips.
4. **Check.** _Effort: medium._ In the browser: an 11-day gap answered 0 and 3, an unanswered gap, and the run and
   graduation numbers before and after.

**Done (October 19, 2026, step 1 of "Quiet days, simplified"):** `away.ts` keeps `{ from, to, n }` and works out the
gaps (the whole quiet stretch, grace days included), the not-known days, and the days that carry the slips from an answer
(`awaySlipDay`, the last n of the gap); `dayKind` counts those as slips (so runs end and start again after the gap, and
gentle counting treats them as it does a logged slip), graduation, Today's measure and the hours given back skip them,
step down's stretch starts after the latest gap with slips or no answer (`awayStretchFrom`), and every gap day reports as
away (`statusOf` 'unknown', the Days card strip gray, the calendar's 'away'). New: `answerAwaySlips(st, gap, n)`,
`awayGaps`, `awayGapAt`, `AWAY_MAX = 30`; `awayDue` now also gives `max` for the slider. The first version's
`answerAway(days, st, gap, a, picked)` stays as a thin wrapper only so the current screen works; step 2 replaces the
screen and removes it.

**Done (October 19, 2026, steps 2 to 4 of "Quiet days, simplified"):** Welcome back asks one question with a slider
(0 to the days away, at most 30; the ends read "0 slips" and "13 slips"; Save shows once it is touched); the first
version's answers are gone. The calendar shows each gap as one gray stretch with a line under the month ("Oct 6 to 18 ·
away · 3 slips", or "not known yet" with Fill in), the day sheet says the same, and the month's chips count the gap's
slips and no-slip days. Checked in the browser with a made-up person away Oct 6 to 18 who answered 3: 15 of 90 toward
graduation, the current run 1 day (today), the longest run kept at 15.

## Flow review (2026-10-19)

A read of the code, not a walk on a device: where each part of the app leaves the person when it ends, and whether that
next step makes sense. Setup, Today, the morning questions, the check-in, the wind-down and Good night, SOS and its tools,
Rekindle, Talk it through, lessons, Journal and the calendar, Welcome back, the Sunday review, accounts and Settings. The
earlier reviews above are taken as known, and their decisions are not reopened (the Rekindle quest's "Save your run"
words were chosen on October 18 and stay). Every example uses a made-up person.

The short version: each screen is good on its own; the seams between them are where hope leaks. The main cause is one
helper. `close()` in `apps/mobile/src/lib/nav.ts:21` leaves every full-screen moment at once, which is right for SOS and
wrong whenever one moment opens another on purpose (night opens the check-in, a lesson opens Talk it through, the quest
opens Go deeper, the review opens a lesson). The person then lands on Today, mid-thought, and loses the screen they meant
to return to. Step F1 fixes that once, so most of the other fixes are small.

Effort: every step is marked. High only where a step touches sync, accounts or earned data; medium for screens, words and
small rules; owner for device checks. Notifications have never been seen on a real phone, so every notification step
ends with a device check.

### The owner's two notes

**1. Night: after the check-in, back to Good night.** Confirmed. Good night's "Check in first" pushes `/checkin`
(`apps/mobile/src/app/night.tsx:143`). The check-in's Done and X both call `close()` (`checkin.tsx:277, 288`), and since
wind-down, Good night and the check-in are all full-screen moments, all three close and the person lands on Today, phone in
hand, at the hour that matters most. Two smaller things on the same screen: the check-in's end can show "Next: the
wind-down." (`checkin.tsx:203-256`) and offers "Remind me at 11:20 PM each day" (`:259-275`), neither of which makes sense
after the phone is already going down.

**2. Hard hours: plan ahead the night before, and check in when they start.** What already exists:

- `risk.ts`: `riskWindow` finds the two-hour window (weekdays and weekends apart, a score of 6 and a quarter of all
  signals); `riskDay` gives its phase; `keepHard` records a window held with no slip as `p.hw` (kept for good, shown as
  "Held your hard hours" in the calendar and counted in the Sunday review); `firstPattern` gives the early words-only line.
- `nudges.ts`: one heads-up, kind `risk`, 90 minutes before the window ("Your hard hours start soon. Two quiet minutes now
  make them easier."), first in priority, on its own Android channel, learning like the others. It opens Today (`url`
  defaults to `'/'`, `nudges.ts:234`), where the risk card offers Talk it through.
- SOS: the first screen asks "How strong is it?" (optional: A little, Strong, Very strong), then the tools; Strong and
  Very strong already lean the suggestion toward Breathe, 5-4-3-2-1 and Move (`UR_STRN`). "My reasons" is a tool
  (`components/tools/scene.tsx:500`). Opening SOS starts an urge in memory (`sos.tsx:91`); an entry is saved only when
  "How is it now?" is answered.

What is missing: a "reliable" bar (today one strong week is enough to count), the note the night before, a short
plan-ahead moment, the note at the start of the window, and an SOS that can hear "there is no urge right now". Steps H1 to
H6 below.

Three choices made here, for the owner to know:

- **The words have no contractions.** "Let's plan ahead" and "Let's check in" become "Tomorrow has a hard hour coming.
  Plan ahead in one minute." and "Your hard hour is starting. Check in?" (CLAUDE.md: no contractions; and nothing on a
  locked screen says what Daybook is for, which both lines keep).
- **Not more notifications, different ones.** Once the window is reliable, the night-before note and the at-start
  check-in replace the 90-minute heads-up for that window (two notes instead of three). The heads-up stays for windows
  that are found but not yet reliable. The daily cap of three still holds, and the day of a slip and the day after get no
  night-before note ("after a slip, never more notifications, only kinder ones").
- **The night-before note never comes at night.** Daybook does not pick a night time on its own. It comes at the
  check-in reminder's time when that is on (and then it is one notification that does both), otherwise an hour before
  screens-off, and never after 9 PM. For a window that starts in the afternoon or evening, "the night before" is a day too
  early to be useful: the plan-ahead comes that morning instead ("Today has a hard hour coming...").

### Gaps found

Ranked by how much they cost the person's hope, or their sense that Daybook will help. Each one is a step below.

1. **Notification taps open Today, not the thing they name.** "Check in. Under a minute." opens Today; so do the
   morning, wind-down and hard-hours notes (`nudges.ts:234-247`; only the Sunday one opens `/review`). On Sundays the
   check-in note promises "a few minutes to look back on your week" and then neither the note nor the check-in's end
   leads there.
2. **Talk it through from SOS drops the urge.** `sos.tsx:272` replaces SOS with `/talk`, which ends the urge with nothing
   saved, starts Talk at its first page while the urge is happening, and every Done closes to Today (`talk.tsx:770, 944,
963`): no "How is it now?", no ridden-out credit.
3. **An urge ridden out late at night ends on Today.** SOS passes `night=1` to the log (`sos.tsx:169`), which only
   darkens the sky; Done goes to Today (`log.tsx:652`). Good night is one tap away for Go to bed, never for the urge
   itself.
4. **A slip at night: the quest asks for "Phone away" and gives no button for it.** The mission says to tap Phone away on
   Today (`rekindle.ts:231-233`); "Done for tonight" (`log.tsx:608`) goes to Today, the worst place to be at that hour.
5. **Go deeper closes the quest.** `log.tsx:602` pushes `/deeper`; its Save, "I told them" and Close call `close()`
   (`deeper.tsx:32, 79, 129`), so the quest closes too and the fourth flame is never seen lighting.
6. **Moments opened from a lesson or the review close them too.** Talk it through and the review from a lesson
   (`lesson/[id].tsx:213, 216`), Halt's swapped-in tool (`components/tools/scene.tsx:422`, no `lr`), Go to bed's
   `dismissAll` (`:212`), a lesson opened from the review (`review.tsx:395`) or the morning (`morning.tsx:211`). The
   review's answers live only in screen state (`review.tsx:112-119`), so they are lost.
7. **The combine question's "Not now" signs the person out, and the sheet says "You are signed in".** `sync-card.tsx:123`
   calls `signOutNow(false)`; `account.tsx:135-165` does not treat `out` as a failure and shows the signed-in body with
   "Open the lesson", which leads straight back to the account sheet.
8. **Good night has no SOS.** The last screen before the hardest hour has only Good night and the X (`night.tsx`).
9. **A slip added from the Journal gets no Rekindle.** The day sheet's "Add an entry" (`entry.tsx:421`) saves the slip
   and shows Done; a slip logged for today or yesterday there never reaches the embers or the quest. The same for "I went
   ahead" looked back on in Talk it through (`talk.tsx:940-944`).
10. **Welcome back can close the screen a notification opened.** Today pushes `/back` (`(tabs)/index.tsx:103`) on top of
    whatever the tap opened; "Go to Today" (`back.tsx:43`) closes both.
11. **Lesson 3's "Next" runs into the account sheet.** `nextAfter` (`packages/core/src/lessons.ts:160`) ignores the
    lock; "Next: <title>" (`lesson/[id].tsx:389, 587`) opens lesson 4, which redirects to the account sheet (`:125`).
    Locked lessons tapped in Learn (`(tabs)/learn.tsx:272, 304`) open the sheet with no reason and do not open the lesson
    after sign-up.
12. **The check-in's end names a next step and gives no way to take it.** "Next: the wind-down." is plain text
    (`checkin.tsx:247-256`); "If something happened today, log it too" (`:195`) has no link.
13. **The hard-hours card says "SOS is one tap" and has no SOS button** (`components/risk-card.tsx:301-303`).
14. **Go to bed saves the win silently.** The urge is saved as ridden out (`components/tools/scene.tsx:186-213`) and
    Good night never says so.
15. **Small seams.** "Tonight's wind-down" in Learn opens Today (`(tabs)/learn.tsx:447`); Reasons' Back always says "My
    plan" (`reasons.tsx:116`); My plan has no way to try a tool; moving the start date can move Day 1 without a word
    (`packages/core/src/actions.ts:170-178`); "Close for tonight" on the quest only closes, like the X (`log.tsx:435`);
    on the lesson's practice step "Not now" does what Done does and sits above it (`lesson/[id].tsx:537-546`); "How is it
    now?" answers are not in a `Dock` (`sos.tsx:310-314`); the log's end after SOS asks for a note twice (`log.tsx:635-650`).

**Setup, Today and the mornings:**

16. **Day 7 asks for three things at once.** For someone who chose "Keep it on this phone", the week of quiet ends on
    day 7 (`ACCT_WAIT`, `packages/core/src/accounts.ts:15, 40`), the same day as "Your first week is done" (WeekCard)
    and, on a Sunday, the review card (`(tabs)/index.tsx:171-180`). Two "a week in" cards and up to three asks, on a
    Today that can hold ten cards that day.
17. **Today's main step shows twice.** The hero's Next up band (`components/hero.tsx:246`) and Your day's open tile
    (`components/your-day.tsx:159`) each give the same stop its own big button, every day of the first week.
18. **The morning after a slip asks about screens-off twice.** The sunrise check asks it (`sunrise.tsx:150-176`); the
    morning questions start on the same step even when it is answered (`morning.tsx:412-439`), and both are offered on
    Today that morning.
19. **"Morning done." leads nowhere when no lesson waits** (`morning.tsx:538`). Done closes to Today with nothing ahead.
20. **Setup's last page makes "Go to Today" the main button** (`setup.tsx:1097`) and "Start lesson 1" a smaller route
    above it (`:1083-1093`). The first lesson is the step that builds the most hope on day 0.
21. **Graduation can open over an unanswered Welcome back** (`(tabs)/index.tsx:103, 111`); "Keep going"
    (`graduated.tsx:254`) closes both, and the away question has already been counted as asked once.
22. **Go deeper from the sunrise check closes the sunrise end page** (`sunrise.tsx:281`), so the person loses their
    missions and plan card.
23. **The sunrise check greets with "Welcome back."** (`sunrise.tsx:130`), the words of the away screen
    (`back.tsx:59`). The person never left; it hints that they fell away.
24. **Small ones.** The morning's "Nothing to ask yet" (`morning.tsx:398-411`) offers only Done; a stale sunrise check
    redirects to `/` from inside a moment (`sunrise.tsx:64`) instead of `close()`; after a setup walk-through, "Back to
    Today" and Done do the same thing (`setup.tsx:1060, 1097`).

Seen and left alone: the setup's "Daybook is free" page comes between the reminder ask and the account ask, but only on
the web (the tip link is web-only, decided), and the Rekindle quest's "Save your run" words (decided October 18).

### Steps (each one commit; each marked with its effort)

Order: the shared fix first, then the owner's two notes, then the rest by harm. Before each commit: `npm run format`,
`npm run typecheck`, `npm test`, `npx expo export --platform web` and a look. New words: plain, no contractions, never
shame.

**F1. Close only what was opened on purpose.** _Effort: medium._ `apps/mobile/src/lib/nav.ts`. Add `closeTo()`: a moment
opened from another moment with a `from` param (or `lr`, as tools already do in `lib/tools.ts:47-62`) goes back one
(`router.back()`); everything else keeps `close()`. Use it in the check-in, Talk it through, Go deeper, the review and the
lesson. Test by hand: SOS, then a tool, then X still closes everything (SOS's rule is unchanged).

**N1. Night: back to Good night after the check-in.** _Effort: medium._ `night.tsx:143` pushes
`{ pathname: '/checkin', params: { from: 'night' } }`. In `checkin.tsx`, with `from=night`: Done and X go back one
(F1), the end's main button reads "Back to good night", the sky is `night`, and "Next: the wind-down" and the reminder
offer are hidden. Good night then shows "Checked in. The day is logged." in place of the "One minute first?" box (it
already hides when the evening stop is done; check that it re-renders on return). Done when: wind-down, Phone away,
Check in first, Done lands on Good night, and Good night closes to where the wind-down started.

**H1. A reliable hard hour.** _Effort: medium._ `packages/core/src/risk.ts`: `riskSure(days, st, k): RiskWindow | null`,
the window from `riskWindow` when, in the last 21 days, slips started inside it on at least 3 different days (urges and
talks do not count here: the notes are for windows the log is sure of). `RISK_SURE_DAYS = 21`, `RISK_SURE_MIN = 3`.
Tests: three slip days at 9 AM in three weeks is sure; two is not; three slips on one day is not; old slips roll off.

**H2. The two notes.** _Effort: medium._ `packages/core/src/nudges.ts`, `test/nudges.test.ts`,
`apps/mobile/src/lib/reminders.ts`.

- Two new kinds, both learning, both under the `risk` switch and the Hard hours channel: `ahead` and `hour`. Priority
  next to `risk`.
- `ahead`, on the day before a day whose `riskSure` window starts before noon: "Tomorrow has a hard hour coming. Plan
  ahead in one minute." At the check-in reminder's time when it is on (then the check-in note carries it, like the Sunday
  one: "Check in, and plan ahead for tomorrow."), otherwise an hour before screens-off, never after 9 PM. For a window
  from noon on, it comes the same day at 10 AM (or the morning reminder's time): "Today has a hard hour coming. Plan ahead
  in one minute." Opens `/ahead`. Not on the day of a slip or the day after. Skipped when the plan for that window is
  already made.
- `hour`, at the start of a `riskSure` window: "Your hard hour is starting. Check in?" Opens `/sos?ask=hard`. It
  replaces the 90-minute `risk` heads-up for that window; `risk` stays for windows that are found but not sure.
- Helped (for learning): a tap, an open within the hour, the plan made (`ahead`), or the window held (`hour`).
- `NUDGE_WORDS.name` gains "The plan-ahead the day before" and "The check-in when hard hours start", so a pause says
  which one.
- Tests: a sure 9 AM window gives `ahead` the evening before at the check-in time and `hour` at 9:00, no `risk` for that
  day; a found-not-sure window gives only `risk`; a slip yesterday drops `ahead`; the cap of three holds with the morning
  and check-in reminders on; nothing lands after 9 PM except `hour` for a night window.
- Done when: the tests pass. Then the device check in H6.

**H3. Plan ahead, one minute.** _Effort: medium._ New `apps/mobile/src/app/ahead.tsx` (a full-screen moment:
`SceneFrame`, `Dock`; add to `SCENE` in `nav.ts` and the stack in `_layout.tsx`). Title at the top: "Tomorrow, 9 to 11
AM is usually hard." and "A plan made now is easier to follow then." Low, by the thumb, one pick: "When it starts, I
will..." with the person's own urge plan first (`st.plan`), then Breathe, Move, Be somewhere else, Text my safe person.
Save at the bottom; a quiet "Talk it through instead" under it. Saved on this phone only (in the SOS memory, like
`bedPlan`: `ahead: { k, start, pick }`), so nothing new is synced and no day record changes. The done words: "Planned.
Daybook will check in at 9 AM." The risk card on Today counts a made plan like a talk-through ("You are ready").

**H4. SOS at a hard hour: "Is there a pull right now?"** _Effort: medium._ `apps/mobile/src/app/sos.tsx`,
`apps/mobile/src/components/tools/scene.tsx` (Reasons).

- With `ask=hard`, the first screen's optional strength question becomes one question with four big choices low by the
  thumb: "No, I feel steady", "A little", "Strong", "Very strong". The plan from H3, when there is one, shows at the top:
  "Your plan from last night: Move."
- "No, I feel steady": the urge in memory ends with nothing saved (`sos.end()`), and My reasons opens on its own (not
  inside SOS) with one line above it: "What matters most to you in the next two hours?" Its Done says "That is who you
  are. Daybook is here if it changes." and goes to Today. No entry, no points: the hour, if held, is recorded by
  `keepHard` as it is now.
- "A little": the tools, with the plan's tool suggested first.
- "Strong" or "Very strong": straight into the fastest tool, skipping the list: Breathe, or 5-4-3-2-1 when Breathe is
  marked Not for me. It returns to "How is it now?" as every SOS tool does, and the entry is saved there as now.
- Done when: each of the four paths ends where it says, and the steady path leaves the log unchanged.

**H5. The hard-hours card on Today.** _Effort: medium._ `components/risk-card.tsx`: during the hours an SOS button next
to Talk it through (the card says "SOS is one tap"); before them, when the plan is made, "Planned: Move. Daybook will
check in at 9 AM." The 90-minute heads-up's tap opens Today as now, where this card is.

**H6. Device check: hard hours.** _Effort: owner, on a phone._ A made-up log with slips at 9 AM on three days: the
evening note at the check-in time, its tap opening Plan ahead, the 9:00 note, its tap opening SOS with the question, each
of the four answers, and on Android the Hard hours channel. Also at 11 PM for a night window.

**S1. Notification taps open the thing they name.** _Effort: medium._ `nudges.ts:234-247`: check-in opens `/checkin`,
morning `/morning`, wind-down `/wind`, the 90-minute heads-up `/` (the risk card). The kind words the morning after a
slip keep `/`. On Sunday the combined note opens `/checkin?then=review` and the check-in's end offers "Look back on your
week" above Done. Test the urls in `nudges.test.ts`. Device check with H6.

**S2. Talk it through from SOS keeps the urge.** _Effort: medium._ `sos.tsx:272` pushes `/talk?from=sos` over SOS
instead of replacing it; Talk starts after its first page; its end goes back to SOS at "How is it now?" (F1), so the
entry is saved there as for any tool.

**S3. At night, the end of an urge or a slip leads to Good night.** _Effort: high_ (the slip half feeds the Rekindle
quest's phone-away mission, which saves a run). After an urge ridden out with `night=1`, the log's main button is "Phone
away, good night": it runs the same phone-away action the wind-down uses and opens `/night` with "You rode it out. That
makes 14." On the quest at night, the phone-away mission gets a "Phone away" button that does the same. Test in core that
the mission counts exactly as the Today button's does. Also Go to bed: pass `rode=1` and show the same line (item 14).

**S4. Go deeper returns to the quest.** _Effort: medium._ `deeper.tsx` uses F1 when opened from the log, so the quest
shows the flame lighting.

**S5. Lessons, the review and tools return where they started.** _Effort: medium._ Pass `lr` through Halt's swap
(`components/tools/scene.tsx:422`); Go to bed dismisses everything only when SOS is open; Talk it through and the review
opened from a lesson, and a lesson opened from the review or the morning, go back one (F1).

**S6. The combine question tells the truth.** _Effort: high_ (accounts). `sync-card.tsx:123`: the ghost button reads
"Sign out, decide later"; `account.tsx` treats `out` after this choice as its own body: "Signed out. Your log is on this
phone, untouched. Sign in again when you are ready to choose." with Done.

**S7. Good night has an SOS.** _Effort: medium._ `night.tsx`: a quiet "SOS" link inside "If the thoughts get loud" that
opens `/sos` (it already goes dark at night).

**S8. A slip from the Journal or a look back reaches Rekindle.** _Effort: medium._ In `entry.tsx`, a slip for today or
yesterday shows "Light the embers" as the main button, which replaces the sheet with `/log` at `rkStepFor`'s step. The
same for "I went ahead" in Talk it through's look back (`talk.tsx:940-944`). The quest's rules are untouched.

**S9. Welcome back never closes what a tap opened.** _Effort: medium._ `(tabs)/index.tsx:103` pushes `/back` only when
no full-screen moment is open; otherwise it waits for the next time Today shows.

**S10. The account ask after lesson 3 says what it is.** _Effort: medium._ When the next lesson is locked, the button
reads "Open the next lessons with a free account" and passes `{ why: 'lesson', then: id }`; "Back to Today" stays the
main button. Learn's lock line and map card pass the same, so the tapped lesson opens after sign-up.

**S11. The check-in's end leads somewhere.** _Effort: medium._ "Next: the wind-down." becomes a button that replaces the
check-in with `/wind`; "log it too" becomes a quiet link to `/log`. (Not when opened from night: N1.)

**S12. Small seams.** _Effort: medium._ Item 15, one commit: Learn's wind-down link pushes `/wind`; Reasons uses
`useBackLabel('My plan')`; My plan gains a "Try a tool" row; moving the start date says "Day 1 moved to Oct 27, a week
after tracking starts." when it moves Day 1; remove "Close for tonight" (the X does it); remove the practice step's "Not
now"; put "How is it now?" answers in a `Dock`; one note box at the log's end after SOS.

**T1. Day 7 holds one ask.** _Effort: medium._ `(tabs)/index.tsx`: the AccountCard waits while `firstWeekDue` is true;
the end of `app/week.tsx` carries the ask instead ("Keep this week safe with a free account", with "Keep it on this phone"
recording `accountLater` as setup does), right after the person has seen what they built. The Sunday card waits a day
when the week card shows. Test the order in `accounts.test.ts` if `accountAsk` changes.

**T2. One button for today's next step.** _Effort: medium._ `components/your-day.tsx`: when the hero's Next up band shows
a stop, that stop's tile is a plain row (tap still opens it), so there is one big start button on Today.

**T3. The morning after a slip asks once.** _Effort: medium._ `morning.tsx` starts at the sleep step when screens-off is
already answered for that night; Today hides the morning stop while the sunrise check is open. "Welcome back." on the
sunrise check becomes "Good morning." (`sunrise.tsx:130`).

**T4. Mornings and setup end with a next step.** _Effort: medium._ "Morning done." with no lesson waiting names the next
stop with its button ("Tonight: screens off at 11 PM" or the check-in); "Nothing to ask yet" offers lesson 1. Setup's
last page: "Start lesson 1" becomes the main button and "Go to Today" the quiet link under it; after a walk-through, drop
the extra "Back to Today".

**T5. One full-screen moment at a time from Today.** _Effort: medium._ `(tabs)/index.tsx`: graduation waits while Welcome
back is due and unanswered (the next Today shows it), joined with S9's rule; Go deeper from the sunrise check goes back
to the sunrise end page (F1); a stale sunrise check uses `close()` (`sunrise.tsx:64`).

**D1. Device check: the seams.** _Effort: owner, on a phone._ Night to check-in and back; SOS to Talk it through and
back; an urge and a slip at 11 PM; the quest's Go deeper; a lesson's Talk it through; each notification tap; a Sunday
note; Welcome back after a tap. Findings go here.

## Launch site (2026-10-20)

The owner asked for research on how app sites build excitement, then a page rebuilt from the ground up. The research
(landing pages of I Am Sober, Finch and Quittr; Apple's marketing rules; Unbounce benchmarks; email tools) said:

- One goal per page. With a web app that already works, the main button is "Start now, free", not a waitlist.
- Plain words, the outcome first, and privacy said plainly: visitors to a sensitive-topic app are wary, with reason.
- Shame after a slip makes the next one more likely, which is the case for "a slip is data, not a reset".
- Avoid "rewire your brain", success percentages, testosterone or before-and-after claims, and "Are you addicted?" copy
  (Apple 1.4.1, ad rules, and it is not the voice of Daybook).
- Referral waitlists depend on people sharing, which few do for this topic. A pre-order would push the launch back for
  a gain nobody has shown. A countdown has no evidence behind it.

Done (medium): `about.html` rebuilt: a night-to-daybreak hero with the six store pictures, "a slip is not the end of
the road" (a streak counter's 0 next to Daybook's 89 kept), three ways it helps, what Daybook never does, the honest
comparison, who builds it, where to get it, the FAQ, the crisis card, and "Start now, free" fixed low, where the thumb
is. The Fredoka font is served from the site, never a font service.

Next, in order:

1. (medium) **The day the iPhone app is live:** swap "Coming soon" for Apple's black "Download on the App Store" badge
   (from the Apple marketing toolbox, unaltered, at least 40 px tall) linking to `https://apps.apple.com/app/id6824362830`;
   add the Smart App Banner (`<meta name="apple-itunes-app" content="app-id=6824362830">`) to `about.html` only, never
   to the web app; update `llms.txt` and the FAQ "Where can I get it?".
2. (medium, needs the owner) **"Tell me when Daybook is on Android":** a plain form to Buttondown (free to 100 people,
   tracking off by default, double opt-in, no script). The owner makes the Buttondown account, turns off open and click
   tracking, and sets the sender name to "Daybook" with subjects that never say what it is for. `privacy.html` then says
   the email is kept by Buttondown, only to send that one note. Self-hosting on SES would avoid the third party but needs
   a new role in `infra/bootstrap` (high), so it waits.
3. (medium) **The same day as the Play release:** the Google Play badge next to Apple's (App Store first, same size).
4. (owner) **Spreading the word, after launch:** Bing Webmaster Tools (import from Search Console); a short honest post
   where the rules allow it (read each community's rules first, about one promotional post per nine helpful ones, never
   ask for votes); Product Hunt at 12:01 AM Pacific midweek once a few supporters are ready.
5. (low) **A domain**, once the owner buys one: point it at CloudFront and change the canonical links, the sitemap and
   `llms.txt`.

### Tips (the owner, October 20, 2026)

The tip jar was hidden on iPhone on October 19 by a Claude pick, against what the owner had built it for. It is back on
the web and on iPhone. The Stripe tip page already takes Apple Pay, so a tip from the iPhone app can be paid with Apple
Pay in Safari. Android stays hidden until Google Play's US rules for links out are checked (medium, next).

- (owner) A new iPhone build is needed for TestFlight and review: Actions, App Store, Run workflow (one EAS build).
- (medium) Android: check Google Play's current US policy on links to pay outside Play; if allowed, show it there too.
- (medium, owner's choice) Apple Pay inside the app, without leaving it, is only possible through Apple's In-App
  Purchase (a "tip" product, Apple keeps 15%); Apple Pay on its own is not allowed for digital tips.

## The tools, made open and playful (2026-10-20)

The owner wants the exercises to feel open and creative: Android's playful shapes and squiggly lines, and breathing like
How We Feel's (on a breath in, a spray of dots flies out in a loose scatter, settles into a perfect circle, and drifts
back in on the breath out). The tools today are plain circles, rings and cards. `components/shapes.tsx` is the shared
kit: `Shape` (cookie, scallop, clover, flower, rounded triangle and pentagon, circle, loose blob), `WavyRing` (a timer
ring that fills as a squiggle) and `WavyLine`. All of it respects Reduce Motion.

### The tools and their flows today

- **Calm your body.** Breathe: from SOS it starts at once (the sigh, 3 minutes); from Tools it opens on a setup page with
  7 choices (4 patterns, 3 lengths) before anything breathes. One gold sun grows and shrinks. 5-4-3-2-1: a giant number,
  a row of plain circles to tap one by one, then Next (disabled until all are tapped).
- **Ride the wave.** Get curious: 5 steps (notice, let it be, where, what it feels like, watch a 90-second wave with a
  dot). Name the thought: pick or write a thought, then a card "I notice I am having the thought that…". Play it
  forward: two lists of feelings, then the two hours side by side. Ten-minute pause: a still sun in a plain ring, an idea
  to try, then "How is the urge now?".
- **Change the scene.** Move: sit or stand, pick a move, a plain 2-minute ring. Go to bed: three checkboxes and four
  plans in one long page. Surprise me: a slot spin through the calm-move menu. What do I need?: chips that open cards.
- **Reach out.** Reach a person: three texts, your own, then crisis lines, all in one long page. My reasons: one card
  with arrows.
- Every tool ends on the same Finish: the flame on one widening ring.

### Changes, most important first

1. **Particle breath** (Breathe, and the pause's breathing guide): dots fly out in a loose, random scatter on the breath
   in, gather into a perfect ring at the top, shimmer on a hold, and drift back to the center on the breath out. A new
   scatter every breath. Replaces the one sun in `Orb`.
2. **Breathe starts at once, everywhere**: the last pattern and length are remembered on the device, and the setup page
   becomes a small "Change" choice; "Change or stop" becomes two plain chips.
3. **Timers as squiggles**: the pause's 10-minute ring and Move's 2-minute ring become a slowly crawling `WavyRing`;
   Get curious's 90-second wave becomes a thick squiggle the dot rides.
4. **5-4-3-2-1 blooms**: each sense has its own shape (cookies for sight, clovers for touch…) that blooms when tapped,
   with the sense's icon; after the last one it moves on by itself.
5. **One Finish, many shapes**: the end of a tool scatters a few shapes in the tool's color that settle around the
   flame, once.
6. **Tools on shapes**: each tool's icon sits on its own shape in the Tools grid and on the SOS list, not a rounded square.
7. **Name the thought floats away**: the thought card can be sent off like a leaf on a stream ("Let it go"), and the
   words "A thought is not an order" stay.
8. **My reasons swipe**: a soft card stack that turns with a swipe as well as the arrows.
9. **Surprise me lands**: the spin flips through shapes and lands with a soft bounce.
10. **Move keeps a beat**: a shape that pulses at the move's pace (hold five, let go) during the 2 minutes.
11. **Get curious's first two steps** breathe with a small shape, not an icon in a circle.
12. **Go to bed reads lighter**: the four plans as a short choice under the three checks.

All twelve were built on October 20 in four parallel sessions, merged and deployed. Checked on the web only; iOS,
Android and Reduce Motion have not been tried.

Choices made along the way (kept unless the owner says otherwise): Stop in Breathe after one full breath goes to the
finish and counts as a calm move; a pattern changed from SOS also becomes the Tools default; 5-4-3-2-1 has no Next button
(each step moves on after the last shape); unfound shapes and Move's beat shape use the plain card color, because the pale
tones vanished on the skies; Go to bed's checks moved into the lower half with the plans; Name the thought's main button is
"Let it go", with Done as a quiet link.

### Design pass (done, 2026-10-20)

The shapes are now Android's own: `lib/m3-shapes.ts` ports androidx RoundedPolygon and all 35 Material shapes
(Apache 2.0), and `shapes.tsx` builds `Shape`, `MorphShape`, `WavyRing` and `WavyLine` on it at Material's proportions
(thin stroke, small wiggle, a slow crawl). `lib/motion.ts` holds Material's springs. The breath dots drift out evenly
and land on the ring with no burst; the Get curious wave draws in quickly and fills behind its dot; each 5-4-3-2-1
sense has its own family of shapes that morph in; the tool icons, Move's beat, Surprise's faces and the Finish burst
use varied shapes. My reasons: the two faint shapes behind the card are gone, and the category sits in a soft cookie
medallion at the top of the card. An empty calm-move menu falls back to the starting ideas (app and `pickIdea` in core).
Checked on the web build at phone size, light and dark: SOS tools list, My reasons, Name the thought, Go to bed, Get
curious (all steps), and the 5-4-3-2-1 Finish.

### Waiting on the owner

- Decided (the owner, October 20): the first SOS screen keeps its horizon sun; particle breath is for Breathe and the pause.
- The shapes beyond the tools (Today, badges, Learn)?

## SOS tools, second pass (2026-10-20, the owner on the simulator)

_Effort: medium for every step (screens, motion and small rules)._

What the owner saw on the iPhone build, and what changes:

1. **One squiggle everywhere.** The 10-minute ring's squiggle is the model: the line starts straight, turns squiggly as it
   fills, crawls slowly and moves smoothly. Get curious's wave is the opposite today (a static squiggle drawn in at once,
   a dot that jumps once a second). Every squiggly line on the SOS screens (the pause and Move rings, Get curious's wave,
   Play it forward's marks) is drawn by one function with one set of numbers (`SQUIGGLE` in `components/shapes.tsx`): the
   part still to come is a plain, quiet line; the part done is the squiggle; it eases in from flat; it crawls; progress
   comes from a smooth clock, not a once-a-second tick.
2. **The 10-minute pause, rethought like Move's timer.** The still breath dots inside the ring looked broken (the same
   dots as Breathe, standing still). The pause now uses Move's timer: the squiggle ring, a soft shape inside that breathes
   slowly by itself (4 seconds in, 6 out), the time left big in the middle. "Breathing guide" adds the words (Breathe in,
   Breathe out) to the shape. One shared `ToolTimer` (components/tools/timer.tsx) for both.
3. **What do I need?, from the ground up.** Today: five chips, then cards piling up under them. New: one question with five
   big choices low on the screen, pick one; then one page for that need, its shape and icon big in the middle, what helps
   in a sentence, and one main button that does it (Move, Reach a person, Go to bed at night, Surprise me, or "I will do
   it"). "Something else is true" goes back to the five.
4. **Move: the pick page and the run page.** Pick: "In my seat / On my feet" first, then the moves as one clean list
   (name, a small shape, the how in one line) that start on a tap. Run: the move's name and how sit at the top to be read,
   the timer (unchanged, the owner likes it) in the middle, "I am done" at the bottom, "Change the move" under it.
5. **The strength switch glitch.** Changing A little / Strong / Very strong picked a new "do now" line, so the whole first
   SOS screen reflowed and the sun jumped. The line now stays put for the whole SOS; strength only changes what is
   suggested on the next screen.
6. **Closing a tool from SOS.** The X went back to SOS's first screen (which reads like starting over). It now goes back
   to the tool list. A running pause started from SOS stops and also goes back to the list; a pause
   started on its own still keeps counting after the X.
7. **Surprise me leads on.** After the pick: "I will do it", "Another one", and when the idea is one of the tools (a walk
   or push-ups is Move, a text or a call is Reach a person, a hot drink or a shower is not a tool) a button that opens it.
   From SOS a quiet "Back to the tools" is always there.
8. **A glitch pass** over every tool on the iPhone build, and **standards** for tools written down (docs/design-standards.md,
   pointed to from CLAUDE.md), so new tools and any later use of these patterns across the app follow the same rules.

## Counting that adapts, hours after a slip, and keeping a run (the owner, October 21, 2026)

What the owner asked for:

- **Step down and counting days switch by themselves, both ways.** Setup does not ask which one. How often the person
  says they struggle picks the start, and the log moves them after that.
- **Hours after a loss.** Right after a slip, Today shows how long it has been since, in hours, because a growing number
  of hours is more motivating than a run that just ended.
- **Keep the run, or start fresh: their choice, every time.** When a slip ends a run of 7 days or more, Daybook asks
  whether to keep the run going (the Rekindle quest saves it, as today) or start fresh. Circumstances change, so it asks
  at every such slip, and the answer can be changed while the run can still be saved.

Decided with the owner: the soft path is the Rekindle save; ask at every slip that ends a run of 7 days or more; a run
shorter than 7 days simply ends (the hours since the slip become the number); setup no longer offers "Step down first"
or "Cut way back first", and Gentle counting stays only as a quiet choice in Settings (anyone on it keeps it).

What holds, from CLAUDE.md: nothing earned is taken away. Today's main measure (no-slip days in a window) is unchanged,
the longest run stays on record, the slip stays in the log, and Rekindle's care (missions, sunrise, points, badge) is
there whether the run is kept or not. Only the current run is what the person chooses about.

### Steps (each one commit on the branch `counting-adapts`; each marked with its effort)

**A1. Keep or start fresh, in core.** _Effort: high (the run, earned things, sync)._

- A slip that ends a run of `RUN_ASK = 7` days or more, and is the first slip in 7 days (today's `rkFullDays`), carries
  the person's answer on the slip entry: `keep: true` (keep the run going), `keep: false` (start fresh), or no answer
  yet. The field survives normalization, export and import, and sync merging (newest edit of the entry wins, as for
  other entry fields).
- `runLedger`: a slip day can be saved only when the run before it was `RUN_ASK` days or more and `keep !== false`.
  With `keep: false` the run ends on that day (the slip day is a plain slip). No answer yet behaves as today: the run
  waits for the quest until `RK_DAYS` after the slip. A run shorter than `RUN_ASK` ends at the slip.
- Actions: `rkKeep(days, k, evId, keep, now)` sets or changes the answer while the save window is open; changing it
  back to keep reopens the wait if the window is still open, and a run already saved stays saved.
- The words that promise a save (`rkEmbers`, `rkLightLine`, `rkQuest`, `rkCard`, `rkEnded`, `srEnd`, `runChips`) follow
  the answer: "start fresh" never says "your run waits".
- Golden fixtures: where a run under 7 days was saved, the expected values change by hand in this commit, with why in
  the message. New unit tests for the question, both answers, changing the answer, the 7-day edge, a second slip in the
  week, sync merge of the field.

**A2. The question on screen.** _Effort: medium (screens and words)._

- In the slip flow (`app/log.tsx`, the first Rekindle step), when core says the slip ends a run of 7 days or more: the
  question at the top ("Your 47-day run" and one line), two big choices low on the screen: "Keep it going" (the quest
  saves it, by the weekday) and "Start fresh" ("Your 47 days stay your longest run"). Then the quest as today.
- While the answer can still change (the save window), Today's Rekindle card says which was picked with a quiet link
  to change it. Unanswered (the app closed mid-flow), the card asks the same question.
- Words: no contractions, hopeful, never shame; both answers are good answers.

**A3. Hours after a slip.** _Effort: medium (a small rule and Today's number)._

- `heroNumber` while counting days: for 72 hours after the latest slip, unless that slip's run was kept (saved or
  waiting with keep), the number is the time since the slip, in hours ("14 hours since your last slip"), with the
  window measure as its chip ("6 of the last 7 days"), so what was earned stays in view. After 72 hours, or when a new
  run passes it, back to the window measure. Step down already counts in hours and is unchanged.
- Tests in `test/hero.test.ts`.

**A4. Counting switches by itself, both ways.** _Effort: high (counting mode, graduation award)._

- Setup: the goals no longer include "Step down first" or "Cut way back first"; the mode comes from how often:
  about once a day or more (`f3`, `f4`) starts in step down, anything less starts counting days. Gentle is never set by
  setup. A walk-through after setup never changes a mode the person picked in Settings.
- Step down to counting days: when `stepView` says ready, Daybook switches by itself (the same as "Start counting days"
  today, `stepGrad` stamped, so its award is kept), and Today shows a one-time note in place of the button.
- Counting days to step down: unchanged (`shouldAutoStep`, a rough week), with the 14-day hold after any switch so it
  never flips back and forth.
- Settings: "Switch for me" covers both directions ("Daybook moves you between step down and counting days as your log
  changes"); "Leave it" keeps whatever the person picked. The three manual chips stay.

**A5. Check and ship.** _Effort: low._ `npm run format`, `npm run typecheck`, `npm test`, `npx expo export --platform
web` and a look at setup, a slip after a 7-day run (both answers), Today in the first hours after a slip, and the
switch note, light and dark. Before merging, set `RUN_ASK_FROM` in `core.js` to the day this reaches `main` (A1 set it to
2026-10-22): slips on earlier days keep the old rule, so a short run someone already saved is never taken away. Merge to
`main` with `[deploy]`.

### Done (2026-10-21)

A1 to A5 are built and on `main`. `RUN_ASK_FROM` stays 2026-10-22, the day after the merge, so no slip logged under the
old app (where a short run could be saved) is judged by the new rule. Found and fixed on the way: the hard-hours card
said "That makes 0 times" until today was recorded, and on the morning-after card in dark mode the start-fresh line and
its link were faint. Left as decided: a walk-through after setup never changes how days count (only the log and
Settings do), and the switch to counting days waits until Day 1.

## The first testers (2026-10-21)

The iPhone app is in App Store review and Android is not public yet. Before any marketing, Daybook needs 15 to 30 people
who use it for two weeks and say honestly what helped. The search side is already written (the store listing in
docs/launch.md, step 6); this part is finding people by hand, with Claude in Chrome doing the legwork.

**Who does what (decided with the owner).** Claude in Chrome finds the places, reads their rules, finds the public
contact, writes every message, fills it into the compose box and keeps the log. The owner is signed in to their own
accounts and says yes to each send, one at a time; a real person answers replies that need one. The skill
`/find-testers` (`.claude/skills/find-testers/SKILL.md`) is the prompt for this, in four modes: research, draft, send,
status. Its log is `.outreach/log.md`, kept out of git because it names people.

**Never:** a message to someone who posted about their own struggle and did not ask; a fake account, a second account,
or bought or traded votes; a post where a community's rules forbid it; a post that hides that the owner made Daybook; a
number, a story or a claim the app cannot back. These people may be at their lowest. A stranger's message about porn
feels like being watched, gets the account banned, and breaks the trust Daybook is built on.

**Now, while review waits**

1. **(owner) A Reddit account with some history.** Most recovery subreddits remove posts from new accounts with no karma,
   automatically. If the account is new, start now: a few honest comments a week in r/pornfree, with no links, for two
   or three weeks before the first post.
2. **(owner, decision) A real domain.** The site is at a cloudfront.net address, which looks like a scam link in a post. A
   domain costs about $10 to $15 a year. Until then, the GitHub Pages address is the better link.
3. **Done (October 21): the "Help test Daybook" page,** `apps/mobile/public/testers.html` (`/testers.html` on the site): what Daybook is in three lines, the web
   link, the iPhone link (the TestFlight public link until the store approves, then the store), the Android opt-in link,
   what to send back and where (Send feedback in More, the four questions), and the privacy promise. One link for every post.
   Until the TestFlight and Play links exist, its quiet link under the button asks for an invite by email (Android
   testers include their Google account email); when they exist, they replace it.
4. **(owner; Claude in Chrome can fill the fields)** TestFlight: an external group with a public link (it needs a beta
   review, usually about a day). Google Play: the closed testing track with a Google Group as its tester list, so people
   join on their own; the opt-in link goes on the tester page. A personal account needs 12 testers opted in for 14 days
   in a row (docs/launch.md, step 8), so aim for 20 to keep 12.
5. **(low) Research:** `/find-testers research`, read only. It fills the log with places, their rules and who to ask.
6. **(medium) Drafts:** `/find-testers draft`. The first is the message to r/pornfree's moderators, below.

**Once the tester page is live**

7. **Outreach, in this order:** r/pornfree's moderators (post only if they say yes), other subreddits whose rules allow
   it, faith and men's group leaders (Celebrate Recovery chapters, church men's groups), then therapists and coaches who
   list porn or sex addiction publicly. `/find-testers send`, one message at a time, a few a day at most.
8. **Feedback** through what the app already has (the roadmap's feedback and opt-in counts): the tester page asks
   testers to turn on the counts and to use Send feedback in More on day 2, day 7 and day 14, with these questions: What
   did you open Daybook for today? After a hard moment or a slip, did Daybook help you keep going, or make it worse?
   What one thing would you change? How would you describe Daybook to a friend in one line? (The last answers become
   the words for marketing.) Ask three people who left a reply address for a 15-minute call.
9. **(medium)** Claude sums up the feedback here: what to fix, and the words testers used. Then marketing starts
   (content from the lessons; the short-video pipeline, built around what worked).

**Enough to move on:** the roadmap's 20 to 50 people, 12 Android testers through 14 days, the day 7 and day 14 counts
showing people still opening Daybook, and three calls.

**The first draft: to r/pornfree's moderators** (modmail; `[ ]` parts are the owner's to fill)

> **Subject:** Asking before I post: a free, private app I built for quitting
>
> Hi. I built a free app for quitting porn called Daybook, and I would like to find a few people to test it before it
> launches. I know self-promotion is not welcome here without permission, so I am asking first.
>
> What it is: you log urges and slips in a few taps, it shows the hours and moments that are hardest for you, and it has
> an SOS for when an urge hits. A slip does not reset you to zero: what you built stays yours, because a slip is data,
> not failure.
>
> Why I think it fits here: it is free with nothing to unlock, with no ads, no tracking and no account needed. Your log
> stays on your phone.
>
> [Optional, only if true and you want to share it: one sentence on why you built it.]
>
> If you are open to it, I would post one "looking for testers" thread, say plainly that I made it, and answer every
> question myself. If not, that is fine, and thank you for running this place.
>
> [your name] (u/[username])

## Short videos: the daybook-shorts pipeline (2026-10-22)

The marketing videos live in their own private repository, `jdsmith2004/daybook-shorts` (checked out next to this one):
script, record, voice, render, review, post, one command each, with Jeff's approval before anything posts. Its README
holds the weekly loop and its docs/plan.md the decisions. The one change here: shots mode (`EXPO_PUBLIC_SHOTS=1`) keeps
full motion when a page is opened with `?motion=1`, so the recorder can show the breathing sun moving; every shot still
takes the settled, reduced-motion path. The recorder builds this app in shots mode with the sync and counts variables
blank, so no account card and nothing that could reach a server.

### Pricing, an open decision (the owner, October 22, 2026)

The owner is weighing a one-time payment of about $5 that unlocks some features, because a fully free app may cost
more than it can carry. Nothing is decided. Whatever is chosen: care is never locked (SOS, logging, Rekindle, the
plan, the tools and Today stay free, as CLAUDE.md says), a digital unlock inside the app has to go through Apple's and
Google's in-app purchase (the Stripe link stays a tip and unlocks nothing), and earned things stay earned. What the
other quit apps charge, and how they market, is written up in the daybook-shorts repository
(content/systems/app-marketing.md). What it found, as of October 22, 2026:

- Every competitor is a subscription behind a hard paywall with no free tier. Quittr's reported price differs by
  source ($12.99 a month or $39.99 a year in a founder interview; $6.99 a week or $29.99 a year elsewhere), with an
  exit discount. Brainbuddy is about $12.99 a month and Fortify $9.99 (undated). None of them offers a one-time price.
- The complaints are about the paywall: charges that did not unlock, refunds unanswered for a month, and the review
  line "porn is free, this should be free". Quittr also leaked intimate answers for hundreds of thousands of people,
  many of them minors (404 Media, March 2026). Free, and logs that stay on the phone, are the plain difference, and the
  videos lean on it.
- So a one-time unlock of about $5 would still be the cheapest thing in the category by far, and it is not the price
  that would cost trust. What matters is what it locks. Care stays free, so the candidates are things that are
  pleasant and not needed: extra flame forms or themes, app icons, more voices for the breathing tool, a "thank you"
  badge. Apple and Google take 15% at this size, so $5 nets about $4.25. The App Store allows a one-time non-consumable
  in-app purchase; it is simpler than a subscription and has no renewal to support. The marketing line stays "free":
  every tool a person needs is free, and the unlock is a way to say thanks that also gives something back.

## Lessons first: no morning check-in, a calm hard-hours card (the owner, October 23, 2026)

The owner: the morning check-in ("Last night: two quick questions") is a poor reason to open the app; the reason should be
the lesson, pushed like Duolingo, because that is where growth comes from. And the hard-hours card sends people to Talk it
through, whose first page assumes a slip is being planned; someone doing well who opened the app for a lesson is treated
like someone about to slip. Decided by the session on the owner's word ("you choose"):

- **Good night is the phone going away.** Tapping Good night (the wind-down or Go to bed) counts as phone away, with the
  time. Nothing asks the next morning whether it stayed away.
- **No streak that can drop to zero.** Lessons get a ring of this week's lesson days on Today (0 to 7, it fills, never
  empties mid-week, a slip never touches it). That keeps CLAUDE.md's "never all or nothing".

### A. The morning check-in goes (high: it moves data that quests, goals and points read)

1. **High.** Remove the morning stop everywhere: "Last night" in Your day and in the routine (Settings), Next up, the
   morning nudge, and the morning screen (app/morning.tsx). Saved settings with `routine.morning` stay readable and are
   ignored. Points, wins and quests already earned from mornings stay earned (nothing recomputed downward; check the
   golden fixtures and say in the commit message if a frozen value has to change, and why).
2. **High.** Sleep: one optional slider in the evening check-in, "How did you sleep last night?", saved where the morning
   saved it (`checkin.h`), so the Sunday sleep goal and the week story keep working.
3. **High.** Phone away: Good night writes what "phones away" needs (`p.po`, and screens off on time when it is before
   the screens-off time), so the "Screens off on time" quest and the Sunday phone goal count from it.
4. **Medium.** The night win (an urge ridden out in SOS at night): instead of the morning screen, a one-line card on Today
   the next time it opens, with the optional note for next time (core night-win.ts).

### B. A calm hard-hours card and a short plan (medium)

1. **Medium.** The hard-hours card (components/risk-card.tsx) no longer assumes a slip: "Your hard hours start at
   11 PM." Its main button is today's lesson when it is not done yet; then "Make a plan for tonight".
2. **Medium.** "Make a plan for tonight" opens a short Talk it through (`/talk?prep=1`): no "Planning a slip?" page, no
   signs, no research cards, no paths. It asks what usually makes these hours hard (the needs), what to do instead (the
   moves), and the moment, and saves the change plan as today (so the card turns to "You are ready", and the look back
   still comes). "Planning a slip?" opens only from its own button.

### C. Lessons first (medium, after A)

1. **Medium.** Today's lesson is always Next up until it is done.
2. **Medium.** A lesson reminder in place of the morning one, copied from Duolingo's strategy (researched October 23,
   2026: Duolingo reminds once a day at about the time of the last lesson, a day later; picks the wording with a bandit
   that demotes what was sent lately; and stops when reminders are ignored). nudges.ts already has the bandit wordings,
   skip-when-done, at most three a day, the step-down when ignored, and the come-back notes that stop on their own. New:
   the lesson reminder is the one reminder on by default once notifications are allowed (check-in and wind-down stay
   opt-in); it comes at the time the last lesson was finished, a day later (else the hour the app is usually open, never
   at night); it is skipped once today's lesson is done; with the check-in still open too, the two share one
   notification. Not copied: Duolingo's guilt (a sad owl, "streak at risk"). The words stay warm, and never say what
   Daybook is for on a locked screen.
3. **Medium.** The week's lesson days as a ring of seven on Today, near the flame; each lesson visibly feeds the flame.

## Payments: what the owner sets up (October 23, 2026)

The code for tips is on the `payments` branch: Apple's in-app purchase on iPhone (`apps/mobile/src/lib/tip.ts` and
`tip-store.ts`, with expo-iap), the web tip page with Stripe Payment Links, and the server that checks both and decides
about sync (`services/api/src/supporter.ts`, `apple.ts`, `stripe.ts`). Nothing new costs money to run: Apple keeps 15% of
each tip once the Small Business Program applies (30% before), Stripe keeps its fee per payment (2.9% + 30¢ for a US
card), and the AWS parts (one Parameter Store value, a few more Lambda calls) are free or fractions of a cent.

How it works, in short: a tip of $5 or more makes a supporter (core `supporter.ts`). The three Apple products are
non-consumable, so a tip comes back on a new phone (Restore) and is never charged twice; a second tip later would be a
new product (a consumable "tip again", or monthly support as a subscription, which the record already allows). The
server keeps its own supporter record per account and lets an account save to sync only with one. Accounts that hold
synced data when the server first looks at them, or were made before October 24, 2026 (midnight in Chicago), are
grandfathered for good. Reading, erasing and closing an account stay open to everyone, and nothing is ever deleted
because someone is not a supporter.

People who tipped with the old Stripe link before today: if they had an account, they are grandfathered and keep sync,
and their device extras open once the app looks at the account (it does at every start). If they had no account, they
can be given their supporter record by hand: find the payment in Stripe (Payments, search their email), open it, copy
the Checkout Session id (it starts with `cs_live_`, on the payment's page under its Checkout summary or its events), and
send them `https://d3c9g6kent5bsr.cloudfront.net/tipped.html?session_id=<that id>` to open in the browser they use
Daybook in (or ask them to write, and do it with them). The server checks that it is paid, $5 or more, and not used
before.

### App Store Connect

1. **Paid Apps agreement.** Business (Agreements, Tax, and Banking), Paid Apps: read and accept it. In-app purchases
   cannot be sold until it is active.
2. **Banking and tax.** In the same place: add the bank account the money goes to, and the US tax form (W-9). Apple
   checks them; the agreement shows "Active" when done (a day or two).
3. **Small Business Program (15% instead of 30%).** Once the agreement is active, enroll at
   https://developer.apple.com/app-store/small-business-program/ (sign in, Enroll). It applies from the start of the next
   fiscal month after approval.
4. **The three products.** Apps, Daybook, Monetization, In-App Purchases, the + button, type **Non-Consumable**, once for
   each. The Product ID must match exactly (core `APPLE_TIPS`):

   | Reference name | Product ID             | Price  | Display name | Description                                                      |
   | -------------- | ---------------------- | ------ | ------------ | ---------------------------------------------------------------- |
   | Kind tip       | `daybook.tip.kind`     | $5.00  | Kind tip     | A $5 tip that makes you a Daybook supporter. Thank you.          |
   | Generous tip   | `daybook.tip.generous` | $10.00 | Generous tip | A $10 tip that makes you a Daybook supporter. Thank you.         |
   | Amazing tip    | `daybook.tip.amazing`  | $20.00 | Amazing tip  | A $20 tip that makes you a Daybook supporter. Thank you so much. |

   For each: availability, the same countries as the app (the United States); Family Sharing off; tax category, the
   default. If $5.00 is not offered, take the closest price ($4.99): Apple tips are checked by product, not by price, so
   any of the three makes a supporter.

5. **Review screenshot and notes.** Each product needs one screenshot of where it is bought in the app (the tip sheet on
   an iPhone, from the new build) and a note for review: "A one-time tip. Daybook is free; a tip makes the person a
   supporter, which opens sync between devices, a safe copy and their whole pattern. Everything for care stays free."
   The first in-app purchases go to review together with an app version, so add all three to the next version's page
   (In-App Purchases and Subscriptions, Select) before submitting it.
6. **A sandbox tester** (to try it on a phone before review): Users and Access, Sandbox, Testers, +. On the iPhone,
   Settings, Developer (or App Store), Sandbox Account. TestFlight purchases are free and use the sandbox too.

### Stripe

1. **Apple Pay and Google Pay.** Settings, Payments, Payment methods: turn on Apple Pay and Google Pay (cards stay on).
   Payment Links run on Stripe's own pages, so no domain needs to be registered.
2. **Business website.** Settings, Business, Public details: website `https://d3c9g6kent5bsr.cloudfront.net`.
3. **Three Payment Links.** Payment Links, New, for each tip: a new product (Kind tip $5.00, Generous tip $10.00, Amazing
   tip $20.00, one-time, USD), quantity not adjustable, no address. Under **After payment**, choose "Don't show
   confirmation page" (redirect) and enter exactly
   `https://d3c9g6kent5bsr.cloudfront.net/tipped.html?session_id={CHECKOUT_SESSION_ID}`.
   The app adds `client_reference_id=<account id>` to the link when the person is signed in; Payment Links take it from
   the address on their own, so there is nothing to switch on. Give the old link (the one in `SUPPORT_URL`) the same
   After payment redirect too.
4. **Send the three links** (they look like `https://buy.stripe.com/...` and are public) to Claude, or put them in
   `TIP_LINKS` in `packages/core/src/supporter.ts`. Until then, the old link stands in for the Kind tip, and the other
   two are not offered on the web page.
5. **The restricted key.** Developers, API keys, Create restricted key. Name it `daybook-sync`. Permissions: **Checkout
   Sessions: Read**, and every other one None. Create it and put it straight into AWS (below). Never paste it into a
   chat, an email, GitHub, or a file in the repository.

### AWS

1. **Let the sync function read the key** (and see when an account was made, for the grandfather rule): from your own
   computer, `cd infra/bootstrap && terraform apply`. It adds to the sync function's role `ssm:GetParameter` on
   `/daybook/stripe-key` only, decrypting that one parameter only through Parameter Store, and
   `cognito-idp:AdminGetUser`.
2. **Put the key in Parameter Store** as a SecureString (a standard parameter with the AWS managed key costs nothing):

   ```sh
   export AWS_PROFILE=daybook
   read -rs STRIPE_KEY     # paste the rk_live_... key and press Enter; it is not shown and not kept in history
   aws ssm put-parameter --region us-east-2 --name /daybook/stripe-key --type SecureString --value "$STRIPE_KEY"
   unset STRIPE_KEY
   ```

   To change it later, run the same with `--overwrite`. The function reads it again within a few minutes of a new start,
   or at once after the next deploy.

3. **Deploy.** Merge `payments` to `main` with `[deploy]` once the new iPhone build is approved (below), so a new account
   on iPhone is never told that sync needs a tip before the app can take one. The web gets the tip page in the same
   deploy. Until the key is in Parameter Store, web tips answer "Web tips are not set up yet"; Apple tips work without
   it. (An older iPhone build that is not a supporter shows the same words when its sync is turned down; it loses
   nothing.)

### The iPhone build and review

1. expo-iap is a new native module, so a new build is needed: `cd apps/mobile && npx eas-cli@latest build -p ios
--profile production`, then `npx eas-cli@latest submit -p ios`. The In-App Purchase capability is on for the app's
   identifier by default, and EAS keeps the provisioning profile in step.
2. In App Store Connect, add the three in-app purchases to the new version, with the screenshots and notes above, and
   submit it for review.

### What Claude does after (by effort)

1. **Low.** Put the three Payment Link addresses in `TIP_LINKS` (core `supporter.ts`).
2. **Medium.** Once the build is on TestFlight: a sandbox purchase on a phone end to end (buy, restore on a second phone,
   sync opens), and a web tip from the web app and from the iPhone's second way.
3. **High, later, only if the owner wants it.** Refunds: App Store Server Notifications and a Stripe webhook could turn a
   refunded tip's record off. Today a refund leaves the record as it is.

### Prompt for Claude in Chrome

Paste this into Claude in Chrome, signed in to App Store Connect and the Stripe Dashboard in the same browser:

```text
Help me set up tips for my iPhone app Daybook in App Store Connect and Stripe. Do the clicking, and stop to ask me before
you: agree to or accept any agreement or terms; enter, change or confirm any bank, tax or identity details; create,
reveal, copy or display any secret or restricted API key. Never type, copy or read out a secret key yourself: when a key
is created I copy it myself, straight into AWS. Tell me what you did at each step and anything that did not match.

App Store Connect (appstoreconnect.apple.com):
1. Open Business (Agreements, Tax, and Banking). Tell me the status of the Paid Apps agreement, banking and tax. If
   something needs my signature or details, stop and show me where.
2. Open Apps > Daybook > Monetization > In-App Purchases. Create three, each of type Non-Consumable:
   - Reference name "Kind tip", Product ID daybook.tip.kind, price $5.00 (or $4.99 if $5.00 is not offered), display
     name "Kind tip", description "A $5 tip that makes you a Daybook supporter. Thank you."
   - Reference name "Generous tip", Product ID daybook.tip.generous, price $10.00, display name "Generous tip",
     description "A $10 tip that makes you a Daybook supporter. Thank you."
   - Reference name "Amazing tip", Product ID daybook.tip.amazing, price $20.00, display name "Amazing tip",
     description "A $20 tip that makes you a Daybook supporter. Thank you so much."
   For each: availability United States only, Family Sharing off, review notes: "A one-time tip. Daybook is free; a tip
   makes the person a supporter, which opens sync between devices, a safe copy and their whole pattern. Everything for
   care stays free." Leave the review screenshot for me, and tell me which ones still need it.
3. Open https://developer.apple.com/app-store/small-business-program/ and tell me whether I can enroll yet. Do not
   submit the enrollment; show me the page.

Stripe Dashboard (dashboard.stripe.com, live mode):
4. Settings > Payments > Payment methods: turn on Apple Pay and Google Pay if they are off. Tell me what was on before.
5. Settings > Business > Public details: set the website to https://d3c9g6kent5bsr.cloudfront.net. Ask me before saving
   if anything else on that page would change.
6. Create three Payment Links, each with a new one-time product in USD: "Kind tip" $5.00, "Generous tip" $10.00,
   "Amazing tip" $20.00. Quantity not adjustable, no address collection. After payment: do not show a confirmation page;
   redirect to https://d3c9g6kent5bsr.cloudfront.net/tipped.html?session_id={CHECKOUT_SESSION_ID} exactly. Then open my
   existing Payment Link https://buy.stripe.com/fZudRb2Rn3QafC3gWCeUU00 and set the same redirect. Give me the three new
   link addresses (they are public).
7. Developers > API keys: stop here and ask me. I create the restricted key (named daybook-sync, with only "Checkout
   Sessions: Read") myself and copy it into AWS. Do not reveal or copy it.
```

## Sign in with Apple: what the owner sets up (October 23, 2026)

The code is on the `apple-sign-in` branch. On iPhone, Apple's own sheet (one Face ID tap, no browser page); on the web,
Apple's popup, once there is a Services ID. Android has no Apple button. It costs nothing to run.

How it works, in short. Cognito's own Apple provider only works through Cognito's web sign-in page (a browser hop), and
it would keep the Apple key in Terraform state, so Daybook does it itself:

- The app gets an identity token from Apple and sends it to the sync API (`POST /sync/apple`, an open door with a low
  request ceiling). The server checks Apple's signature, that it is for Daybook, in time, and with the app's one-time
  nonce (`services/api/src/apple-id.ts`).
- The account for an Apple ID is the one marked with it (`preferred_username` = `apple.<Apple's id>`). Only the server
  sets that mark; the app may change only the email. The first time, the server makes the account, or joins Apple to the
  email account that has Apple's email when that email is confirmed. Then Apple and the password open the same
  account: the same log, tips and grandfather rule. An email that is not confirmed is never joined (anyone could have
  made that account with that address); the app says to sign in with the password and confirm the email in Settings.
  Settings also has "Add Sign in with Apple" for a signed-in account, which covers Hide My Email.
- The server signs the account in with Cognito's custom sign-in. A small trigger Lambda (`apple-auth.ts`) checks Apple's
  token again and that it is this account's Apple ID, so the server cannot make a sign-in without a fresh Apple token.
  After that it is an ordinary Cognito sign-in: renewal, sync, tips and sign-out are unchanged.
- An account made with Apple is new, so it is never grandfathered; it syncs once it has a tip, like any new account.
- Closing an Apple account asks Apple once more (Apple's rule: its tokens must be revoked). The server trades that fresh
  code for a token with the Sign in with Apple key and revokes it, then closes the account as before. Nothing from Apple
  is ever stored. If the key is not in Parameter Store, the account is still closed and the function's log says
  `apple revoke on close: no-key`.
- When the app opens on iPhone, it asks Apple whether the person still allows Daybook. If they turned it off in Settings
  (Apple ID, Sign in with Apple), the app signs out and the log stays on the phone.

### Apple Developer

Paste this into Claude in Chrome, signed in at developer.apple.com:

```text
Help me set up Sign in with Apple for my iPhone app Daybook in the Apple Developer account
(developer.apple.com/account, Certificates, Identifiers & Profiles). Do the clicking, and stop to ask me before you accept
any agreement or terms. Never download, open, copy or read out a private key: when a key is made I click Download myself.
Tell me what you did at each step and anything that did not match.

1. Membership details: tell me my Team ID (10 characters).
2. Identifiers > App IDs > com.jdsmith2004.daybook: turn on "Sign in with Apple" (Enable as a primary App ID) and save.
   If it asks to confirm a change to the app's capabilities, ask me first. Tell me if it was already on.
3. Identifiers > + > Services IDs: description "Daybook web", identifier com.jdsmith2004.daybook.web. Register it, then
   open it, turn on Sign in with Apple and Configure: primary App ID Daybook (com.jdsmith2004.daybook), domain
   d3c9g6kent5bsr.cloudfront.net, return URL https://d3c9g6kent5bsr.cloudfront.net/auth. Save, and tell me what it shows.
4. Keys > +: name "Daybook Sign in with Apple", check Sign in with Apple, Configure with the primary App ID Daybook, save,
   Continue, Register. STOP on the Download page and tell me. I download the .p8 myself (it can only be downloaded once).
   Tell me the Key ID shown there.
5. Services > Sign in with Apple for Email Communication: just tell me what is listed. Change nothing.

At the end, give me: the Team ID, the Key ID, and the Services ID. None of them is secret.
```

Step 3 is only for the web; skip it to start with iPhone only. Step 5 matters only if Hide My Email people should get
Cognito's emails (a password reset); they never need one to sign in with Apple.

### AWS

1. **Apply the bootstrap stack** from your own computer: `cd infra/bootstrap && terraform apply`. In plain words it:
   - makes a role `daybook-app-apple-auth` for the trigger, which may only write its own logs;
   - lets the sync function find an account by its Apple ID or email (`ListUsers`), make one (`AdminCreateUser`,
     `AdminSetUserPassword` with a password nobody knows), join Apple to an account (`AdminUpdateUserAttributes`), sign it
     in (`AdminInitiateAuth`, `AdminRespondToAuthChallenge`), and read one more parameter, `/daybook/apple-key`;
   - lets the deploy role read the new role and hand it to its Lambda, nothing more. No identity provider is made, so
     the deploy role needs no `CreateIdentityProvider`.
2. **Put the key in Parameter Store** yourself (it never goes through Claude, Terraform or git):

   ```sh
   aws ssm put-parameter --profile daybook --region us-east-2 --name /daybook/apple-key --type SecureString --value file://$HOME/Downloads/AuthKey_XXXXXXXXXX.p8
   ```

   Then delete the downloaded file, or keep it somewhere safe offline; Apple will not let you download it again.

### GitHub (repository variables, none secret)

Set `APPLE_TEAM_ID`, `APPLE_KEY_ID` and, for the web, `APPLE_SERVICES_ID`. Then, only after the bootstrap apply,
`APPLE_SIGN_IN` = `true`. The next deploy makes the trigger, turns on the custom sign-in and opens `POST /sync/apple`.
Its summary prints `EXPO_PUBLIC_APPLE=on` for phone builds. (Every deploy from this branch on also limits what a
signed-in app may change on its own account to the email, whether Apple is on or not.)

### The iPhone build and review

1. expo-apple-authentication is a new native module, so it rides in the same new build as the tips. Add
   `EXPO_PUBLIC_APPLE=on` to the EAS production environment variables first (without it the build hides the button).
   EAS turns on the Sign in with Apple capability for the app identifier if step 2 above did not already.
2. Nothing new for App Review: Sign in with Apple is not required for Daybook (it has no other outside sign-in), and
   offering it next to email is fine. Closing an account already revokes Apple's tokens, which review checks.

### What Claude does after (by effort)

1. **Medium.** On TestFlight: sign in with Apple, then with the password on a second phone (confirmed email: the same
   log), Hide My Email with "Add Sign in with Apple", close an Apple account and check the log line says `revoked`.
2. **Low.** The web, once the Services ID is set: the button on the account sheet, in Chrome and in Safari.
3. **Later, if wanted.** Apple's server-to-server notices (a person stops using Apple with Daybook, or deletes their
   Apple ID) could sign out every device at once; today each iPhone notices when it opens.

## The whole app, end to end (review of October 24, 2026)

A read of onboarding, accounts and Sign in with Apple, payments, the tools, Today and notifications, before the iPhone
build with tips and Apple goes to review. Setup, the lesson lock, care staying free, the Apple token check, account
deletion, the server's check of Apple and Stripe tips, the ask timing and every notification link were found sound.

Fixed in this pass:

- A paid web tip that the server could not confirm for a passing reason (Stripe or the server down, or the Stripe key
  not set yet) was dropped; it is now kept and tried again, and the tip sheet says what happened. A failed Apple
  purchase (not a cancel) now says so instead of looking like a cancel.
- Sign in with Apple on the website: the site's content rules blocked Apple's script, so every tap failed. Allowed.
- Apple's nonce: only its hash is taken, so a captured token cannot be replayed with its own nonce.
- A CDN error page no longer reads as "Sign in with Apple is not ready yet".
- `EXPO_PUBLIC_APPLE=on` is in the EAS profiles, so the iPhone build shows the Apple button.
- The setup's account page no longer comes back for a person who just made an account that waits for a tip.
- A tool that hands on to another tool (Feel, Surprise, Halt, Pause) keeps the way back to the lesson that opened it.
- The Talk it through reminder no longer puts the person's own plan words on the locked screen.
- Reminders are scheduled one plan at a time, so an older plan cannot leave a stale note.
- The check-in and the wind-down go to Today when there is no setup yet, instead of a blank screen.
- The privacy page names Sign in with Apple; the public pages no longer promise flame looks or say a free account
  syncs or that a tip unlocks nothing; the store listing, the privacy label (Purchases) and the review notes say what
  a tip opens. The app version is 1.0.0 for the store.

Decided and fixed the same day (the owner, October 24, 2026: "fix these"):

1. **Older accounts keep sync only.** A grandfathered record opens sync and nothing else; those people see the whole
   pattern's lock, are asked for a tip like anyone, and a tip they pay replaces the grandfathered record (core
   `supPaid`, `supBest`).
2. **Android: no tip ask.** Android cannot pay a tip (Google Play's billing is not in), so Android shows nothing about
   tips: the sync card, the account card and setup say only that sync is not open yet, with no "I already tipped".
   People who tipped on iPhone or the web sync on Android as anywhere. Play billing is later work, when wanted.
3. **Closing an account joined to Apple always asks Apple.** With no code, the server answers 409 `NeedApple` and
   deletes nothing; the app asks Apple and sends the code. A device that cannot ask Apple (Android) says so with
   `{ apple: { skip: true } }`, and the account is closed with a line in the log.
4. **The web tip link on iPhone shows only on the United States storefront** (StoreKit's storefront, `usStorefront`).

Still open:

- Smaller: granting notification permission or exact alarms does not reschedule at once; Delete while the sign-in has
  expired says "Could not reach your account"; the "Close" link under Talk it through on the last slip screen only
  closes the page; a refund leaves the supporter record (already accepted); an email typed by someone else can block
  that person's Apple sign-in with words about a password they never had.

## Tools: naming leads somewhere, a bigger wave, and the two that help most first (the owner, October 24, 2026)

- **Name the feeling** no longer ends at the word. Naming a feeling takes some of its charge, but on its own the research
  is mixed: in one trial with people in treatment, labeling alone raised craving more than reappraisal did, and urge
  surfing guides tie the noticing to a next step. So the named page is "Name it to tame it": the feeling's shape breathes
  (4 in, 6 out), the person says "I feel ..." on a slow breath out, and the main button is always the tool that fits
  (core `feelLead` now gives every feeling one: the pleasant high-energy ones and a racing mind lead to 5-4-3-2-1, the calm
  ones and stress to Breathe). "Done for now" stays as a quiet link.
- **Get curious, Watch it**: the wave is drawn zoomed in (2.6 screens wide, 210 tall) and the view glides with the dot;
  the time left is big (64 points); a line under the wave says where it is (building, the top, falling); "Right now it is"
  is three big buttons, and each answer leaves a mark on the line where the dot was, so the person sees their own urge's
  shape (urge surfing: rate it as it changes).
- **Breathe and 5-4-3-2-1 first.** SOS lifts them for everyone (core `UR_BEST`: Breathe +2, 5-4-3-2-1 +3), Breathe can be
  the suggestion from the first round, and both carry "A strong first pick" in SOS and on the Learn tab's tools until a
  person's own record gives them another tag. In the golden fixtures' cases they went from about 12% of the first
  suggestions to about 59%; Go to bed still leads late at night (now paired with one of them), and a person's own record,
  a go-to, "Not for me" and passing over a suggestion still win over the lift.

## The journal: pull Today down, feelings first (the owner, October 26, 2026)

The owner asked for a journal reached by pulling Today down (like refreshing a page), where every entry starts with the
How We Feel picker before the writing, designed to Apple and How We Feel standards. Decided with the owner: the pull lands
on the journal; the tab that was called Journal is now **Pattern**; entries sync like
the log; the page offers one open question to start from, never one aimed at the feeling just named ("you feel lonely, do
you wish someone loved you?" reads as pointed).

**Built** (core `journal-entries.ts`, `app/journal.tsx`, `components/journal.tsx`, `components/pull-door.tsx`):

- **The pull.** On iOS the page's own bounce is the pull; on Android and the web the touch is followed at the top with the
  same give (screen.tsx `usePull`). As the page comes down a round pencil grows in the gap above it; past 64 points it
  fills with the accent color and swells, the phone ticks, and the words say "Let go for your journal". Short of it, the page
  springs back. Until the journal has been opened once, a line under Today's title says where it is, and a tap on it opens
  it too; More has a Journal row for good.
- **The journal** is a shade that comes down from the top, carrying on from where the thumb let go, and goes back up with
  the X, a push up from its bottom edge, or Back. One plain dark page (#16142A) in either theme. Each day is lit softly
  from behind by the colors of every feeling named that day, wherever it was named: the journal, Name the feeling, the
  ride, and the feeling named for before a slip (core `jnTimeline`; a word from Name the feeling within an hour of an
  urge ridden out counts as the ride's). A day's name shows once, over its logs, newest first (core `jnLogs`): each
  entry with words is a log of its own, its feeling as its title over what was written; the feelings named on their own
  between entries read in order as a title of their own ("Restless then Grateful"), the same size and room as an entry's
  so they read as logs of their own and not as tags of the entry above, in the plain sans, up to three to a log
  and within three hours, so a busy day starts another log rather than hiding any (the owner, October 26: nothing a
  tap away, no "…"). With more than one log in a day, each says its time, small, at the right. Each log is a dark card (the owner
  picked it on October 26 from five looks shot on the simulator: see-through cards, rows with a chevron, one panel per
  day, a pencil on each, dark cards), like Apple's Journal: a low dark fill and a hairline edge, so the light glows
  around it and it reads as something to open (NN/g: a bounded card is the clearest sign a thing opens; plain text was
  the owner's complaint, "these don't really look like entries I can open"). The whole card is the button, and it
  lightens a little under the thumb. A journal feeling with nothing written yet says "Add a few words". Logs in a day sit close
  and days sit far apart (Day One's day heading over separate rows; its users asked for less weight between same-day
  entries). The same feeling named twice in a row reads once. The light is one soft field behind the list, "circles
  over a wash" (the owner picked it on October 26 from six looks shot on the simulator, after the straight lanes alone
  lost the loose randomness he liked): each feeling a soft round glow at its own steady random place, big enough to
  reach the logs either side, over a faint wash of four lanes running down the page that take a color from every log,
  so the circles keep the randomness and the wash fills any gap (two colors never meet through clear, which turns
  grey). The light fades out over the right half so a dark margin stays at the right with no edge, starts just above
  the first log, never over the week, and fades out under the last. A log's light is its own feelings, so the colors
  match the words. The owner's screenshot the same evening found the light drifting: a log's glow landed on the log
  above, Hopeful had no yellow, a two-line title's last color glowed at the end of its first line. So each glow now sits
  on its own log, under its own word (from the title's real lines, so a title on two lines puts each color on its
  line), with only a little steady randomness, round rather than a flat stripe, and reaching just to the middle of the
  logs above and below, where it fades out: two logs meet halfway with no gap and neither one's color sits over the
  other's words. Newest first all the way down stays (Day One and Journey sort the same way, and no journal found sorts
  a day oldest first under newest-first days); a title reads in the order the feelings came, like a sentence. Coming back from an entry, the list is where it was (the day picked, the filter, how far down); after
  a new entry, it is at the top, where the new one lands. Checked on the simulator with a made-up week of the edge cases:
  nothing logged at all, one feeling and nothing written, eight feelings in a day, three written entries in one color, a
  long entry, a day with nothing, a slip's feeling alone, feelings named in the journal with no words, three long words
  in one title, and the same feeling twice in a row. Across the top, the last seven
  days as seven little round lights (the day being shown sharp, the others soft), each the day's newest two colors, each keeping its own half (three run together
  into a muddy grey; Spotify's Audio Aura keeps to a listener's top two moods the same way); a tap goes to that day. The
  bottom of the list fades out just above the New entry bar and is gone behind it, so no line peeks out beside it. The
  list runs up under the title, which floats on a soft fade, so the light has no hard edge. A small filter is the end of
  the line under Journal ("· Everything"): everything, written, urges, slips. Low at the bottom, a bar floats: "New
  entry" and "Check in with how you feel", with a round accent pencil. The owner's path there (October 26): color-washed
  cards, then plain cards, then a constellation of shapes on a dotted line, then a plain grouped list were all turned
  down; from ten drawn directions he picked "soft light", then from ten of those "the day's light", and put it together
  with the week of lights and the plain sans. Before the first feeling: the four colors as scattered shapes, what the
  journal is and that it is private.
- **The feeling flow** inside the journal (the four bubbles and the field of feelings) sits on the same dark page; only
  its background changed. The owner, October 26: the moving bubbles and the field's scrolling are not to be changed
  unless he asks; he asked the same day for each bubble to have two see-through twins wandering behind it instead of
  one (everywhere the four bubbles are used). A tap on a day in the week starts the list at that day, with the week
  still on top; today shows them all.
- **An entry** starts with "How are you feeling?" and the same four big bubbles as Name the feeling, the ride and the
  slip (`QuadBubbles`), then the field of feelings, grown out of the bubble tapped. The word named, the entry exists
  (naming is the part that helps most). The page is plain and dark like Apple's Journal (the owner, October 26, with a
  picture of Journal: no feeling color everywhere, no shape), with the feeling's own light coming down softly from the
  top, the same light the day has in the list: round glass Back and a small date at the top; the feeling's
  word; one line, "Explore why you might be feeling _stressed_", where the word in its color is the only color on the
  page; a hairline; then the page in Instrument Sans 18 on 27, cursor in the accent, a dark keyboard, "Start anywhere…".
  Done is a full-width accent button low where the thumb is, and moves up into the top bar as a round check while the
  keyboard is up. A tap off the words or a swipe down puts the keyboard away. Back on a new entry goes back into the
  field of feelings on its word (with nothing written, the entry is let go, so another word starts afresh); on an entry
  read back it goes to the list. It saves quietly as it is written. An entry read back has no nudge and no keyboard until
  tapped, and Delete entry, under Done, asks twice. Research (two agents, October 26): the text is the design (iA), one
  action and silent saving (Notes, Bear), counts and prompts that pile up feel like a test ("Still").
- **Data.** Each entry is its own record, `journal/<id>`, so two devices writing on the same day never overwrite each
  other and a long entry (up to 20,000 characters) never pushes a day past a record's size. Backups carry them; the
  privacy page says what is kept. The sync server cleans records with core, so it needs the deploy that carries this.

**The research behind it** (a research agent, October 26): naming a feeling calms it (Lieberman et al. 2007; Torre and
Lieberman 2018), and precise names for hard feelings go with less drinking and fewer lapses (Kashdan et al. 2010;
Emery et al. 2022; Anand et al. 2017). Expressive writing helps a little (Frattaroli 2006, r = .075), two minutes on two
days was enough in Burton and King 2008, writing about a best possible self helps with less distress (King 2001), and
self-compassion after a failure raises the drive to do better (Breines and Chen 2012). The risk is rumination (Gortner et
al. 2006), which is why the questions lean toward what went right, what helped and what is ahead. Pull-down gestures are
hard to discover (Clear's review), hence the first-time line and the More row.

**For later, the owner's call:** whether writing in the journal feeds the flame (points for an entry, as for an honest
log); a tab layout with the journal as a tab of its own (the owner is open to it); "on this day" (a hopeful entry from a
month ago brought back); a Face ID lock for the journal; a slip's comeback offering a short structured entry.

## Notes with a voice, and the icon calendar (the owner, October 25 and 26, 2026)

The owner: the notifications are generic, the same thing every time, and should feel like Duolingo's, while staying
clear about what they ask and never flooding anyone; the icon should change now and then like Duolingo's owl; and a note
showed the app icon on both sides.

- **The double icon.** iOS shows a note's attached picture beside the app icon, and the flame picture was the icon's own
  art. The pictures are gone (`apps/mobile/assets/notify`, `flameNoteSvg`, `Nudge.pic`).
- **A title on every note** instead of "Daybook", and the flame speaking: warm, a little playful, one emoji in the
  title, never guilt. Every note says what it asks and how long it takes ("Tap to start", "A few minutes", "Under a
  minute"): a plain title doubled opens over a catchy one in Service NSW's test, and iOS's Reduce Interruptions filters
  vague notes. Five to eleven wordings per kind (core `NUDGE_WORDS.pick`), titles about 30 characters and bodies under 90.
  Some fit only a moment, the way Duolingo's templates sleep: "Day 12 ☀️" with three or more days in the run, the points
  to the next form when it is 60 or fewer away, the level from 3, morning and evening lines.
- **No repeat in a week.** A wording sent (or planned) in the last week is skipped while there are others, then the best
  scorer wins (Yancey and Settles 2020).
- **Fewer notes.** Apps people keep send one a day, and more get switched off (Localytics: 37% would turn them off at 2
  to 5 a week of marketing; Braze caps at one a day). Two a day at most now, three only with the heads-up before hard
  hours; the lesson and the check-in within two hours are one note; three come-back notes (days 2, 7 and 30, the last
  one saying so) instead of five. One evening note did not wear off over 30 days in Drink Less.
- **The icon calendar** (`docs/icon-calendar.md`). Duolingo's seasonal and melting icons ship as the app's own icon in
  an update, for everyone (the melting look was tried and dropped). An app switching its own icon shows a pop-up each time, cannot do it while closed, and has
  been turned down in review, so Daybook does it Duolingo's way: `npm run icons -- --look <look>` before an update.
