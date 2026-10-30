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
- **No big goals pushed early.** Long goals (like 90 days) can be known about, but the app does not build excitement around
  them until the person has gone at least a week with no slip. Early on, the goals are small and close.
- **Progress is never all or nothing.** Avoid any count that drops to zero and makes day 89 feel like a disaster. Prefer
  measures that hold what was earned (for example, no-slip days in a recent window) over a single streak that resets.
  One exception, by the owner's choice (October 30, 2026): each counting mode has one count, shown the same everywhere, and
  on strict a slip puts it to 0 (gentle takes one day off, step down is hours since the slip). What was earned still stays:
  the longest run, the no-slip days, the comebacks, points, level, badges and graduation never drop, and the day of a slip
  says so. Nothing asks about the count after a slip and nothing rescues it (core `hero.ts`, `runLedger`).
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
- **Think like a business, too (the owner, October 23, 2026).** Daybook exists to improve lives and to make money, by
  charging the people who get the most from it and by a good pricing model. Care stays free because that is how Daybook
  reaches the most people, and that rule guides what is locked; it is never said in the ask. Never tell a person they do
  not need to pay, that the free version is enough, or anything else that talks them out of it: an ask sells what they
  get, concretely. Charge for value, not access (sync, deeper insight into their own pattern, the flame's looks). Ask at
  moments of earned value (a level, a milestone, the first week), make the middle tip the obvious choice, keep paying to
  one tap, and make the free side feel generous, since generous treatment is what brings tips and good ratings. When
  building any feature, ask whether it helps the person and whether it helps Daybook earn or grow, and say so in plans.
- **Never link to the code.** The owner worked and paid for this codebase and does not want it handed to anyone to copy
  (the owner, October 23, 2026, and upset that a "See the code" link was put on the website). No page, app screen, store
  listing or message ever links to the repository, says the code is public, or invites people to read it. Privacy is
  shown by what the privacy page promises, not by pointing at the code.
- **Lessons inspire hope; that is their main goal.** A lesson must be wholesome, true to its spirit, motivating and hopeful,
  written plainly and surely. The quality of the lesson matters far more than checking its sources: do not spend effort
  validating sources, and do not rewrite, flag or ask about the "Behind this" notes. That work is not wanted.
- **Working style.** Work on your own and ask only about design changes or real uncertainty. When `npm run typecheck` and
  `npm test` pass, merge to `main` (deploying as below); GitHub keeps everything, so a change can always be rolled back.
  Effort levels save usage: every plan marks each step with the Opus effort level it needs (high for sync, accounts,
  data and anything that can lose what a person earned; medium for screens, words and small rules; low for mechanical
  changes). The owner sets the effort, and the session does every step marked for that level, in order, then stops and
  says which level to switch to for what is left. It never starts a step marked for another level.
  Plans, reviews and mockups go in the chat (pictures as image files) and in docs/plan.md, never in a claude.ai Artifact.
  The old review artifacts are retired: never edit or republish them. (The rule is there so work lands in the code, not
  in a hosted page. Claude Design is allowed for trying out a look, by the owner's choice; the app's code stays the real thing.)
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
  - **Build it on a feature branch, look at it on the web and on the iOS simulator, and show the owner on the simulator**
    (a release build, so it runs at real speed). Never merge it before the owner has seen it; this overrides "merge when
    the tests pass" above.
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
- `packages/core` has every rule with no UI, and it is the source of truth. New rules and new content go here, in TypeScript, in the file for their part (lesson rules in `lessons.ts`, lessons 33 on and their sources in `lessons-more.ts`, and so on). `src/legacy/core.js` holds the rules first copied from the legacy app. It is no longer generated: leave it alone, and when one of its rules or words has to change, make the smallest change there, or move that part to TypeScript and remove it from `core.js`. `src/legacy/core.d.ts` types the parts the app uses.
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
- **Tools and moments follow docs/design-standards.md:** one squiggle (`SQUIGGLE`), one timer (`ToolTimer`), smooth motion,
  two-step choices, and the X going one step back. Read it before building or changing a tool, or reusing these patterns.
- **Formatting is Prettier, from one place.** `.prettierrc.json` at the root sets it for everything (single quotes, lines up
  to 160, `>` on the last line of a tag), `.editorconfig` covers editors, and `.prettierignore` leaves the frozen files
  alone (the legacy app, `core.js`, the golden fixtures). Run `npm run format` before committing; CI fails on unformatted
  files. Do not hand-format against it or add a second config.
- **Words in the app:** plain words, no contractions ("do not", "it is"), no hedging, never shame. A slip is data, not a reset. A saved setting that holds starting words (like the urge plan) is compared with them, so when starting words change, `normSettings` maps the old words to the new ones.
- **Lessons speak with confidence and hope.** New lessons name their source in `SRC` or `OB_SRC` and write the scope ("Behind this") in a sure, hopeful voice. Existing scope notes are left as they are (see "Lessons inspire hope" above).
- **Privacy first.** Never commit a log, a backup, `.env` files, keys, Terraform state or `tfvars`, AWS account numbers, or personal details. Logs stay on the device until the person makes an account. Daybook is a public app, so accounts live in the owner's AWS account: each person's records are stored under their own account id and can only be read with their sign-in; nothing is shared, sold or tracked, and "Delete my account" removes everything. Never add anything that reads people's logs on the server, and no analytics beyond the anonymous counts (by the owner's choice, October 22, 2026; core `pulse.ts`). Since October 28, 2026 (the owner: "I just want to track it, I don't want to ask them") the basic counts, the day opened and how far setup got (`pulseBasic`), are sent without asking; every other count waits for the person's yes in More, and More turns all of them off. Only the fixed names in `PULSE_KEYS` with small numbers, never a word, time, trigger, id or the log, and the server keeps only totals per day. A new count is added to `PULSE_KEYS` and to the list on the privacy page in the same change. The one personal detail published on purpose is the support email (`SUPPORT_EMAIL` in core `support.ts`, and the pages in `apps/mobile/public`), by the owner's choice. When what the app keeps or sends changes, `apps/mobile/public/privacy.html` changes with it.
- **AWS:** deploys use GitHub OpenID Connect (no stored keys). The deploy role can never make, change or take on an IAM role, and cannot invoke the sync function: any role the app needs is made in `infra/bootstrap` (run by the owner), never in `infra/app`. Keep everything pay-per-use; the budget alert is $5 a month.
- **Git:** commit as the owner's personal GitHub noreply address (set with `git config user.email` in this repository), never a personal or work email. This computer may be signed in to a work GitHub account by default.
- Before calling a change done: `npm run format`, `npm run typecheck`, `npm test`, and for app changes `npx expo export --platform web` and a look at the result.
