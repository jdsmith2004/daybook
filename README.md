# Daybook

A private, honest companion for changing a habit: log urges and slips without shame, learn your pattern, and keep going after a hard day. One codebase for iOS, Android and the web.

> **Your log never goes in this repository.** The repository is public. Logs live on your devices and, once sync is on, in your own AWS account.

## What is here

| Folder              | What it is                                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy/index.html` | The original single-file app. It is retired and kept only as history; the new app does everything it did.                                                                                                                                                                  |
| `packages/core`     | Every rule with no UI: counting, run saves, step down, points, levels, badges, quests, the flame, lessons. It is the source of truth. `src/legacy/core.js` holds the rules first copied from the legacy app; golden tests check them against what the legacy app computed. |
| `apps/mobile`       | The app (Expo and React Native, with Expo Router). The same code runs on iOS, Android and the web.                                                                                                                                                                         |
| `services/api`      | The sync service: one Lambda behind API Gateway, with DynamoDB.                                                                                                                                                                                                            |
| `infra/`            | Terraform for AWS. `bootstrap` is run once by hand; `app` is deployed by GitHub Actions. See [infra/README.md](infra/README.md).                                                                                                                                           |
| `tools/`            | The icon and sound makers.                                                                                                                                                                                                                                                 |

## Run it

You need Node 22 (`nvm use` reads `.nvmrc`).

```sh
npm install
npm test              # every test: the core (with the golden tests), and the sync API
npm run typecheck

cd apps/mobile
npx expo start        # then press w for the web, or scan the QR code with Expo Go on your phone
```

Expo Go (free, in the App Store and Google Play) runs the app on your phone straight from your computer, with no build. Everything the app uses today works in Expo Go.

## Changing a rule

Every rule lives in `packages/core`. New rules go in its TypeScript files, with unit tests. The rules first copied from the legacy app are in `src/legacy/core.js`, which is edited only when one of them has to change.

The golden tests in `packages/core/test` check those rules against fixtures recorded from the legacy app. If a change is meant to change what an old rule gives, update the expected values in the fixtures in the same commit.

## Building for the stores

The iPhone app is built from GitHub, so no Mac or any one computer is needed: Actions, **App Store**, Run workflow
(`.github/workflows/store.yml`). It runs the checks, builds on Expo's servers and sends the build to TestFlight. The
one-time setup (Expo, signing, the App Store record) is in [docs/launch.md](docs/launch.md).

Submitting for App Review is step 7 of [docs/launch.md](docs/launch.md): every text to paste, and a prompt for Claude in
Chrome, so it can be done from any computer. The pages the store links to (support, privacy policy, terms of use) are
plain HTML in `apps/mobile/public`, published with the web app:

- Support: https://d3c9g6kent5bsr.cloudfront.net/support.html
- Privacy policy: https://d3c9g6kent5bsr.cloudfront.net/privacy.html
- Terms of use: https://d3c9g6kent5bsr.cloudfront.net/terms.html

Android has its own button (Actions, **Google Play**) and its own one-time setup and listing: step 8 of
[docs/launch.md](docs/launch.md).

When something the app keeps or sends changes, update `privacy.html` (and its date) in the same change, and the App
Privacy answers in launch.md step 6.

`apps/mobile/eas.json` has the build profiles. By hand, from `apps/mobile`:

```sh
npx eas-cli@latest login
npx eas-cli@latest build --profile preview      # an install link for your own phone
npx eas-cli@latest build --profile production   # for the App Store and Google Play
```

The bundle ID (iOS, in `app.json`) and package name (Android) cannot change after the app is in a store.

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
