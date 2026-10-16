# Daybook app

The Expo app for iOS, Android and the web. Every rule comes from `@daybook/core`; this folder is only screens and storage.

```sh
npx expo start                                   # w for the web; scan the QR code with Expo Go on a phone
npx expo export --platform web --output-dir dist # the web build that the deploy uploads
npx tsc --noEmit
```

- `src/app`: the screens (Expo Router: every file is a route; `_layout.tsx` is the frame).
- `src/components`: Today's cards, the flame, the tab bar (`app-tabs.tsx` on phones, `app-tabs.web.tsx` in a browser), and small UI parts.
- `src/lib/store.tsx`: the log on this device. Each record is its own storage entry and is marked "not synced yet" when it changes.
- `src/lib/backup.ts` and `backup.web.ts`: restore and save the backup file the legacy app makes.
- `src/lib/theme.ts`: colors and type from the legacy app.

Read `AGENTS.md` before changing anything that uses an Expo API.
