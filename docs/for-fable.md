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

