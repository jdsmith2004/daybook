# Daybook: notes for Claude

Daybook helps a person quit porn (or another habit) without shame: log urges and slips honestly, learn the pattern, and keep going after a slip. People lose when they give up hope, not when they slip, so every part of the app protects hope.

## How the code is laid out

- `legacy/index.html` is the original single-file app and **the source of truth for every rule** until the new app does everything it does. The Claude artifact it came from is **retired**: do no more work on the artifact itself. Changes to rules still go into `legacy/index.html` first (see below), and only reach the new app.
- `packages/core` has every rule with no UI. `src/legacy/core.js` is **generated** from the legacy file by `tools/extract-legacy.mjs` (never edit it by hand). `src/legacy/core.d.ts` types the parts the app uses. The other files in `src` are pure TypeScript ports of the legacy parts that read global state (the Today cards, settings actions, backups, sync records).
- `apps/mobile` is the Expo app (Expo Router, SDK 58). It runs on iOS, Android and the web. Read `apps/mobile/AGENTS.md` before touching Expo APIs: they change every SDK, so check the versioned docs, not memory.
- `services/api` is the sync Lambda. `infra/` is Terraform (see `infra/README.md`).

## Commands

```sh
npm test                 # all tests (core golden tests run in America/Chicago time)
npm run typecheck
npm run extract          # after changing legacy/index.html
npm run fixtures         # record what the legacy app computes (needs Chromium)
npm run icons            # app icons from the flame
npm run build -w @daybook/api
cd apps/mobile && npx expo start
```

## Rules for changes

- **The port must be exact.** A rule changes in `legacy/index.html` first, then `npm run extract`, `npm run fixtures`, `npm test`. When porting a legacy function to TypeScript, add it to the fixtures and the golden tests so it is checked against the legacy app.
- **Words in the app:** plain words, no contractions ("do not", "it is"), no hedging, never shame. A slip is data, not a reset. Keep the legacy wording when porting a screen.
- **Claims match sources.** Anything presented as science cites a source in `SRC` or `OB_SRC` and stays inside what that source says; limits go in the lesson's scope. No invented numbers.
- **Privacy first.** The repository is public. Never commit a log, a backup, `.env` files, keys, Terraform state or `tfvars`, AWS account numbers, or personal details. Logs stay on the device until the person turns on sync, and then live only in their own AWS account.
- **AWS:** deploys use GitHub OpenID Connect (no stored keys). Every role the app stack makes must carry the permissions boundary from `infra/bootstrap`. Keep everything pay-per-use; the budget alert is $5 a month.
- **Git:** commit as the owner's personal GitHub noreply address (set with `git config user.email` in this repository), never a personal or work email. This computer may be signed in to a work GitHub account by default.
- Before calling a change done: `npm run typecheck`, `npm test`, and for app changes `npx expo export --platform web` and a look at the result.
