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

## 2. Check lessons 33 to 40 against their sources (waiting)

Lessons 33 to 40 (`packages/core/src/lessons-more.ts`) were written on October 16, 2026 from the sources' published abstracts and
summaries, because the session that wrote them could not open the papers. Every claim needs checking against the paper itself.
Ask for a list, per lesson, of each sentence that says more than its source (or says it differently), with the exact wording the
source supports. Change nothing without asking. Pay most attention to these:

- **l33, l36 (I-PACE, Brand et al. 2019):** that the model describes a shift over time from gratification (pleasure) toward
  compensation (relief from bad feelings), with growing cue-reactivity and habit and weaker inhibitory control; and that the
  model covers problem porn use.
- **l33 (Berridge & Robinson 2016):** wanting on large systems that include dopamine, liking on smaller systems that do not
  depend on it; in addiction, wanting grows (most of all when cued) without liking growing with it.
- **l34 (Gola et al. 2017):** 52 men (28 seeking treatment, 24 without); a stronger ventral striatum response to cues that
  predicted erotic pictures, not to the pictures; the cue response related to how much porn they reported using. The source
  link is the bioRxiv preprint; swap in the published Neuropsychopharmacology page if it differs.
- **l35 (Quinn, Pascoe, Wood & Neal 2010; Wood & Rünger 2016):** two diary studies; vigilant monitoring worked best for strong
  habits; stimulus control did little for strong habits; an experiment pointed to more control in the moment, not a weaker
  habit. And the review's description of habits as started by the settings where they repeat.
- **l37 (Dingle, Stark, Cruwys & Best 2015; Best et al. 2016):** 132 adults in a therapeutic community; user identity fell and
  recovery identity rose over the first month; the size of the shift went with less frequent drinking and more life
  satisfaction later. SIMOR: identity changes through groups and meaningful activities.
- **l38 (Patrick & Hagtvedt 2012):** “I don’t” led to more healthy-snack choices than “I can’t”; the ten-day study with women
  on a health goal, and whether it had a plain “no” group that did worse than “I don’t”; feeling in charge (empowerment).
- **l39 (Hershfield et al. 2011):** age-progressed images (some in virtual reality) raised the choice of later money over money
  now and allocation to retirement in a savings task; the scope line that a US Department of Labor (CLEAR) review found the
  results differed across studies.
- **l40:** the James Clear “vote” idea is presented as an idea from a book, not a finding; Harkin et al. 2016 as in lesson 19.

Also worth a look: whether each lesson's "Make a guess" options and "Check it" replies stay inside the same sources.

Suggested: Fable at medium effort, one run, `packages/core/src/lessons-more.ts` and the source links attached.
