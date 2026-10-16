# The legacy app (retired)

`index.html` is the original Daybook: one file with the whole app, made to run as a Claude artifact. Every screen is now in the new app, so this file is kept only as history. Do not change it, and do not treat it as the source of truth: the rules live in `packages/core`.

Its pure parts were first copied into `packages/core/src/legacy/core.js`, and the fixtures in `packages/core/test/fixtures` record what this file computed for many logs and moments. Both stay as a frozen record that the golden tests check against.
