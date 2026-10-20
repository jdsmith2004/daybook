# What is planned next

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
- The tip link is on the web only. The App Store, like Google Play, asks for its own billing for tips (rule 3.1.1).
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
