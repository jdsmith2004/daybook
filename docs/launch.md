# Launch: the App Store and the tip jar

Everything here works from a browser, on any computer: nothing is installed, so either of your computers (or a phone)
can publish. **You** means the owner (or Claude in Chrome, with the owner
watching). **Claude** means a Claude Code session on this repository.

**Never paste a password, key or token into a chat, a commit or a file in this repository.** Secrets go only into
GitHub's secret settings or into Expo. A project ID, an account name, the App Store app ID and the tip link are not
secrets, and can be sent to Claude in chat.

What it costs: the Apple Developer Program (already paid), the free Expo plan (15 iOS builds a month, and it never bills
for more: past that, builds wait for the next month), and free GitHub Actions and Codespaces hours for this public repository.

## 0. Decisions (in chat)

| Decision               | Suggested                                                   | Why                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle ID              | `com.jdsmith2004.daybook` (set in `apps/mobile/app.json`)   | It can never change once step 3 runs. Tell Claude before then if you want another.                                                                        |
| Name on the App Store  | Daybook: Quit Without Shame                                 | The home screen still says Daybook. "Porn" stays out of the name, so it is not in anyone's purchase list.                                                 |
| Where it is offered    | The United States only, for now                             | A link out to pay (the tip jar) is allowed on the US App Store only (Review Guidelines 3.1.1(a)).                                                         |
| Tip service            | Apple in-app purchase first, three Stripe links second      | Kind $5, Generous $10, Amazing $20 (core `supporter.ts`); a tip of $5 or more makes a supporter. The statement says JEFFREY until Stripe accepts DAYBOOK. |
| Support email          | jeffreydsmith.cs@gmail.com (the owner's choice, October 19) | On the support, privacy and terms pages. A Daybook-only address can replace it later: change `SUPPORT_EMAIL` and the three pages.                         |
| Your developer account | Tell Claude: individual or organization                     | An individual account shows your legal name as the seller on the App Store.                                                                               |

## 1. The tip page (done, October 19)

A Stripe Payment Link, "Tip for Daybook": the giver chooses the amount ($5 suggested), and the thank-you page says "Thank
you. Your tip keeps Daybook free and helps it reach the next person." It is in `SUPPORT_URL` in
`packages/core/src/support.ts`. Left to do in Stripe:

1. The **Action required** banner (identity or bank details): only you. Until it is cleared, payouts (and maybe payments)
   can be held.
2. Settings, Business details: set the website to `https://d3c9g6kent5bsr.cloudfront.net` and the public business name
   to **Daybook**. Then try the statement descriptor **DAYBOOK** again (it was refused while the website was a Ko-fi page);
   until then it says JEFFREY.
3. Settings, Branding: upload `apps/mobile/assets/images/icon.png` as the icon, with the accent color `#6247EA`.

## 2. Expo (you, about 10 minutes; done October 19 except the token)

The project is `daybook` under the Expo account `jeffspresso`, and its ID is in `apps/mobile/app.json`. Left to do: steps 3
and 4 below, with a token from the jeffspresso account (the secret saved earlier came from another account, so builds
would fail with it).

1. Sign up at expo.dev (the free plan).
2. Create a project named **daybook** (the name must match `slug` in app.json). Send Claude the **project ID** and your
   **account name**. Claude adds them to app.json.
3. Account settings, Access tokens: create a token named `github-store` and copy it.
4. On github.com/jdsmith2004/daybook: Settings, Secrets and variables, Actions, New repository secret. Name: `EXPO_TOKEN`.
   Value: the token. (This is what lets the App Store button build from any computer.)

## 3. Signing, once (you, about 15 minutes, in the browser; done October 19)

The first iPhone build needs your Apple sign-in once, to make the signing certificate. After this, no step needs it.

1. Wait until Claude says the project ID from step 2 is in `main`.
2. On github.com/jdsmith2004/daybook: Code, Codespaces, **Create codespace on main**. A terminal opens in the browser.
3. Run, one line at a time:

   ```sh
   npm ci
   cd apps/mobile
   npx eas-cli@24.10.0 login
   npx eas-cli@24.10.0 credentials -p ios
   ```

4. In the menus: choose the **production** profile, say yes to logging in to Apple (Apple ID, password, then the code on
   your phone), and set up everything needed to build (the distribution certificate and the provisioning profile). If it
   asks about push notifications, say no: Daybook's reminders are made on the phone.
5. Then, in the same menu: App Store Connect, manage your API key, set up your project to use an API key for EAS Submit,
   and let it make a new key. Expo keeps it; nothing goes in this repository.
6. If a question is unclear, copy it to Claude in chat (never a password). When done, delete the codespace (Codespaces
   list, the three dots, Delete).

## 4. The App Store record (you or Claude in Chrome, about 10 minutes; done October 19)

Made: "Daybook: Quit Without Shame", free, United States only. Its Apple ID is `ascAppId` in `apps/mobile/eas.json`. Before
the first build, the Account Holder accepts the updated Apple Developer Program License Agreement in App Store Connect
(Apple refuses uploads until then).

1. appstoreconnect.apple.com, Apps, the plus button, **New App**:
   - Platform: iOS. Name: from step 0. Primary language: English (U.S.).
   - Bundle ID: `com.jdsmith2004.daybook` (it shows up after step 3). SKU: `daybook-ios`. User access: full.
2. App Information: copy the **Apple ID** (a number) and send it to Claude. Claude adds it to `apps/mobile/eas.json` as
   `ascAppId`, which lets the button send builds to TestFlight on its own.
3. Pricing and Availability: price **Free**; availability **United States** only (see step 0).

## 5. Build and test (you, from any computer or phone)

1. On github.com/jdsmith2004/daybook: Actions, **App Store**, Run workflow, on `main`.
2. It runs the checks, builds on Expo (the free queue can take a while), and sends the build to TestFlight. A green check
   means it is on its way. While it runs, the "Wait for the build" step prints the status every 30 seconds (the place in
   Expo's queue, then building), and the run's summary page lists each stage with its time and a link to the build on Expo.
3. In App Store Connect, TestFlight: when the build says Ready to test (about 15 minutes of processing), add yourself as a
   tester and install it with the TestFlight app. Walk it on your phone before anything goes to review.

## 6. The listing (Claude drafts, you or Claude in Chrome paste)

- **Name:** Daybook: Quit Without Shame
- **Subtitle:** Private help to quit porn
- **Category:** Health & Fitness. Second: Lifestyle.
- **Keywords:** `addiction,pornfree,recovery,urges,relapse,habit,tracker,clean,sober,journal,accountability,sobriety`
  (no other app's name or trademark, by the store's rules)
- **Promotional text:** Free, with no ads and no tracking. Care is free for everyone. A slip is data, not a reset.
- **What's New in This Version** (only once a version has been released before; a first version has no such box):

  > SOS is now one guided ride that keeps going until the urge passes, with a new shape puzzle and the reason behind
  > every move. After a slip, Daybook helps you name the feeling underneath, see what it really gave you, and make one
  > plan for next time. Tips on iPhone open right away, and the web tip opens in one tap.

- **Description:**

  > Daybook is a private, honest companion for quitting porn, or another habit, without shame. Log urges and slips in a
  > few taps, learn your pattern, and keep going after a hard day. A slip is data, not a reset: what you build stays yours.
  >
  > What is inside
  > • SOS: one guided ride that keeps going until the urge passes, with the reason behind every move.
  > • Rekindle: after a slip, name the feeling underneath it, see what it really gave you, and make one plan for next time.
  > • Your pattern: the hours and moments that are hardest for you, from your own log.
  > • Lessons built on good research, written plainly.
  > • Your own plan: why you are doing this, and what you will do when an urge comes.
  > • An evening check-in and wind-down, and a weekly review.
  > • Graduation: a permanent award at 90 days with no slip.
  >
  > Private by design
  > • No ads. No tracking. Nothing is sold.
  > • Your log stays on your phone. A free account is optional: sign in with Apple or an email, and it opens every
  > lesson. Delete my account removes everything.
  > • Face ID lock, and a plain name and icon on your home screen.
  >
  > Free, and you can become a supporter
  > Daybook is free, and everything for hard moments (SOS, logging, Rekindle, your plan, Today) is free for everyone.
  > A one-time tip of $5 or more makes you a supporter, which opens:
  > • Sync and a safe copy: your log the same on your phone and the web, kept safe if a phone is lost.
  > • Your whole pattern: when it happens, what sets it off, and what helps you most.
  > Tips are one-time in-app purchases (Kind $5, Generous $10, Amazing $20), with no subscription.
  >
  > Daybook is not medical care. If you are in crisis in the US, call or text 988.

- **Privacy Policy URL:** https://d3c9g6kent5bsr.cloudfront.net/privacy.html
- **Support URL:** https://d3c9g6kent5bsr.cloudfront.net/support.html
- **Marketing URL:** https://d3c9g6kent5bsr.cloudfront.net/about.html
- **Copyright:** 2026 Jeff Smith
- The three public pages (support, privacy, terms) are plain HTML in `apps/mobile/public`, published with every deploy
  (and on GitHub Pages under /daybook/). The app links to them from More (Help and support) and the privacy sheet.
- **Screenshots:** the six in `store-assets/ios69/` (1290 × 2796, iPhone 6.9-inch), in order, made by `npm run shots`
  (README, "Store screenshots"). If App Store Connect asks for the 6.1-inch or 6.3-inch slot, use the same six from
  `store-assets/ios63/` (1206 × 2622) there. Download them from GitHub on whichever computer you are using.
- **Header and search results** (new in App Store Connect for iOS 27; optional, and reviewed like the rest): the header
  is `store-assets/ios-header/01-header.png` (3840 × 1646, 21:9) and the search card `store-assets/ios-search/01-search.png`
  (3840 × 2560, 3:2), on the version page's Header and Search Results tab. Apple asks that these suit a 4+ rating even
  when the app is rated higher, so they never name what Daybook is for; without them, search shows the screenshots.
- **Age rating:** answer the questions as they are: no nudity or sexual content; mature themes (porn is named and talked
  about plainly); medical or treatment information: infrequent (lessons on changing a habit, not treatment); no user
  chat, no web browsing, no gambling. Apple rated it 16+, so the terms and the privacy policy say Daybook is for anyone 16 or
  older. If the rating ever changes, tell Claude so the pages change with it; at 18+, teenagers could not get it.
- **Regulated medical device** (App Information, "Declare Regulated Medical Device"; required for the US, UK and EU):
  **No**. Daybook is a self-help habit tool, not a medical device, and the listing and terms say it is not medical care.
- **App Privacy** (what Apple shows as the privacy label). Data is collected only for people who make an account or
  leave a tip, only to make the app work, linked to that account, and never used to track:
  - Contact info: email address (the one typed in, or the one Sign in with Apple gives, which can be a Hide My Email
    address).
  - Health and fitness: health (the log of urges and slips is health data a person gives).
  - Sensitive info: religious beliefs (setup asks how much faith matters, and that answer syncs).
  - User content: other user content (the log, notes, plans).
  - Identifiers: user ID (the account ID, and Apple's ID for the person when they sign in with Apple).
  - Purchases: purchase history (the supporter record: a tip's amount, date, where it came from, and Apple's or Stripe's
    reference, kept under the account so the tip opens sync).
  - Usage data: product interaction (the anonymous counts, core `pulse.ts`): **not linked** to the person, used for
    analytics only, **not** used for tracking. Since October 28, 2026 the basic counts (the app was opened that day,
    how far setup got) are sent without asking; the rest only after the person says yes in More, and More turns all
    of it off. So it is collected from everyone who has not turned it off: do not mark it optional. Add this before a
    build with `EXPO_PUBLIC_PULSE_URL` goes to review.
  - User content: other user content also covers feedback (optional, not linked unless the person types an address;
    used for app functionality).
  - Tracking: **no**. Data used to track you: **none**.
- **Notes for App Review:**

  > Daybook works without an account: SOS, logging, Rekindle, the plan and the tools never ask for one. An optional
  > free account (email, or Sign in with Apple) opens the lessons after the first three. Accounts can be deleted in the
  > app: More, Settings, Sync, Delete my account (an account made with Apple asks Apple once more and revokes its token).
  >
  > Tips: three non-consumable in-app purchases (daybook.tip.kind $5, daybook.tip.generous $10, daybook.tip.amazing
  > $20). Any of them makes the person a supporter, which opens sync and a safe copy, and the full pattern page.
  > Restore is on the tip sheet ("I already tipped" on the sync card does the same). To try it: sign in with the demo
  > account below, open More, Support Daybook (or Settings, Sync), and buy any tip with the sandbox account; sync then
  > turns on. Under the in-app tips, a second link opens the same three tips on our web page (Stripe), as allowed on the
  > United States storefront under guideline 3.1.1(a); Daybook is offered in the United States only.
  >
  > The app has no ads and no tracking. Reminders are local notifications made on the device, with plain words that do
  > not say what the app is for. Support: https://d3c9g6kent5bsr.cloudfront.net/support.html

- **Sign-in for App Review:** make a test account in the TestFlight app first (More, then Settings, then Sync), with a
  new email address you control, and type its email and password into App Review Information yourself. Never put that
  password in a chat, a commit or this repository. Make it new (after October 24, 2026) and do not tip with it: then
  sync shows as locked and the reviewer can buy a tip with their sandbox account and watch it open. An older account is
  grandfathered into sync and hides the tip flow.
- **In-app purchases** (Monetization, In-App Purchases): the three tips, each Non-Consumable, Family Sharing off, United
  States only, with the review screenshot `docs/shots/tip-review.png` and the review note from docs/plan.md ("The
  iPhone build and review"). A first in-app purchase can only be reviewed with an app version: tick all three in the
  version page's **In-App Purchases** section before submitting. They need the Paid Apps Agreement to be active
  (Business: agreement, bank and tax all done).

## 7. Submit for review (you, or Claude in Chrome with you watching, about 20 minutes)

Do this only after the TestFlight walk on your phone (step 5) looks right. Claude in Chrome may fill in and press
**Add for Review** and **Submit for Review** when you say so in that chat; it still never types a password, a 2-factor
code, bank or tax details, and never accepts an agreement or anything that costs money.

Paste this into Claude in Chrome, signed in to App Store Connect:

```
Daybook: update the App Store listing and submit the new iPhone build (tips and Sign in with Apple)
for App Review. Everything to paste is in github.com/jdsmith2004/daybook/blob/main/docs/launch.md,
step 6. Rules: never type a password, a 2-factor code, bank, tax or identity details; never accept
an agreement or terms; never change prices beyond what step 6 says; stop and ask me if anything
costs money or is unclear. Tell me what you did at each step and anything that did not match.

1. Business (Agreements, Tax, and Banking): tell me the status of the Paid Apps agreement, bank
   account and tax forms. If any is not Active, STOP and show me; tips cannot be reviewed without it.
2. Apps → Daybook: Quit Without Shame → TestFlight: tell me the newest build (version and build
   number) and its status. It must say Ready to Submit / Testing, and be the one I tested.
3. Monetization → In-App Purchases: check the three tips exist exactly as in step 6 ("In-app
   purchases": daybook.tip.kind, daybook.tip.generous, daybook.tip.amazing; Non-Consumable; $5, $10,
   $20; Family Sharing off). Set each one's availability to United States only (they were made with
   all countries). For each, tell me its status and whether it has a
   review screenshot and review note. Create any that are missing, but STOP before saving a price.
   I upload docs/shots/tip-review.png myself if one is missing.
4. Version 1.1.0 is live, so the update is a new version: the + next to iOS App, numbered exactly as the new
   build's version (1.2.0, from apps/mobile/app.json). If the newest build is still 1.1.0, STOP: the
   new build has not reached TestFlight yet.
5. Fill in from step 6: promotional text, description, keywords, support URL, marketing URL,
   copyright, and What's New (only if the box is there). Screenshots: leave the ones there unless a
   size is missing; tell me what Media Manager shows.
6. Build: choose the build from step 2.
7. In-App Purchases and Subscriptions section on that version page: add all three tips.
8. App Information: name and subtitle from step 6; category Health & Fitness, second Lifestyle;
   content rights: no third-party content; age rating answers as in step 6. Regulated medical
   device: No.
9. App Privacy: check the privacy policy URL, then make the data types match step 6 exactly,
   including the two that are new: Purchases → Purchase History, and the Apple ID under User ID
   (each: app functionality, linked to the user, not used for tracking). Publish it.
10. Pricing and Availability: Free, United States only. Tell me if it is anything else.
11. App Review Information: notes from step 6 (replace the old notes). Contact: my name and email
    (ask me for the phone number and let me type it). Sign-in required: yes, and STOP so I type the
    demo account myself.
12. Version release: "Manually release this version".
13. Show me the whole page, then wait for me to say "submit". Then Add for Review → Submit for
    Review. Tell me the status it shows, for the version and for each in-app purchase.
```

Review usually takes one to three days. If Apple asks a question or rejects it, paste their message to Claude Code: the
reply, or the fix and a new build (step 5), goes from there. When it is approved, press **Release this version**.

## 7b. Daybook Pattern (you, or Claude in Chrome with you watching, about 40 minutes)

The one paid product beyond the tips (the owner, October 30, 2026; the decisions are in docs/plan.md). Monthly $3 (Apple only), or
lifetime, which is simply a tip of $10 or more: $10, or $30 to give more. A $5 tip stays as the quiet way in, and opens sync and
the safe copy. The code is in the app and turned off: until `PATTERN_FROM` is set in `packages/core/src/supporter.ts`, a tip opens
what it always did and nobody sees the product. Turn it on only after every step here, in this order.

**1. App Store Connect: the subscription, the one new product.** Apps, Daybook, Monetization, Subscriptions.

- Create a subscription group. Reference name: `Daybook Pattern`. Under the group's App Store Localization, English (U.S.),
  display name `Daybook Pattern`.
- In the group, +, with these exact values:

  | Reference name  | Product ID                | Duration | Price | Display name    | Description                                            |
  | --------------- | ------------------------- | -------- | ----- | --------------- | ------------------------------------------------------ |
  | Pattern monthly | `daybook.pattern.monthly` | 1 month  | $3.00 | Daybook Pattern | Your whole pattern and a read of each month. Sync too. |

- Availability: the United States. Family Sharing off. No introductory offer.
- Review screenshot: the Daybook Pattern sheet on an iPhone (`docs/shots/pattern-review.png`). Review note: "Daybook is free
  and all care stays free. Daybook Pattern opens the deeper pages of the person's own pattern, a monthly read of what changed,
  and sync. To see it, use the demo account, log a few urges with a time, open Pattern, and tap See Daybook Pattern. Restore
  and Manage or cancel are on the same sheet."

**2. App Store Connect: the two tips that become lifetime.** Monetization, In-App Purchases. These are the live products, so nothing
new is made, and everyone who already bought one keeps it.

| Product ID             | Price                     | New display name      | New description                                               |
| ---------------------- | ------------------------- | --------------------- | ------------------------------------------------------------- |
| `daybook.tip.generous` | stays $10.00              | Daybook Lifetime      | Your whole pattern and a read of each month, for good.        |
| `daybook.tip.amazing`  | **$20.00 becomes $30.00** | Daybook Lifetime Plus | The same as Daybook Lifetime, with more to help Daybook grow. |

Change the price on the turn-on day: a change of price needs no review, but it takes effect for the app already out, where the
amazing tip still says the old words. The new names go to review with the next version (step 7), and Apple's pay sheet shows them.
`daybook.tip.kind` stays as it is. The word "donate" stays off all of it: Daybook is not a charity, and Apple keeps donations to
registered nonprofits. No name carries a word about what Daybook is for, because they show in the person's purchase list.

**3. The terms link Apple requires for a subscription.** On the version page, in the description's last line, add:
`Terms of use: https://d3c9g6kent5bsr.cloudfront.net/terms.html`. The privacy policy URL is already set. The sheet in the app
has both links, and says the price, the length and how it renews (Guideline 3.1.2).

**4. Stripe: a $30 link for the web.** Payment Links, New: a new product "Daybook Lifetime Plus", $30, one-time, USD, quantity not
adjustable, no address. Under **After payment**, "Don't show confirmation page", and enter exactly
`https://d3c9g6kent5bsr.cloudfront.net/tipped.html?session_id={CHECKOUT_SESSION_ID}`. Send Claude the link (it is public); it goes in
`TIP_LINKS.amazing`. The $5 and $10 links stay. Leave the old $20 link on, for app versions already out: any web payment of $10 or
more counts as lifetime. No monthly on the web for now (the owner, October 30, 2026): a web subscription would need a cancel page, a
wider Stripe key and a server check on renewals. The Stripe key stays as it is (Checkout Sessions: Read).

**5. What the statement says.** Apple's charge reads APPLE.COM/BILL. Stripe's reads JEFFREY until Stripe accepts DAYBOOK:
Settings, Business, Public details, Statement descriptor, try `DAYBOOK` again. Either way, no word about what Daybook is for.

**6. Claude turns it on, in one change,** once the subscription says Ready to Submit and the link is sent:

- Sets `TIP_LINKS.amazing`, and `PATTERN_FROM` to the moment of that change. It is never moved afterward, because a tip from
  before it keeps the whole pattern for good.
- Removes the old tip sheet from `app/tip.tsx` (`TipSheet`), since `PatternSheet` holds the tips from then on.
- Runs `npm run shots`-style pictures of the sheet for `docs/shots/pattern-review.png`.
- Changes the words that say a tip opens the pattern, on `about.html` (including "no subscription"), `support.html`,
  `terms.html`, `privacy.html` and `llms.txt`; the tip's words in the app change by themselves with `PATTERN_FROM`.
- Changes the listing (section 6): "$10 once opens your whole pattern (when it happens, what sets it off, what helps you most), a
  monthly read of what changed, and sync, for good. Or $3 a month. A $5 tip opens sync and a safe copy." "with no subscription"
  goes. Apple requires this text to be true on the day.
- Adds to App Privacy nothing new: Purchases, purchase history is already declared, and the Daybook Pattern record is the same kind.

**7. Submit.** On the version page, In-App Purchases and Subscriptions, select the subscription and the two renamed tips. A first
subscription goes to review with an app version.

**8. Test before the world sees it** (TestFlight, with the sandbox tester from docs/plan.md, "Payments"):

- [ ] Monthly: buy, the deep pages open, sync opens on a signed-in account (the server takes the Apple transaction).
- [ ] Sandbox renews a month in five minutes: leave it through two renewals, the record's end moves on, nothing asks again.
- [ ] Cancel from Manage or cancel: after the last renewal and the three grace days, the pages go back to the tip rules; the log,
      the points, the level and the finished month reads stay; sync says plainly it has stopped saving.
- [ ] Lifetime $10: buy, delete the app, install it, Restore. It comes back.
- [ ] A $5 tip, then lifetime on the same Apple Account: everything opens, and stays open after a restore.
- [ ] A tip from before `PATTERN_FROM`, restored on a new phone, still opens the whole pattern.
- [ ] Web: the $10 link in a test purchase, back through tipped.html, signed in and signed out.

The local StoreKit file (`apps/mobile/storekit/Daybook.storekit`) lets Xcode run all of the buying and lapsing on a simulator with
no App Store Connect, but those purchases are not signed by Apple, so the server refuses them, on purpose.

**What it costs to run:** nothing new. No webhook, no new AWS. Apple keeps 15% (Small Business Program), Stripe 2.9% + 30¢.

## 8. Google Play (Android)

The same app, built and sent by its own button: Actions, **Google Play**, Run workflow (`.github/workflows/play.yml`). It
builds on Expo, then sends the build to Google Play as a **draft on the internal testing track**; nothing reaches the
public until you roll it out in the Play Console. The package name is `com.jdsmith2004.daybook` (in `apps/mobile/app.json`),
the same as on iPhone, and like the bundle ID it can never change once the first build is uploaded.

**Rules that change: check them before relying on them.** Two of Google's rules shape this plan, and both have changed
before. Read the current wording first:

- New **personal** developer accounts must run a **closed test** before they can publish to everyone: when this was
  written, at least 12 testers opted in for 14 days in a row. Organization accounts are exempt.
  [Google's help page](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- Google's API cannot create an app's first release, so **the first build is uploaded by hand** in the Play Console;
  after that the button sends builds itself. [Expo's Android submit docs](https://docs.expo.dev/submit/android/).

**No tip link on Android.** Google Play asks that tips to a developer go through its own billing, so the Android app shows
no tip link anywhere (Today, More, setup, graduation); iPhone and the web keep it. If tips on Android are wanted later,
they would be Play in-app products, and that is a separate piece of work.

1. **The developer account (only you).** play.google.com/console: sign up. It costs **$25, once**, and Google checks your
   identity (and asks for a phone and maybe a document). Choose **personal** unless you have a registered business.
   Claude in Chrome never pays or types identity details.
2. **The app.** In the Play Console: Create app. Name: Daybook: Quit Without Shame. Default language: English (United
   States). App, Free. Accept the declarations yourself.
3. **The key for the button (you, about 10 minutes).** It lets the workflow upload builds. It is a secret: it goes only into
   GitHub, never into a chat, a commit or a file in this repository.
   1. console.cloud.google.com: make (or pick) a project, then IAM and admin, Service accounts, Create service account
      (name: `daybook-play`). No roles are needed here.
   2. On that account: Keys, Add key, JSON. A file downloads.
   3. Play Console, Users and permissions, Invite new users: the service account's email, with access to Daybook and the
      **Release** permissions (release to testing tracks and production, manage testing tracks).
   4. github.com/jdsmith2004/daybook: Settings, Secrets and variables, Actions, New repository secret. Name:
      `GOOGLE_PLAY_KEY`. Value: the whole JSON file's text. Then delete the downloaded file.
4. **The first build, by hand.** Run the Google Play workflow. The build finishes, and the send step fails the first time,
   because Google has never seen the app. Open the Expo link in the run's summary, download the `.aab`, and in the Play
   Console: Testing, Internal testing, Create new release, upload it, save. From now on the button sends each build.
5. **Testers.** Internal testing: add yourself (and anyone helping) by Google account email and install from the link it
   gives. Then the closed test for production access: Testing, Closed testing, a track with at least the number of testers
   Google asks for, kept opted in for the days it asks. Ask people you trust; the testers' list is private.
6. **The listing and the forms (Claude drafts, you or Claude in Chrome paste).** Main store listing, plus every page in
   Policy, App content:
   - **App name:** Daybook: Quit Without Shame
   - **Short description** (80 letters at most): Private help to quit porn. Log urges and slips without shame.
   - **Full description:** the iPhone description from step 6, with the last part changed to: "Free for everyone. Daybook
     is free, with nothing to unlock." (no tips on Android).
   - **Graphics:** the app icon at 512 × 512 (from `apps/mobile/assets/images/icon.png`), the feature graphic
     `store-assets/play-feature/01-feature.png` (1024 × 500), and the six phone screenshots in `store-assets/play-phone/`
     (1080 × 1920), all made by `npm run shots`. The Android ones show no tip button, as the Android app has none.
   - **Category:** Health & Fitness. **Contact email:** jeffreydsmith.cs@gmail.com. **Privacy policy:**
     https://d3c9g6kent5bsr.cloudfront.net/privacy.html
   - **App access:** some features need a sign-in (lessons after the first three): give the review test account from step
     6, typed in by you.
   - **Ads:** no. **Target audience:** 16 and older (16 to 17, 18 and over), to match the App Store's 16+; not under 13, which would bring in
     the Families rules. **Content rating:** answer the questionnaire as in step 6 (porn is named and discussed plainly; no
     sexual images, no user chat). **Health apps:** declare it as a health and wellness app (habit change), not a medical
     device.
   - **Data safety** (collected only with an account; all of it optional, encrypted in transit, never shared, and people
     can delete it in the app or by email): personal info (email address, user IDs, religious beliefs from the faith
     question), health and fitness (health info: the log), app activity (other user-generated content: notes and plans).
     Used for app functionality and account management only.
     Once the anonymous counts are in a build: app activity, app interactions (collected for analytics, not shared,
     processed so it cannot be tied to a person; the basic counts are sent without asking, so not optional), and feedback as other user-generated content (optional).
7. **Production.** When the closed test is done, apply for production access in the Play Console's dashboard, then release
   the newest build to production (start at a staged rollout if it offers one). Review usually takes a few days; paste any
   message from Google to Claude Code.
