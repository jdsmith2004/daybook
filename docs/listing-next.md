# Store listing, next version (draft for the owner)

Draft only. Nothing here is submitted: 1.3.3 is still waiting on Apple, so `docs/launch.md` step 6 stays as it is until the owner picks.
This draft leads with becoming free (plan.md, ideas #60 and #61). Limits: name 30, subtitle 30, promo 170, keywords 100, Play short description 80.

## Notes the owner should see first

1. **"No tracking" is no longer true.** The current promo and description say "No ads. No tracking." Since the November 9 analytics decision
   (anonymous event stream, off switch in More), that line is wrong. The draft says what is true: no ads, nothing sold, and only anonymous
   counts, never your words. Apple's privacy label and the privacy page already say this, so a listing that says "no tracking" also
   contradicts them.
2. **The Pattern screenshot shows "35 clean days".** "Clean" is not a banned store word, but the words pass removed it from the app's own
   voice. The picture should be re-shot after that change lands (`npm run shots`), or it will contradict the app.
3. **Keywords:** the current list has "relapse" and "clean", which the words pass retired. The draft drops them (and "accountability", to fit 100 letters) and adds "faith",
   "willpower" and "prayer". Faith words are keywords only; the description stays plain for everyone.
4. **What's New** is a placeholder shaped around becoming free. It must be edited to match what the build really carries.
5. The screenshot captions are baked into the pictures (`shots.json`), so a changed caption means re-running `npm run shots`.

## Side by side

### Name (unchanged)

| Current                  | Next                     |
| ------------------------ | ------------------------ |
| Daybook: Master Yourself | Daybook: Master Yourself |

### Subtitle (30 letters at most)

| Current                   | Next                       |
| ------------------------- | -------------------------- |
| Break a habit. Stay free. | Become someone who is free |

Next, 26 letters. Alternate: "Quit a habit. Be free of it." (28).

### Promotional text (170 at most)

| Current                                                                                    | Next                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Free, with no ads and no tracking. Care is free for everyone. A slip is data, not a reset. | Become someone who is free of it. Log urges, learn your pattern, and keep going after a hard day. A slip is data, not a reset. No ads. |

### Keywords (100 at most)

| Current                                                                                               | Next                                                                                            |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `habit,quit,urges,recovery,relapse,self control,addiction,tracker,clean,sober,journal,accountability` | `habit,quit,urges,self control,recovery,faith,sober,addiction,tracker,journal,willpower,prayer` |

### What's New (placeholder: edit to match the build)

| Current                                                                                                                                                                                                                                                                                                          | Next                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Your flame is bigger, in a clear sky, with nothing written over it. Lessons have a new look, and the fire moves at its tips. The wind-down now ends by putting your flame to bed. After a slip, every way in leads you back through Rekindle, and your plan for next time can name the tools already in Daybook. | Daybook is now built around one thing: becoming someone who is free of the habit. Every urge you ride out and every honest log feeds your flame, and the first week has a clearer path. After a slip, Rekindle brings you back and keeps what you earned. Your words still never leave your phone. |

### Description, first lines and the privacy block

Current opening:

> Daybook is a private, honest companion for quitting a habit for good, whether it is something you watch, drink, bet on or do. Log urges and slips in a few taps, learn your pattern, and keep going after a hard day. A slip is data, not a reset: what you build stays yours.

Next opening:

> Become someone who is free of it. Daybook is a private, honest companion for quitting a habit for good, whether it is something you watch, drink, bet on or do.
>
> Every urge you ride out is proof. Every honest log is a step. Your flame grows with each one, and after a hard day it is still there, waiting for you to come back. A slip is data, not a reset: what you earned stays yours.

The rest of the description ("What is inside", the supporter block, the 988 line) stays as in launch.md, except the privacy block:

| Current                                                                                                                                                      | Next                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| • No ads. No tracking. Nothing is sold.                                                                                                                      | • A promise, not a setting: nothing you write ever leaves your phone, nothing is sold, and there are no ads.             |
| • Your log stays on your phone. A free account is optional: sign in with Apple or an email, and it opens every lesson. Delete my account removes everything. | • Your log stays on your phone. A free account is optional and opens every lesson. Delete my account removes everything. |
| (none)                                                                                                                                                       | • Only anonymous counts help improve the app, never your words, and you can turn them off in More.                       |
| • Face ID lock, and a plain name and icon on your home screen.                                                                                               | (unchanged)                                                                                                              |

Also change in "What is inside": "Graduation: a permanent award at 90 days with no slip." leads with a long goal; per the plan, swap to
"Your flame: it grows with every lesson, every urge you ride out, and every comeback."

### Play short description (80 at most)

| Current                                                        | Next                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Private help to quit a habit. Log urges and slips, keep going. | Become someone who is free of a habit. Private help for urges and slips. |

### One line per screenshot (baked into the pictures, `shots.json`)

| #            | Screen  | Current line                                              | Next line                                                         |
| ------------ | ------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 1            | Today   | Quit and stay free (Built on research. No ads.)           | Become someone who is free (Your flame grows with every win.)     |
| 2            | SOS     | Breathe through it. It passes.                            | Ride it out. It passes.                                           |
| 3            | Slip    | A slip is not a reset                                     | A slip is not the end                                             |
| 4            | Grow    | Watch your flame grow                                     | Every win feeds your flame                                        |
| 5            | Pattern | Learn your pattern                                        | Know what sets it off                                             |
| 6            | Learn   | A lesson every day                                        | A lesson every day                                                |
| 7            | Private | Nobody has to know                                        | Your words stay on your phone                                     |
| Search card  |         | Quit and stay free (private help built on research)       | Become someone who is free (private help, built on research)      |
| Header       |         | Keep going after a hard day                               | Keep going after a hard day                                       |
| Play feature |         | Daybook: Quit and stay free. Keep going after a hard day. | Daybook: Become someone who is free. Keep going after a hard day. |

## Banned words scan

Rule: no "porn", "pornography", "pornfree", "NoFap", "sex" or any explicit word in any store text or screenshot. Both columns above were
scanned (whole words, case-insensitive) for those and for "nude", "explicit", "erotic", "masturbat", "xxx": none found. The seven
screenshots' baked captions are listed above and contain none; the app screens inside the pictures were looked at for the Slip and
Pattern shots only, so the other five should be eyeballed once more before submission (the check CLAUDE.md already requires).
