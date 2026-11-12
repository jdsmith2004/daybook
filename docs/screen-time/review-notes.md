# App Review notes for the build with Screen Time

Paste into App Store Connect, the version's App Review Information, Notes. Attach the short screen recording (below) as well,
because the reviewer's simulator cannot run Screen Time.

> Daybook helps an adult change a personal habit on their own iPhone. This version adds an optional Screen Time feature,
> using the Family Controls (Distribution) entitlement granted to team 2G4K7PN999, with individual authorization only.
>
> How to find it: More, Screen Time, Choose the apps (it is also offered on Today after a week of use). The person approves
> Apple's Screen Time prompt, then picks apps in Apple's FamilyActivityPicker.
>
> What it does, all on the device: a DeviceActivityMonitor extension posts a local reminder after long use of the picked apps,
> or during hours the person's own log shows are hard for them. Only if the person turns it on, ManagedSettings shields the
> picked apps until those hours end; ShieldConfiguration and ShieldAction extensions show a supportive message and a button
> back to Daybook. The person can lift every shield at once in the app, or turn the feature off in Settings, Screen Time.
>
> Privacy: Daybook never learns which apps were picked (Apple's opaque tokens), never reads usage numbers, and sends no Screen
> Time data off the device: not to our server, not to analytics, not to sync or backups. Notifications use neutral words.
>
> It needs a real iPhone and Screen Time access, so it cannot be shown on a simulator. A screen recording of the full flow is
> attached.

## The recording (about one minute, on the owner's iPhone)

1. More, Screen Time, Choose the apps, Apple's prompt, Apple's list, one app picked.
2. A reminder on the lock screen.
3. The shield over the picked app, Open Daybook, the wait screen, Put it down.
4. More, Screen Time, Lift every pause now.

Screen recording: Control Center, Screen Recording. No personal log on screen.
