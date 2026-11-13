# Screen Time on your iPhone: the test

The night wait is the one part of Daybook that acts while the app is closed. The simulator runs none of Apple's Screen Time, so
this test on your own iPhone is the one that counts. It replaces the old hard-hours test (November 12, 2026, work package WP2 in
`docs/review-plan.md`; the steps come from the code audit's device script).

Write down what you see at each step, even when it passes: the exact words, the time, and anything that felt wrong, cold or
confusing. A step that fails is still useful: write down what Apple did.

## Before you start (about 15 minutes, with the Mac)

This is a **local** build to your phone on a cable. It uses **none** of the 15 monthly EAS builds.

1. On the iPhone: Settings, Privacy and Security, **Developer Mode** on. Plug it into the Mac and tap Trust.
2. In Xcode: Settings, Accounts, the developer account is signed in (team `2G4K7PN999`).
3. On the Mac, in a terminal:

   ```bash
   cd ~/personal/daybook/apps/mobile && DAYBOOK_PULL=1 APPLE_TEAM_ID=2G4K7PN999 npx expo run:ios --device --configuration Release
   ```

   Pick your iPhone when it asks. Xcode's automatic signing makes the app's ID, the three extensions' IDs and the App Group with
   Family Controls (Development).

4. For a quick test, set the Daybook times short where a step says so, and put them back after.

A cable build is not the same as TestFlight: Apple has a known problem (forum thread 807934) where an extension's changes work
from Xcode and fail from TestFlight. Steps 6 and 12 must also be done once on the `production-pull` TestFlight build, which needs
the owner's separate yes (it uses one of the 15).

## The steps

1. **Turn it on (setup).** A fresh install, answer "most days". Expect the page "Want a wait before the apps that start it?". Tap
   Choose the apps, Continue, Face ID, pick one feed app, Done. Expect: back in setup, no error. More, Screen Time says On, and no
   "Not working" line.
2. **Day shield.** Open the picked app at noon. Expect "A short wait first / You asked me for a moment before this one. Close it,
   or take the wait." with "Wait 10 seconds" and "Close". Tap Wait: on iOS 26.5 or later Daybook should open on the ring with no
   note; before that a note "🔥 Here" comes. The ring counts from the tap on the shield, not from when Daybook opened. After it,
   tap "Open it for 5 minutes", go back to the app, use it 5 minutes: the shield should return within a minute or two. Write down
   how long it really took.
3. **A wait left over.** Tap Wait again, let the ring finish, then leave Daybook for 3 minutes. Come back: the ring should start
   again (a wait over for more than two minutes does not open the app).
4. **Close counts.** Tap Close on the shield twice within 10 minutes: Today should count once.
5. **Night, no app.** Set tonight (the morning page) to the next half hour, force-quit Daybook, lock the phone. At the time,
   open the picked app: expect the night shield (title "You set this up this morning", your reason in quotes, "Close it, and go
   to bed. Your fire is worth more than this."). In Safari open a harmless adult-filtered test page: expect a block page.
   **Write down exactly what the block page says and whether it has any button.** If it is Daybook's own shield ("Wait 15
   minutes"), tap it: Daybook should open on the long wait. If it is Apple's own page, the long wait is only in More, Screen
   Time; write that down, since it decides the next design.
6. **The night's start, to the minute, five nights.** Note whether the filter was ever late or early. A start callback a few
   seconds early must still turn the filter on (it reads two minutes ahead, and a heartbeat asks again five minutes after the
   start). At 6:00 AM note whether it lifts on time with Daybook closed, and by 6:05 at the latest.
7. **Long wait.** At night, More, Screen Time, Start the wait (set the wait to 5 minutes for the test). Leave the app for 3
   minutes, come back: the ring should have kept counting. Read the line above the buttons: "Open them, and tonight goes in the
   week as a night you went through." After 5 minutes tap "Open them for 10 minutes": the test site should load; after 11 to 12
   minutes it should be blocked again **with Daybook closed**. Write the minute it came back.
8. **Good night arms it now.** (Once WP5's Good night is built.) Before tonight's start, say Good night: adult sites should wait
   at once, not at the start time.
9. **Notes only.** On a second try of setup or the Day 7 card, choose "Notes only": nothing should be blocked, by day or at night.
10. **Lift and off.** More, Lift every wait now: shield and filter gone at once. Wait for the next night's start: they come back.
    Then iPhone Settings, Screen Time, Apps With Screen Time Access, turn Daybook off. Open Daybook: More says Off, with "Screen
    Time access was turned off in the phone's Settings, so nothing waits now." If it was at night, that night must not count as
    held.
11. **Silent on.** After step 10, turn access back on in iPhone Settings only (do not open Daybook): does the shield come back?
    Then restore the app from an iCloud backup on a spare phone (or delete and reinstall with the saved choices) and open it:
    More must say "Not working: it needs your yes again on this phone", and Today shows the same strip, never plain "On".
12. **No-open week.** Do not open Daybook for 3 days with Screen Time on. Does each night still block at the same time? Does the
    shield still quote the reason?
13. **Restart and time zone.** With a night running, restart the phone: does the filter come back with no app open? Then change the
    time zone by two hours: does it turn on and off at the times shown, with Daybook closed?
14. **Delete with a shield up.** Delete Daybook while a shield is up. Does the shield stay? How do you remove it?
15. **Browsers, at night.** Try each and write which load an adult test page:
    - Safari, a normal tab
    - Safari, a private tab (Apple turns private tabs off while the filter is on)
    - Chrome
    - Firefox
    - a link opened inside a social app (Instagram, Reddit or X: the in-app browser)
    - the Instagram and X websites in Safari
16. **Live Activity.** Open Daybook 20 minutes before screens off: the activity starts. Close the app and look at the Lock Screen
    at screens off, at 1 AM and at 6 AM. After its end time it must show only the flame: no words, no time, no bar. Write what it
    shows and when it went away.
17. **Proof.** The morning after a night with the waits on and nothing gone through, Today says "Lock held 1 night". After a night
    you opened a feed from the night's wait, or opened adult sites after the long wait, or lifted every wait, or turned it off in
    Settings: that night does not count. Also check Today when something is broken (step 11): "Screen Time is not working: ..."
    with one button that fixes it.

## When it is done

Send the notes back. Every step passes, or its failure is written down with what Apple did. Only then does the owner say yes (or
no) to one `production-pull` TestFlight build, which uses one of the 15 monthly EAS builds.
