# Daybook

A private, honest companion for changing a habit: log urges and slips without shame, learn your pattern, and keep going after a hard day. One codebase for iOS, Android and the web.

> **Your log never goes in this repository.** The repository is public. Logs live on your devices and, once sync is on, in your own AWS account.

## What is here

| Folder | What it is |
| --- | --- |
| `legacy/index.html` | The original single-file app (now retired). It is the source of truth for every rule until the new app does everything it does. |
| `packages/core` | Every rule with no UI: counting, run saves, step down, points, levels, badges, quests, the flame, lessons. Most of it is copied verbatim from the legacy app by `tools/extract-legacy.mjs`; golden tests check it against the legacy app itself. |
| `apps/mobile` | The app (Expo and React Native, with Expo Router). The same code runs on iOS, Android and the web. |
| `services/api` | The sync service: one Lambda behind API Gateway, with DynamoDB. |
| `infra/` | Terraform for AWS. `bootstrap` is run once by hand; `app` is deployed by GitHub Actions. See [infra/README.md](infra/README.md). |
| `tools/` | The legacy extractor and the icon maker. |

## Run it

You need Node 22 (`nvm use` reads `.nvmrc`).

```sh
npm install
npm test              # every test: the golden tests against the legacy app, and the sync API
npm run typecheck

cd apps/mobile
npx expo start        # then press w for the web, or scan the QR code with Expo Go on your phone
```

Expo Go (free, in the App Store and Google Play) runs the app on your phone straight from your computer, with no build. Everything the app uses today works in Expo Go.

## Changing a rule

The rules live in `legacy/index.html` until the port is done. To change one:

1. Change it in `legacy/index.html`.
2. `npm run extract` copies the rules into `packages/core/src/legacy/core.js`.
3. `npm run fixtures` records what the legacy app now computes (it needs Chromium; see `packages/core/scripts/make-fixtures.mjs`).
4. `npm test` checks that the core gives exactly the same answers.

CI fails if `core.js` is out of date with `legacy/index.html`.

## Building for the stores

`apps/mobile/eas.json` has the build profiles. From `apps/mobile`:

```sh
npx eas-cli@latest login
npx eas-cli@latest init                          # links the project to your Expo account (once)
npx eas-cli@latest build --profile preview      # an install link for your own phone
npx eas-cli@latest build --profile production   # for the App Store and Google Play
```

The bundle ID (iOS) and package name (Android) are set the first time you build, and cannot change after the app is in a store.

## Working from a computer signed in to another GitHub account

Commit and push this repository only as yourself. In this repository:

```sh
git config user.name "Your Name"
git config user.email "ID+username@users.noreply.github.com"   # your GitHub noreply address (Settings > Emails)
```

To push with your personal account on a computer that is signed in to another one, use an SSH key for the personal account with its own host name in `~/.ssh/config`:

```
Host github-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes
```

Then point this repository at it: `git remote set-url origin git@github-personal:jdsmith2004/daybook.git`.
