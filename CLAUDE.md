# Daybook: notes for Claude

Daybook helps a person quit porn (or another habit) without shame: log urges and slips honestly, learn the pattern, and keep going after a slip. People lose when they give up hope, not when they slip, so every part of the app protects hope.

## What Daybook is for

The motto: **A private, honest companion for changing a habit: log urges and slips without shame, learn your pattern, and keep going after a hard day. One codebase for iOS, Android and the web.**

The goal is a lasting change of identity: from "I am a porn addict" to "I am someone who is clean", and for good. Nothing in the app is the goal in itself. Streaks, counts, the flame, points, levels, badges, quests, lessons and the log are all tools and guides for that change, worth keeping only while they help it. Judge every screen, word, feature and animation by one question: does this help the person become, and see themselves as, someone who is free of the habit? Something that wins attention but does not serve that change (a streak to protect for its own sake, a number to chase, a reward that feels like a game) is a cost, not a feature.

## What the owner has asked for (keep these)

- **Hope first, always.** People lose when they give up hope, not when they slip. A slip after a long stretch is a huge win
  compared with where the person started, and the app says so. Never make a long run feel like something that can be lost.
- **No big goals pushed early.** Long goals (like 90 days) can be known about, but the app does not build excitement around
  them until the person has gone at least a week with no slip. Early on, the goals are small and close.
- **Progress is never all or nothing.** Avoid any count that drops to zero and makes day 89 feel like a disaster. Prefer
  measures that hold what was earned (for example, no-slip days in a recent window) over a single streak that resets.
- **Earned things stay earned.** Points, levels, badges and awards are never taken away, including when rules or lessons
  change. Graduation (planned, see docs/plan.md) is a permanent award, even if the person later goes back to recovery mode.
- **Lessons teach with confidence.** Do the research well, then write plainly and surely. A lesson must be wholesome, true
  to its spirit, motivating and hopeful; it should never read as unsure. Not every line has to be proven in a paper.
- **Working style.** Work on your own and ask only about design changes or real uncertainty. When `npm run typecheck` and
  `npm test` pass, merge to `main` and let it deploy; GitHub keeps everything, so a change can always be rolled back.
  Say when a piece of work needs a different model or effort, and otherwise just keep going on the one in use.

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
npm run icons            # app icons from the flame
npm run build -w @daybook/api
cd apps/mobile && npx expo start
```

## Rules for changes

- **The golden tests are a frozen record.** `packages/core/test/fixtures` holds what the legacy app computed. They stay as regression tests: if one fails, a change touched an old rule. Fix the change, or if the rule was meant to change, update the expected values in the fixtures by hand in the same commit and say why in the commit message. New rules get ordinary unit tests.
- **Words in the app:** plain words, no contractions ("do not", "it is"), no hedging, never shame. A slip is data, not a reset. A saved setting that holds starting words (like the urge plan) is compared with them, so when starting words change, `normSettings` maps the old words to the new ones.
- **Lessons rest on good research and speak with confidence.** Science in a lesson cites a source in `SRC` or `OB_SRC` and does not invent numbers. The scope ("Behind this") says where the research comes from and what it means for the reader, in a sure, hopeful voice, without piling up doubts.
- **Privacy first.** The repository is public. Never commit a log, a backup, `.env` files, keys, Terraform state or `tfvars`, AWS account numbers, or personal details. Logs stay on the device until the person turns on sync, and then live only in their own AWS account.
- **AWS:** deploys use GitHub OpenID Connect (no stored keys). The deploy role can never make, change or take on an IAM role, and cannot invoke the sync function: any role the app needs is made in `infra/bootstrap` (run by the owner), never in `infra/app`. Keep everything pay-per-use; the budget alert is $5 a month.
- **Git:** commit as the owner's personal GitHub noreply address (set with `git config user.email` in this repository), never a personal or work email. This computer may be signed in to a work GitHub account by default.
- Before calling a change done: `npm run typecheck`, `npm test`, and for app changes `npx expo export --platform web` and a look at the result.
