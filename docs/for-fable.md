# For Fable

Work worth a Fable run. Fable time is limited, so only what needs it is here.

## 1. Security review before the first AWS deploy: done (October 16, 2026)

Fable found seven issues. Fixed: the deploy role could read logs by invoking the sync function or making a role (it can now
make no roles; the bootstrap stack makes the sync role); the web sign-in sat in storage for 90 days (now per tab, or a year
with rotation when the browser is trusted); the account-admin scope allowed an email takeover (removed; closing an account goes
through the API); one request erased the log for good (now a week's undo); no provider lock files (written at first init, see
infra/README.md). Accepted for one person: rejected requests are still billed, and the default CloudFront certificate allows
old TLS versions. A second review is only worth it after a large change to infra/ or sign-in.

The brief it was given:

A fresh, independent look at what protects a person's log, by a model that did not write it. Ask for findings ranked by
severity, each with the file and line, and nothing changed without asking.

- `infra/bootstrap/main.tf`: the GitHub OpenID Connect trust (only `main` of this repository), the deploy role's policy (can it
  read the table, change user passwords, or escape the boundary?), the permissions boundary, the account lock.
- `infra/app/*.tf`: the Cognito pool and app client (PKCE, no secret, the callback and logout addresses, the new
  `aws.cognito.signin.user.admin` scope, invite-only), the JWT authorizer, throttling, the Lambda role, the DynamoDB table
  (point-in-time recovery, deletion protection), CloudFront and its Content-Security-Policy.
- `.github/workflows/deploy.yml` and `ci.yml`: which jobs can get an AWS token, pinned actions, what reaches the public logs.
- `services/api/src/*.ts`: the user id only from the token, the cursor check, sizes and the daily allowance, erase.
- `apps/mobile/src/lib/auth.ts`, `secret.ts`, `secret.web.ts`, `sync.tsx`: the PKCE flow, where tokens are kept, refresh and
  sign-out, and that nothing about the log reaches anyone but its owner.

Suggested: Fable at high effort, one run, the files above attached.

## 2. The SOS tools' shapes and motion: done (October 21, 2026)

Fable read orb.tsx, lib/breath.ts, lib/m3-shapes.ts, shapes.tsx, motion.ts, timer.tsx and the tool files, spot-checked
the shape port against androidx (RoundedCorner, the cut sharing between corners, star, rectangle, circle, customPolygon
with mirroring, normalized: all match; the arc is split into quarter turns where androidx draws one cubic, and the bounds
are measured on the curve where androidx uses the control points, so shapes fill their box by a hair more), and measured
the plain web build in Chromium at phone size, light and dark: the dots were sampled ten times a second over a full
breath (no dot moved more than 15 points in a tenth of a second, the ring lands at full size as the words change, the
cluster rests at the bottom), the ids were checked for collisions (none), the console for errors (none), and Reduce
Motion (a still ring, 32 of 32 dots still). Nothing in the breath was broken on the web, and nothing was found by reading
that would break on iOS or Android. Fixed and deployed: the "How is it now?" answers now sit in a Dock at the bottom
(they were in the top third); the dark-mode glow behind the breath is a paler, thinner gold (gold at strength over the
dark blue mixed to brown); the small breath in Get curious redraws its morphing outline about 30 times a second instead
of every frame (it was a new path and a layout on every frame, on the JavaScript thread); a stale comment in orb.tsx.
Not verified, since nobody could run it on a phone here: how heavy 32 shadowed dots are on a mid-range Android, and the
`boxShadow` on each dot (New Architecture only; outset shadows need Android 9 or later). Noted, not changed: the dark
palette's `sunSoft` is a dark olive, so the Get curious breath and Surprise's spinning faces read as brown at night; the
breath clock re-registers its frame callback on every render (ten a second), which is wasteful but harmless.

The brief:

