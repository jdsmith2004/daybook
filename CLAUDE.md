# Daybook: notes for Claude

Daybook helps a person quit porn (or another habit) without shame: log urges and slips honestly, learn the pattern, and keep going after a slip. People lose when they give up hope, not when they slip, so every part of the app protects hope.

## What Daybook is for

The motto: **A private, honest companion for changing a habit: log urges and slips without shame, learn your pattern, and keep going after a hard day. One codebase for iOS, Android and the web.**

The goal is a lasting change of identity: from "I am a porn addict" to "I am someone who is clean", and for good. Nothing in the app is the goal in itself. Streaks, counts, the flame, points, levels, badges, quests, lessons and the log are all tools and guides for that change, worth keeping only while they help it. Judge every screen, word, feature and animation by one question: does this help the person become, and see themselves as, someone who is free of the habit? Something that wins attention but does not serve that change (a streak to protect for its own sake, a number to chase, a reward that feels like a game) is a cost, not a feature.

## The flame is the heart of the app (the owner, October 22, 2026)

The goal is not pure function. Daybook needs form and soul as much as it needs the right button, and the flame mascot is
that soul. The whole app is built around it: everything a person does (a lesson, an urge ridden out, an honest log, a
comeback) feeds the flame, and they watch it level up and grow into its next form. The flame growing is the picture of the
person getting free of the habit, so it is never shrunk to a thumbnail, hidden behind a tap, or treated as decoration to
cut for space. When a screen is simplified, keep the spirit: the flame stays big and alive on Today, and every win shows
up as the flame getting stronger. Judge a design by both questions: is the next step obvious, and does it still feel
alive and warm? A screen that is tidy but has no spirit is wrong too.

Every day has one simple spine: **a lesson every day**, with the next thing to do always obvious. The care tools (SOS,
Already happened, Planning a slip?) stay in plain reach on Today, and the app actively leads people to the tools they
need, without letting the screen turn into a list of features.

## What the owner has asked for (keep these)

- **Hope first, always.** People lose when they give up hope, not when they slip. A slip after a long stretch is a huge win
  compared with where the person started, and the app says so. Never make a long run feel like something that can be lost.
- **Hope is not softness: there are stakes (the owner, November 8, 2026).** Not everything is light and happy. The person
  has to know that not doing the work gives something up, and the app says so plainly and firmly: "you are dimming your
  fire", a flame that burns lower when the person drifts or keeps feeding the habit, a push to get off the app that is
  pulling them in. Do not soften a nudge into something cheerful and toothless, and do not push back on stakes as "shame".
  The line is this: stakes are about the next choice and what it costs, never about who the person is, and never piled on
  in the hours after a slip, when the job is to bring them back. Earned things (points, level, badges) still stay earned.
- **No big goals pushed early.** Long goals (like 90 days) can be known about, but the app does not build excitement around
  them until the person has gone at least a week with no slip. Early on, the goals are small and close.
- **Progress is never all or nothing.** Avoid any count that drops to zero and makes day 89 feel like a disaster. Prefer
  measures that hold what was earned (for example, no-slip days in a recent window) over a single streak that resets.
  One exception, by the owner's choice (October 30, 2026): each counting mode has one count, shown the same everywhere, and
  on strict a slip puts it to 0 (gentle takes one day off, step down is hours since the slip). What was earned still stays:
  the longest run, the no-slip days, the comebacks, points, level, badges and graduation never drop, and the day of a slip
  says so. Nothing asks about the count after a slip and nothing rescues it (core `hero.ts`, `runLedger`).
  New people start on gentle (or step down when it happens daily), and coming back from step down never lands on strict by
  itself, so strict is only ever a person's own choice (the owner, October 30, 2026; core `obMode`, `countBack`).
- **Earned things stay earned.** Points, levels, badges and awards are never taken away, including when rules or lessons
  change. Graduation (planned, see docs/plan.md) is a permanent award and a celebration; it does not change Today.
- **Never lock care.** SOS and its tools, Already happened, Planning a slip?, logging, Rekindle, the plan and Today work
  with no account and no payment, always. A free account opens the lessons after the first eight (see accounts.ts; moved from three by the owner, October 30, 2026). Ask
  for one only at good moments, never after a slip.
