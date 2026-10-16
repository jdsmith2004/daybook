# Daybook app

The Expo app for iOS, Android and the web. Every rule comes from `@daybook/core`; this folder is only screens and storage.

```sh
npx expo start                                   # w for the web; a development build on a phone (see below)
npx expo export --platform web --output-dir dist # the web build that the deploy uploads
npx tsc --noEmit
```

- `src/app`: the screens (Expo Router: every file is a route; `_layout.tsx` is the frame).
- `src/components`: Today's cards, the flame, the tab bar (`app-tabs.tsx`), the lock (`lock.tsx`), the sync section of Settings (`sync-card.tsx`), and small UI parts.
- `src/lib/store.tsx`: the log on this device. Each record is its own storage entry and is marked "not synced yet" when it changes.
- `src/lib/sync.tsx`: sync between devices (off until the person signs in). The merging itself is `@daybook/core` `sync.ts`, tested against the real sync handler in `services/api/test/client.test.ts`.
- `src/lib/auth.ts`: signing in with Cognito's own sign-in page (authorization code with PKCE). `secret.ts` keeps the sign-in in the keychain or keystore; `secret.web.ts` in the browser's storage for this site.
- `src/lib/reminders.ts`: the daily reminders, made on the phone (none on the web).
- `src/lib/prefs.ts`: choices that belong to one device and never sync: the theme, the sound guide, reminders, the lock.
- `src/lib/backup.ts` and `backup.web.ts`: restore and save the backup file the legacy app makes.
- `src/lib/theme.ts`: colors and type from the legacy app.

Read `AGENTS.md` before changing anything that uses an Expo API.

## Sync in a build

Sync is offered only when the build knows where to sync: `EXPO_PUBLIC_SYNC_URL`, `EXPO_PUBLIC_AUTH_DOMAIN` and `EXPO_PUBLIC_CLIENT_ID`. The deploy workflow sets them for the web app and prints them in its summary. For a phone build, copy `.env.example` to `.env.local` (git ignores it), or set them as EAS environment variables. Without them the app works the same, with the log on the device only.

The sign-in page sends people back to `daybook://auth` on a phone and to `<web address>/auth` on the web. Both are listed in `infra/app/auth.tf`; a new address must be added there first.

## On a phone

Expo Go cannot test everything: Face ID needs a development build (`npx expo run:ios`, or an EAS development build), and so does signing in, because Expo Go cannot receive `daybook://auth`. Reminders work in Expo Go.

## Testing sync without AWS

`services/api/test/client.test.ts` runs the app's sync logic against the real sync handler with an in-memory table (two devices, deletions, erasing, paging, a second person). To click through it in a browser, build the web app with the three `EXPO_PUBLIC_*` settings pointing at a local stand-in for Cognito that wraps the same handler.
