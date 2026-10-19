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

| Decision               | Suggested                                                 | Why                                                                                                                                           |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle ID              | `com.jdsmith2004.daybook` (set in `apps/mobile/app.json`) | It can never change once step 3 runs. Tell Claude before then if you want another.                                                            |
| Name on the App Store  | Daybook: Quit Without Shame                               | The home screen still says Daybook. "Porn" stays out of the name, so it is not in anyone's purchase list.                                     |
| Where it is offered    | The United States only, for now                           | A link out to pay (the tip jar) is allowed on the US App Store only (Review Guidelines 3.1.1(a)).                                             |
| Tip service            | A Stripe Payment Link (done, October 19)                  | The giver picks the amount ($5 suggested); cards, Apple Pay and others. The statement says JEFFREY until Stripe accepts DAYBOOK (see step 1). |
| Support email          | A new address used only for Daybook                       | The App Store needs a support page. Claude makes the page once there is an address.                                                           |
| Your developer account | Tell Claude: individual or organization                   | An individual account shows your legal name as the seller on the App Store.                                                                   |

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
   means it is on its way.
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
  > • An evening wind-down, a morning check, and a weekly review.
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

- **Privacy Policy URL:** https://d3c9g6kent5bsr.cloudfront.net/privacy (the GitHub Pages copy answers with a 404 code, so
  use this one, or a real domain later).
- **Support URL:** the support page Claude makes from step 0's email.
- **Screenshots:** the six in `docs/store/` (1290 × 2796, iPhone 6.9-inch), in order. Download them from GitHub on
  whichever computer you are using.
- **Age rating:** answer the questions as they are: no nudity or sexual content; mature themes (porn is named and talked
  about plainly); health information (lessons on changing a habit). Accept the rating it gives.
- **App Privacy** (what Apple shows as the privacy label). Data is collected only for people who make an account, only to
  make the app work, linked to that account, and never used to track:
  - Contact info: email address.
  - Health and fitness: health (the log of urges and slips is health data a person gives).
  - Sensitive info: religious beliefs (setup asks how much faith matters, and that answer syncs).
  - User content: other user content (the log, notes, plans).
  - Identifiers: user ID.
  - Tracking: **no**. Data used to track you: **none**.
- **Notes for App Review:**

  > Daybook works fully without an account: SOS, logging, Rekindle, the plan and the tools never ask for one. An optional
  > free account syncs a copy and opens the lessons after the first three. "Support Daybook" opens a tip
  > page in the browser; tips unlock nothing, and the link is offered on the United States storefront only, under
  > guideline 3.1.1(a). The app has no ads and no analytics.