- **Setup is hard to skip, and it ends with the account ask.** A new person is meant to finish setup and leave knowing the
  app will help them. There is no "skip setup" button; closing setup (or SOS, or leaving the app) brings it back the next
  time, and every question inside it can still be skipped. Its last page asks for a free account, because the plan was
  just built; "Keep it on this phone" stays as a quiet choice, since an account is never required (care is never locked,
  and the App Store does not allow forcing sign-up for features that work without one).
- **Daybook is free, and it asks for money (the owner, October 23, 2026).** Building it costs the owner real time and
  money, and tips are how that comes back and how Daybook reaches more people. The free version is complete care; a tip
  of $5 or more makes a person a supporter, which opens the extras: sync and the safe copy, the deeper stats and pattern
  pages, and the extra flame looks (`supporter.ts`). The record allows monthly support later. The ask is warm, a little
  pushy and very easy: a few taps, Apple's in-app purchase first on iPhone (Kind $5, Generous $10, Amazing $20), with the
  web tip page (Stripe, which takes Apple Pay) offered as a good second choice. It never shames, never says the person
  owes anything, never asks in the hours after an SOS or a slip, and stops for good once the person is a supporter.
  People who had an account before this keep sync. The tip jar is never removed or hidden on a platform without asking
  the owner first. Later the owner may sell products in the app instead; ask before building toward that.
- **Daybook Pattern, the one product beyond the tips (the owner, October 30, 2026).** Monthly $3 (Apple only), or lifetime, which
  is simply a tip of $10 or more: $10, or $30 to give more (never called a donation: Daybook is not a charity). It opens the
  deeper pattern, a monthly read of what changed, and sync (while it is active, for monthly). From the day it goes on sale
  (`PATTERN_FROM`, `supporter.ts`, unset until the owner has set up the products in docs/launch.md), a $5 tip opens sync and the safe
  copy; a tip from before that day keeps everything it opened, for good, and that date is never moved. The ask leads with a true
  line from the person's own log (`patPreview`) and is not made at all without one. When a monthly plan ends, the pages go back to
  the tip rules; nothing leaves the log, and finished month reads stay readable. The Hard hours card, the heads-ups and every care
  tool stay free: never move them behind it.
