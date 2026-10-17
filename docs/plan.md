# What is planned next

## Graduation (replaces the lighter Today)

Model: Opus at high effort. The owner's direction is in CLAUDE.md ("What the owner has asked for"); this follows it.

### What the owner asked for

- 90 days is the graduation goal. Graduating is an award that is kept for good.
- After graduating, the person can go back to recovery mode at any time. The award stays.
- No "lighter Today". Remove it.
- The 90-day goal is not pushed early. Before the person has gone a week with no slip, the app may mention that graduation
  exists, but does not build excitement around it. After the first week, it can.
- A slip close to the goal must not feel like losing everything. 89 days and then a slip is a huge win compared with where
  the person started.

### Design

1. **How graduation is earned: 90 no-slip days within the last 100 days**, not 90 in a row. A slip on day 89 costs one
   day of progress, not 89: the count drops from 89 to 88 and keeps climbing. The number of no-slip days in the window is
   what Daybook shows ("72 of 90 days toward graduation"), never a run that resets to zero. `GRAD_DAYS = 90` and
   `GRAD_WINDOW = 100` live in one place in `packages/core` so they are easy to change.
2. **When it shows**
   - Before the first 7-day run with no slip (the `clean-7` badge, or `longest >= 7`): nothing on Today. One quiet line in
     Milestones says that graduation exists.
   - After that: a graduation progress line in Milestones and on the Days card ("Toward graduation: 41 of 90"), with plain,
     warm words. No countdown or pressure on Today.
   - From 80 days on: a gentle "almost there" note, never framed as something that can be lost.
3. **Graduating**: a celebration (the existing celebrate host), a permanent award (a badge `graduated`, earned once and
   kept, plus `gradAt` in settings so the date is remembered), and a short screen: what changes, what stays, and that a slip
   later goes to Rekindle like any other slip.
4. **Graduated mode vs recovery mode** (`settings.mode`: `'recovery' | 'graduated'`, optional and recovery by default)
   - Graduated mode: Today keeps the flame, points, SOS, logging, Rekindle, Learn and the plan, and lets the daily stops,
     the days card and the review nudge go quiet, with a heading that names the achievement ("Graduated · since March 3").
   - "Back to recovery mode" is one tap, from Today and from Settings, and carries no warning words. The badge and the date
     stay. Graduated mode can be turned on again any time after earning it.
   - After a slip in graduated mode: Rekindle as always. Today adds a gentle line for a few days: "Want the full support of
     recovery mode for a while?" Never "lost", "failed" or "reset".
5. **Slips after a long stretch, everywhere**: check Rekindle, the Days card and Journal for words that make a long run
   feel lost. Add a line that honors what was built ("89 days. That is huge, and it still counts."), using the run that
   just ended.
6. **Remove the lighter Today**: `packages/core/src/lighter.ts` and its test, `apps/mobile/src/app/lighter.tsx`, the
   Settings row, the Today offer and lighter layout, and `quiet` in Hero (or reuse it for graduated mode). Anyone who turned
   it on (`settings.lean`) is simply in recovery mode; nothing needs to move.
7. **Tests**: the window count (a slip at 89 gives 88, then 89 the next day), the 7-day gate, the award staying through a
   switch back and through later slips, and the words never saying lost, failed or reset.

### Open question (decided unless the owner says otherwise)

- Graduated mode keeps the same pared-down Today the lighter Today had, under the new name. If the owner wants graduation to
  be only an award with no change to Today, step 4 shrinks to the award and the switch is dropped.
