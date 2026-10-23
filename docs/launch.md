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

| Decision               | Suggested                                                   | Why                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle ID              | `com.jdsmith2004.daybook` (set in `apps/mobile/app.json`)   | It can never change once step 3 runs. Tell Claude before then if you want another.                                                            |
| Name on the App Store  | Daybook: Quit Without Shame                                 | The home screen still says Daybook. "Porn" stays out of the name, so it is not in anyone's purchase list.                                     |
| Where it is offered    | The United States only, for now                             | A link out to pay (the tip jar) is allowed on the US App Store only (Review Guidelines 3.1.1(a)).                                             |
| Tip service            | A Stripe Payment Link (done, October 19)                    | The giver picks the amount ($5 suggested); cards, Apple Pay and others. The statement says JEFFREY until Stripe accepts DAYBOOK (see step 1). |
| Support email          | jeffreydsmith.cs@gmail.com (the owner's choice, October 19) | On the support, privacy and terms pages. A Daybook-only address can replace it later: change `SUPPORT_EMAIL` and the three pages.             |
| Your developer account | Tell Claude: individual or organization                     | An individual account shows your legal name as the seller on the App Store.                                                                   |

## 1. The tip page (done, October 19)

A Stripe Payment Link, "Tip for Daybook": the giver chooses the amount ($5 suggested), and the thank-you page says "Thank
you. Your tip keeps Daybook free and helps it reach the next person." It is in `SUPPORT_URL` in
`packages/core/src/support.ts`. Left to do in Stripe:

1. The **Action required** banner (identity or bank details): only you. Until it is cleared, payouts (and maybe payments)
   can be held.
2. Settings, Business details: set the website to `https://jdsmith2004.github.io/daybook/` and the public business name
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
- **Promotional text:** Free for everyone. No ads, no tracking, nothing to unlock. A slip is data, not a reset.
- **Description:**

  > Daybook is a private, honest companion for quitting porn, or another habit, without shame. Log urges and slips in a
  > few taps, learn your pattern, and keep going after a hard day. A slip is data, not a reset: what you build stays yours.
  >
  > What is inside
  > • SOS: breathe first, then a tool that fits the moment.
  > • Rekindle: after a slip, a short, honest look back and a small quest that can keep your run.
  > • Your pattern: the hours and moments that are hardest for you, from your own log.
  > • Lessons built on good research, written plainly.
  > • Your own plan: why you are doing this, and what you will do when an urge comes.
  > • An evening check-in and wind-down, and a weekly review.
  > • Graduation: a permanent award at 90 days with no slip.
  >
  > Private by design
  > • No ads. No tracking. Nothing is sold.
  > • Your log stays on your phone. A free account is optional: it keeps a copy safe and syncs with the web, readable only
  > with your sign-in, and Delete my account removes everything.
  > • Face ID lock, and a plain name and icon on your home screen.
  >
  > Free for everyone
  > Daybook is free, with nothing to unlock. If it helps you, you can leave a tip.
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
- **App Privacy** (what Apple shows as the privacy label). Data is collected only for people who make an account, only to
  make the app work, linked to that account, and never used to track:
  - Contact info: email address.
  - Health and fitness: health (the log of urges and slips is health data a person gives).
  - Sensitive info: religious beliefs (setup asks how much faith matters, and that answer syncs).
  - User content: other user content (the log, notes, plans).
  - Identifiers: user ID.
  - Usage data: product interaction (the opt-in counts, core `pulse.ts`): **not linked** to the person, used for
    analytics only, **not** used for tracking. It is optional: the app asks once and sends nothing until the person
    says yes. Add this before a build with `EXPO_PUBLIC_PULSE_URL` goes to review.
  - User content: other user content also covers feedback (optional, not linked unless the person types an address;
    used for app functionality).
  - Tracking: **no**. Data used to track you: **none**.
- **Notes for App Review:**

  > Daybook works without an account: SOS, logging, Rekindle, the plan and the tools never ask for one. An optional
  > free account syncs a copy and opens the lessons after the first three. "Support Daybook" opens a tip
  > page in the browser; tips unlock nothing, and the link is offered on the United States storefront only, under
  > guideline 3.1.1(a). The app has no ads. It asks once whether it may send anonymous, opt-in usage counts
  > (totals only, never the log), and sends nothing unless the person says yes. Reminders are local notifications made on the device, with
  > plain words that do not say what the app is for. Support: https://d3c9g6kent5bsr.cloudfront.net/support.html

- **Sign-in for App Review:** make a test account in the TestFlight app first (More, then Settings, then Sync), with a
  new email address you control, and type its email and password into App Review Information yourself. Never put that
  password in a chat, a commit or this repository.

## 7. Submit for review (you, or Claude in Chrome with you watching, about 20 minutes)

Do this only after the TestFlight walk on your phone (step 5) looks right. Claude in Chrome may fill in and press
**Add for Review** and **Submit for Review** when you say so in that chat; it still never types a password, a 2-factor
code, bank or tax details, and never accepts an agreement or anything that costs money.

Paste this into Claude in Chrome:

```
Daybook: submit the iPhone app for App Review. Everything to paste is in
github.com/jdsmith2004/daybook/blob/main/docs/launch.md, step 6. Rules: never type a password,
a 2-factor code, bank or tax details; never accept an agreement; stop and ask me if anything costs
money or is unclear.

1. appstoreconnect.apple.com → Apps → Daybook: Quit Without Shame → the iOS app's 1.0 version
   ("Prepare for Submission").
2. Fill in from step 6: promotional text, description, keywords, support URL, marketing URL
   (empty), copyright. Upload the six screenshots from store-assets/ios69/ in order to the 6.9-inch slot
   (and store-assets/ios63/ to the 6.1-inch or 6.3-inch slot; check Media Manager shows no missing size)
   (download them from GitHub first), and the header and search images from store-assets/ios-header and ios-search.
3. Build: choose the newest build that finished processing (the one I tested in TestFlight).
4. App Information: name and subtitle from step 6; category Health & Fitness, second Lifestyle;
   content rights: no third-party content; age rating questions as in step 6.
5. App Privacy: privacy policy URL from step 6, then the data types exactly as listed there
   (each: used for app functionality, linked to the user, not used for tracking). Publish it.
6. Pricing and Availability: Free, United States only. Check it is still so.
7. App Review Information: notes from step 6. Contact: my name and email (ask me for the phone
   number and let me type it). Sign-in required: yes, and STOP so I type the test account myself.
8. Version release: "Manually release this version".
9. Show me the whole page, then wait for me to say "submit". Then Add for Review → Submit for
   Review. Tell me the status it shows.
```

Review usually takes one to three days. If Apple asks a question or rejects it, paste their message to Claude Code: the
reply, or the fix and a new build (step 5), goes from there. When it is approved, press **Release this version**.

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
     Once the opt-in counts are in a build: app activity, app interactions (optional, collected for analytics, not shared,
     processed so it cannot be tied to a person), and feedback as other user-generated content (optional).
7. **Production.** When the closed test is done, apply for production access in the Play Console's dashboard, then release
   the newest build to production (start at a staged rollout if it offers one). Review usually takes a few days; paste any
   message from Google to Claude Code.