```
Daybook (github.com/jdsmith2004/daybook) just shipped a redesign of its SOS tools: Android's Material 3 Expressive
shapes, wavy lines and a particle breath. Another model wrote it, and it was checked only on the web build in headless
Chromium. Nobody has tried it on a phone yet. I want a fresh, independent look by a model that did not write it: find
what is broken, wrong or rough, fix what is clearly a bug, and ask before changing a design. Read CLAUDE.md and
apps/mobile/AGENTS.md first and follow them (thumb rule, words, formatting, effort, merge and [deploy] rules).

[If I have tried it on my phone, my notes go here: what I saw, on which phone.]

What to look at, most important first:
1. The particle breath, apps/mobile/src/components/orb.tsx (Orb and Dot). It runs on Reanimated 4.7 with worklets
   0.13 (Expo SDK 58): the UI thread on iOS and Android, plain JavaScript on the web. Check it by reading as well as by
   running, since nobody can run it on a phone here: worklet closures and the useAnimatedStyle dependency arrays,
   shared values that hold arrays (cluster and scatter are swapped every breath), 32 animated views each with an SVG
   radial gradient and a boxShadow (is boxShadow supported on native here, and is it too heavy on a mid-range Android?),
   gradient ids ("orbGlow", "dot0" to "dot31") that collide if two Orbs or other SVGs are mounted at once on the web,
   timing against breathPhase in packages/core, the Reduce Motion path, and cleanup of withRepeat.
2. The shape kit: apps/mobile/src/lib/m3-shapes.ts claims an exact port of androidx graphics-shapes RoundedPolygon and
   all 35 MaterialShapes. Spot-check it against the androidx source (the rounding and the corner features, and the
   morph point matching used by MorphShape). Then components/shapes.tsx (Shape, MorphShape, WavyRing, WavyLine)
   and lib/motion.ts (the springs, useReducedMotion).
3. The tools that use them: components/tools/ride.tsx (Get curious wave, Name the thought "Let it go"), calm.tsx
   (Breathe setup, 5-4-3-2-1 shapes that morph in), pause.tsx (wavy timer), scene.tsx (Move's beat, Surprise,
   My reasons medallion, Go to bed), components/tool-grid.tsx (tool icons on shapes), components/scene.tsx (Finish
   burst). Also packages/core/src/sos.ts pickIdea (an empty calm-move menu now falls back to MENU_DEFAULT).
4. Two things already noticed, not yet fixed: the "How is it now?" screen after a tool has its answer cards in the top
   half (breaks the thumb rule in CLAUDE.md); in dark mode the glow behind the breath dots looks muddy.

How to check:
- npm ci, npm run typecheck, npm test. For the screen: cd apps/mobile && npx expo export --platform web, serve dist
  with a fallback to index.html, and drive it with playwright-core (Chromium is at /opt/pw-browsers) at 390x844,
  light and dark. Routes: /sos, /tool/breathe, /tool/ground, /tool/curious, /tool/thought, /tool/pause, /tool/move,
  /tool/surprise, /tool/reasons, /tool/bed.
- Do not judge motion from the screenshot build (npm run shots, or EXPO_PUBLIC_SHOTS=1): src/shots/mode.ts forces
  Reduce Motion on, so the breath sits still there on purpose. Use the plain build.
- Measure motion instead of trusting one picture: sample the dots' transforms over a full breath, and capture frame
  strips.

What I want back:
- Findings ranked by how much a person in the middle of an urge would notice. Each one names the file and line, what
  they would see, and on which platform. Say plainly what you could not verify (anything native-only).
- Clear bugs fixed on a branch, merged to main when typecheck and tests pass, with [deploy] on the last commit (count
  this month's deploys first, as CLAUDE.md says). Design changes proposed in chat, with pictures as image files, not
  made.
- A short record of the run added to docs/for-fable.md under "2. The SOS tools' shapes and motion".
```

Suggested: Fable at high effort, one run. Better after the owner has tried Breathe and 5-4-3-2-1 on a phone, with those
notes in the brief.
