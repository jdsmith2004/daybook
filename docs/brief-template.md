# Brief for a new chat

Copy this, fill it in, and send it as the first message of any new session. A session knows only what the brief tells it.

```
Title: Daybook: <thing>

Goal: <what the person who uses the app gets, in one or two sentences. Judge by CLAUDE.md's question: does this help the person become,
and see themselves as, someone who is free of the habit?>

Files and area: <paths to read and change; what to leave alone; who else is working nearby>

Done looks like: <what is true when finished: behavior, a picture, tests. Say what is NOT part of the task and goes in the report as a follow-up.>

Effort and model: <Opus high / Opus medium / Sonnet medium. High for sync, accounts, data and anything that can lose what a person
earned; medium for screens, words and small rules; low for mechanical edits. Research, plans and read-only checks: Sonnet.>

Read first: CLAUDE.md. Then what applies:
- screens: "The look" in docs/design-standards.md and docs/craft-checklist.md (run the critic on a picture)
- words: plain, no contractions, no hedging, never shame; no "clean", "addict" or "relapse" in the app's own voice
- Expo code: apps/mobile/AGENTS.md
- store text: the store rule in CLAUDE.md (never names porn)
- anything the app keeps or sends: the privacy rules in CLAUDE.md and apps/mobile/public/privacy.html

The identity question: does the result treat the person as an addict or a score, or as someone becoming free? Say how in the report.

Finish: npm run format, npm run typecheck, npm test. Commit as the owner's noreply address, push the branch, report what was done first.
For a release: npm run release-check.
```