- **Think like a business, too (the owner, October 23, 2026).** Daybook exists to improve lives and to make money, by
  charging the people who get the most from it and by a good pricing model. Care stays free because that is how Daybook
  reaches the most people, and that rule guides what is locked; it is never said in the ask. Never tell a person they do
  not need to pay, that the free version is enough, or anything else that talks them out of it: an ask sells what they
  get, concretely. Charge for value, not access (sync, deeper insight into their own pattern, the flame's looks). Ask at
  moments of earned value (a level, a milestone, the first week), make the middle tip the obvious choice, keep paying to
  one tap, and make the free side feel generous, since generous treatment is what brings tips and good ratings. When
  building any feature, ask whether it helps the person and whether it helps Daybook earn or grow, and say so in plans.
- **The store listing never names porn (Apple rejected 1.3.3 under Guideline 1.1 for it, November 11, 2026).** No App
  Store or Play text (name, subtitle, description, promo text, What's New, keywords) and no store screenshot uses "porn",
  "pornography", "pornfree", "NoFap", "sex" or any other explicit word. Speak of quitting a habit, urges, slips, self-control
  and being free. The app itself, the website and posts may still say porn plainly. Before every store submission, check
  the listing text and every screenshot for these words (the `store-assets` pictures included) and fix them first: repeat
  rejections bring extended review and put the developer account at risk.
- **Never link to the code.** The owner worked and paid for this codebase and does not want it handed to anyone to copy
  (the owner, October 23, 2026, and upset that a "See the code" link was put on the website). No page, app screen, store
  listing or message ever links to the repository, says the code is public, or invites people to read it. Privacy is
  shown by what the privacy page promises, not by pointing at the code.
- **Lessons inspire hope; that is their main goal.** A lesson must be wholesome, true to its spirit, motivating and hopeful,
  written plainly and surely. The quality of the lesson matters far more than checking its sources: do not spend effort
  validating sources, and do not rewrite, flag or ask about the "Behind this" notes. That work is not wanted.
- **The lessons are set in stone (the owner, November 14, 2026: "these lessons need to be enshrined in stone ... what i don't want
  to happen is have the lessons lose their soul and spirit when i'm doing design changes").** Read `docs/lessons.md` before touching
  any lesson's words or the lesson player. A lesson's words change only with the owner's yes for that change. A design change, a
  player rewrite or a "tighten the words" pass never cuts, hides, grades or reorders them. Short plays the Short cards, and Long plays
  every card. `packages/core/test/lesson-lock.test.ts` fails when a lesson's words change. Better ideas go to the owner as samples,
  never as a batch rewrite. The lessons lost their quality in November 2026 through two design passes that meant no harm, so this
  rule is not a formality.
- **Never use one of the 15 monthly EAS builds without the owner's explicit yes (the owner, November 11, 2026, after a
  Screen Time build was started without asking).** Anything that runs on Expo's servers and counts against the free plan's 15
  iOS builds a month (`eas build` without `--local`, the App Store or Play workflow) needs the owner's yes for that exact build
  in the chat, every time: say which profile and that it uses one of the 15, then wait. A task that says "make a TestFlight
  build" is not that yes, and one yes covers one build. Builds that use none of the 15 need no permission: local builds
  (`expo run:ios`, Xcode, the simulator, `eas build --local`) and setting up credentials when no build can be queued.
  **Store builds run through the GitHub workflow, not the Mac (the owner, November 13, 2026: "that action was built so we
  would use it").** Once the owner says yes, start it with `gh workflow run store.yml --ref main` (Actions, App Store): it runs
  the checks, builds on Expo and sends it to TestFlight with no one at the keyboard. Never hand the owner a local `eas build`
  command or run one on the Mac, except as the one-time fix when the workflow fails on something only an Apple sign-in can do.
- **Working style.** Work on your own and ask only about design changes or real uncertainty. When `npm run typecheck` and
  `npm test` pass, merge to `main` (deploying as below); GitHub keeps everything, so a change can always be rolled back.
  Effort levels save usage: every plan marks each step with the Opus effort level it needs (high for sync, accounts,
  data and anything that can lose what a person earned; medium for screens, words and small rules; low for mechanical
  changes). The owner sets the effort, and the session does every step marked for that level, in order, then stops and
  says which level to switch to for what is left. It never starts a step marked for another level.
  **Cheaper models wherever they do as well (the owner, October 22 and November 11, 2026).** Before each step, ask whether a
  smaller model could do it just as well; if so, hand it off with a complete brief. Subagents: research, mapping code,
  summaries, screenshot critics, scans and mechanical edits go to Sonnet; quick lookups go to Haiku. Opus (or Fable) keeps
  design decisions, putting findings together, and code that can lose data or post publicly. Sessions: a session whose job
  is research, a plan or a read-only check starts on Sonnet; Opus is for design, building and risky code. Every brief for a
  new session says which model and effort it should run on.
  Plans, reviews and mockups go in the chat (pictures as image files) and in docs/plan.md, never in a claude.ai Artifact.
  The old review artifacts are retired: never edit or republish them. (The rule is there so work lands in the code, not
  in a hosted page. Claude Design is allowed for trying out a look, by the owner's choice; the app's code stays the real thing.)
- **No AI slop (the owner, October 30, 2026).** Daybook must look made on purpose by someone who cares, never like a template.
  Before building or changing any screen, read "The look" in docs/design-standards.md, and before calling it done, look at a
  picture of it and run docs/craft-checklist.md on it. The usual slop: cards inside cards, a border plus a soft shadow, an icon in a
  tinted circle, capitals on small labels, a pile of pills, a subtitle that explains the screen, half font sizes, gradients for
  decoration, every screen the same layout. `packages/core/test/craft.test.ts` fails on what a machine can check. A new design
  that wins by removing soul fails too: spirit comes first, and the flame gets bigger, not smaller.
- **Be a coworker, not an assistant.** Your opinion matters, so say it. When a request is too vague to do well, say what is
  unclear and what you would do, instead of guessing quietly. When you think a request is wrong, or see a better way, push
  back plainly and say why, before the work, not after it. Do not agree just to please. Once we have talked it through and
  the owner decides, do it that way and stay focused on the task. Push back only when there is a real disagreement with
  what the owner asked, and not in every report. Choices you made yourself are not pushback: stand behind them, and say
  plainly what you chose where the owner should know (a decision made on their behalf, a risk, something untested).
- **Redesigning a part from the ground up (the owner, October 24, 2026, after the SOS redesign).** When the owner asks for
  a part to be rebuilt (a flow, its tools, its lessons), this is how it is done:
  - **Start from the purpose, not from what is there.** One goal leads: the person's experience, built around helping
    them get better and quit. For SOS that is getting through this urge and getting better at it every time; for logging
    a slip it is coming back stronger and less likely to slip again. The current screens, earlier decisions and
    docs/design-standards.md are inputs, not limits; drop anything that does not serve the goal.
  - **Research a lot first.** Look for real studies on what works (and how strongly), write down what they support, and
    design from that. Science first, but something that clearly helps can stay even when the evidence is thin; cut the
    parts that do not help.
  - **Make it seamless enough to amaze.** Think of Apple's philosophy and of apps like How We Feel that pack a lot of
    information cleanly into a small space: it starts doing something on the first tap, one living thing in the middle,
    no clutter, no menus to read under stress, and every moment feels finished (motion, haptics, night colors).
  - **Split the work across agents, every time, without being asked (the owner, October 25, 2026).** Research (the
    studies, how Apple, How We Feel and other apps do it), mapping the code and data a part touches, and other
    self-contained pieces go to subagents running in parallel; the main session designs, builds and checks. When the
    owner asks whether you know these standards, answer plainly, then go on.
  - **Ask the real questions early,** each with the options and a recommendation, then build without stopping. When the
    owner says to use your judgment, decide and say what you chose.
  - **Build it on a feature branch, look at it on the web, and show the owner on the web** (the simulator only when the
    part is native and the web cannot show it; see "Web first" below). Merge it when it is good, then show the owner on the
    web (see "Merge, then show it on the web" below).
- **Merge, then show it on the web (the owner, November 14, 2026: "just do a solid, thorough QA on the web, but we don't need
  to use a simulator. And then all of them, I want to show me what changes they made on the web. And they're free to merge as
  well. And then I can just tell them to make changes if they need to. But just merge it and say, here's the changes on the
  web that I made. Take a look. And would you like to archive the chat?").** Every chat, redesigns included: a thorough QA
  on the web (no simulator), merge to `main` without waiting for a yes, then leave the web preview open on the change in the
  browser pane with pictures in the report ("here are the changes I made on the web, take a look"), and ask "Archive this
  chat?" with Yes and No. The owner asks for changes after. A question the owner was asked to decide (a choice of direction,
  sample lessons to judge) still waits for the answer before the work it decides. The iPhone QA happens before publishing.
- **Merge to main, then archive; the iPhone check is TestFlight from main (the owner, November 13, 2026: "i want the chats
  to merge to main then archive alot of these chats keep not merging to main bc it's not tested on iphone, we will test it on
  iphone by making a build from main and publishing it to testflight").** A chat whose work is done (tests pass, QA on the web
  done) merges it to `main` and is archived. A check only a real iPhone can do (Health, Face ID, Screen
  Time, widgets, notifications) never holds a merge: write it in the chat's hand-over note, and it is checked on the TestFlight
  build made from `main`. That build still needs the owner's yes when it uses one of the 15 EAS builds.
- **Web first; one testing chat builds the app (the owner, November 13, 2026: "i'd rather move back to relying on web
  testing and then only test on the app if we need to bc it's burning alot of credits and taking alot of time", and "we should
  have a testing chat instead where all the branches get merged the testing chat does one build tests everything then sends
  status back").** Chats QA on the web (`npx expo start --web` or `npx expo export --platform web`) and make no simulator or
  Xcode build of their own. Only a part the web cannot run (Health, widgets, Live Activities, Screen Time, Face ID, haptics,
  native modules) needs the app: write what to check in the hand-over note and leave it to the testing chat. The testing chat
  makes one local Release build from `main` (no EAS build), walks every hand-over note's checks on the simulator, fixes or
  sends back what fails, and reports one status to the owner.
- **The icon follows the calendar (the owner, October 26, 2026).** Before every App Store build, run `npm run icons --
--auto`: it sets the app icon to the look for that time of year (Halloween, autumn, winter, New Year, Valentine's) or
  the plain flame, by date, with no need to ask. Commit the icon and say which one the update carries. The calendar and
  why it ships this way are in `docs/icon-calendar.md`.
- **Deploy to AWS when it is worth it, not on every push.** The repository is private (the owner, October 23, 2026),
  so there is no GitHub Pages preview; the AWS site is the only site. It deploys only when the last commit of a push has
  `[deploy]` in its message (or the owner presses Actions, Deploy, Run workflow). Use your judgment: add `[deploy]` once
  per finished piece of work the owner should see live (a feature, a fix people would notice, a change to the public
  pages or the sync service), on the last commit of that work, not on each small commit along the way. Plan and doc
  changes never need it. Say in the report whether you deployed. If something would cost money, tell the owner what and
  how much before relying on it. CloudFront gives 1,000 free cache refreshes (invalidation paths) a month, and each AWS
  deploy uses 2. Before deploying, count this month's successful AWS deploys
  (`gh run list --workflow Deploy --status success`); once the month has used 900 paths (450 deploys), ask the owner
  before deploying again.

## How the code is laid out

- `legacy/index.html` is the original single-file app. It is **retired**: every screen is in the new app now, so it is kept only as history. Never change it, and never treat it as the source of truth.
- `packages/core` has every rule with no UI, and it is the source of truth. New rules and new content go here, in TypeScript, in the file for their part (lesson rules in `lessons.ts`, lessons 33 on and their sources in `lessons-more.ts`, the short words a lesson card shows first in `lesson-beats.ts`, and so on). `src/legacy/core.js` holds the rules first copied from the legacy app. It is no longer generated: leave it alone, and when one of its rules or words has to change, make the smallest change there, or move that part to TypeScript and remove it from `core.js`. `src/legacy/core.d.ts` types the parts the app uses.
- `apps/mobile` is the Expo app (Expo Router, SDK 58). It runs on iOS, Android and the web. Read `apps/mobile/AGENTS.md` before touching Expo APIs: they change every SDK, so check the versioned docs, not memory.
- `services/api` is the sync Lambda. `infra/` is Terraform (see `infra/README.md`). The device side of sync is `packages/core/src/sync.ts`, tested against the Lambda's handler in `services/api/test/client.test.ts`.
- `docs/plan.md` is the work that is planned next. `docs/for-fable.md` records the one Fable run so far (a security review); lessons do not need one.

## Commands

```sh
npm test                 # all tests (core golden tests run in America/Chicago time)
npm run typecheck
npm run format           # Prettier over the whole repo (format:check is what CI runs)
npm run icons            # app icons from the flame
npm run story            # a scripted week of a made-up person, walked through the web app, a picture per day
npm run build -w @daybook/api
cd apps/mobile && npx expo start
```

## Rules for changes

- **The golden tests are a frozen record.** `packages/core/test/fixtures` holds what the legacy app computed. They stay as regression tests: if one fails, a change touched an old rule. Fix the change, or if the rule was meant to change, update the expected values in the fixtures by hand in the same commit and say why in the commit message. New rules get ordinary unit tests.
- **Everything you touch sits low, where the thumb is.** People hold the phone in one hand, on the app and on the
  website alike (the website is used on phones too), and the thumb only reaches the lower half of the screen comfortably.
  So on every screen (lessons, setup, the check-in, full-screen moments, SOS tools, sheets):
  - The question, the title and any explaining sit at the top, to be read.
  - What the person touches to answer (choices, Yes/No, sliders, option cards) sits in the lower half, just above the
    main button. A screen whose answers float near the top is wrong, even when the main button is low.
  - The open middle is for the one thing being decided, shown big: the number a slider sets (`SliderValue big`), a
    count, a guess. Not empty space, and not the controls.
  - The main button (Next, Save, Done, Start, Continue) is at the very bottom, full width, with any quiet link (Skip,
    Cancel) just under it.
  - Close and Back stay at the top, as they are by platform habit.
  - No "Not yet", "Not now", "Later" or similar link that only closes the page: the X already does that. A quiet link
    is there only when it does something the X does not (skip one question, record a choice, go somewhere else).
  - The one exception is a text box and the button that saves it: they stay together near the top, because the keyboard
    covers the bottom of the screen while typing.
  - In a full-screen moment (`SceneFrame`) or a sheet (`SheetFrame`), wrap the answers and the main button in `Dock`
    (components/scene.tsx), which pushes them to the bottom. For a number from a range, use `Slider` (components/slider.tsx).
- **Every screen follows "The look" in docs/design-standards.md, and tools and moments the rest of it:** one squiggle (`SQUIGGLE`), one timer (`ToolTimer`), smooth motion,
  two-step choices, and the X going one step back. Read it before building or changing a tool, or reusing these patterns.
- **Formatting is Prettier, from one place.** `.prettierrc.json` at the root sets it for everything (single quotes, lines up
  to 160, `>` on the last line of a tag), `.editorconfig` covers editors, and `.prettierignore` leaves the frozen files
  alone (the legacy app, `core.js`, the golden fixtures). Run `npm run format` before committing; CI fails on unformatted
  files. Do not hand-format against it or add a second config.
- **Words in the app:** plain words, no contractions ("do not", "it is"), no hedging, never shame. A slip is data, not a reset. A saved setting that holds starting words (like the urge plan) is compared with them, so when starting words change, `normSettings` maps the old words to the new ones.
- **Lessons speak with confidence and hope.** New lessons name their source in `SRC` or `OB_SRC` and write the scope ("Behind this") in a sure, hopeful voice. Existing scope notes are left as they are (see "Lessons inspire hope" above).
- **Privacy first.** Never commit a log, a backup, `.env` files, keys, Terraform state or `tfvars`, AWS account numbers, or personal details. Logs stay on the device until the person makes an account. Daybook is a public app, so accounts live in the owner's AWS account: each person's records are stored under their own account id and can only be read with their sign-in; nothing is shared, sold or tracked, and "Delete my account" removes everything. Never add anything that reads people's logs on the server. **Analytics are wanted, and broad (the owner, November 9, 2026: "track as much as we can so we can improve the app"; it replaces the old rule of only the counts).** Daybook learns from an event stream (core `events.ts`) beside the daily totals (core `pulse.ts`): each phone has a random install id, never tied to a name, email or account, never synced or backed up, and never sent with a sync request or a push token. Every event name and every value is on a fixed list (`EV_NAMES`, `EV_PROPS`), checked on the phone and on the server, so the journal, notes, voice notes and any typed words can never leave the phone, nor names, email, the account id, Apple Health's nights, exact times or location. It is on for everyone, with a quiet notice and the off switch in More; it is never sold or shared, and used only to improve the app; the server keeps it 2 years. Say "anonymous" honestly (never tied to who you are, never your words), not "completely anonymous". Never join the events with accounts, payments or synced records, and never send the install id with anything that names a person. A new event or value goes on the list and on the privacy page in the same change, and the App Store label in docs/launch.md follows. The one personal detail published on purpose is the support email (`SUPPORT_EMAIL` in core `support.ts`, and the pages in `apps/mobile/public`), by the owner's choice. When what the app keeps or sends changes, `apps/mobile/public/privacy.html` changes with it.
- **AWS:** deploys use GitHub OpenID Connect (no stored keys). The deploy role can never make, change or take on an IAM role, and cannot invoke the sync function: any role the app needs is made in `infra/bootstrap` (run by the owner), never in `infra/app`. Keep everything pay-per-use; the budget alert is $5 a month.
- **Git:** commit as the owner's personal GitHub noreply address (set with `git config user.email` in this repository), never a personal or work email. This computer may be signed in to a work GitHub account by default.
- Before calling a change done: `npm run format`, `npm run typecheck`, `npm test`, and for app changes `npx expo export --platform web` and a look at the result, against docs/craft-checklist.md.
- **QA the experience before calling anything done, without being asked (the owner, November 11, 2026: "if you didn't qa
  means other chats aren't doing qa either and missing the experience part").** Passing tests is not QA. Walk the whole flow
  as the person would, on the web (the simulator or the phone only when the web cannot run it; see "Web first" below), from the moment it first
  appears to the way out, and look at a picture of every screen and every note. For each one ask: is it clear on first sight
  with nothing to read twice, is it easy to use one-handed, does it come up at a good moment and cleanly, does it feel alive
  and made with care, does it move the person toward seeing themselves as free, and could it annoy them enough to delete the
  app (too many notes, a nag, a trap, a guilt trip, something broken). Also read the code for what only a device shows (stuck
  states, double notes, a way out that fails). Fix what you find, then say in the report what you checked and what you could
  not check.
