# AWS for Daybook

Two Terraform stacks:

- **`bootstrap`**: run once, by you, from your own computer. It makes the bucket for Terraform's state, the role GitHub Actions uses to deploy (signed in with OpenID Connect, so no AWS keys are stored anywhere), a permissions boundary that caps what any app role can ever do, and a $5 monthly budget alert.
- **`app`**: Cognito sign-in, the sync API (API Gateway and one Lambda), the DynamoDB table, and the web app (S3 and CloudFront). GitHub Actions deploys it on every push to `main` once the secrets below are set.

Everything is pay-per-use. For one person it should cost well under a dollar a month.

## One-time setup

You need a **personal** AWS account, the AWS CLI, and Terraform 1.10 or newer (`brew install awscli terraform` on a Mac).

> **Locked to one account.** Both stacks take your personal account number (`aws_account_id`) and Terraform refuses to run in any other account, even if the computer is signed in to a work AWS account. The deploy workflow checks it three times: the role must belong to that account, the sign-in must land in it, and Terraform must agree.
>
> **Only from main.** AWS trusts the deploy role only for a workflow running on this repository's `main` branch. A pull request, another branch or a fork cannot get in.

1. **Sign in to AWS from the command line.** Do not use the root account for this. In the AWS console, open IAM Identity Center, create a user for yourself with the `AdministratorAccess` permission set, then:

   ```sh
   aws configure sso          # name the profile "daybook"
   export AWS_PROFILE=daybook
   aws sts get-caller-identity
   ```

2. **Run the bootstrap stack.**

   ```sh
   cd infra/bootstrap
   cp terraform.tfvars.example terraform.tfvars   # your personal account number and your email (git ignores this file)
   terraform init
   terraform apply
   ```

   If it says the GitHub OpenID Connect provider already exists, set `create_github_oidc_provider = false` in `terraform.tfvars` and apply again. AWS emails you to confirm the budget alert.

   Its state stays in `infra/bootstrap/terraform.tfstate` on your computer (git ignores it). Keep that file; you need it to change the bootstrap later.

3. **Tell GitHub.** In the repository on GitHub, open Settings > Secrets and variables > Actions.

   Add these four as **secrets** (the Secrets tab). They hold your account number, and secrets are hidden in the public build logs:

   | Secret | Value |
   | --- | --- |
   | `AWS_ACCOUNT_ID` | `terraform output -raw AWS_ACCOUNT_ID` |
   | `AWS_DEPLOY_ROLE_ARN` | `terraform output -raw AWS_DEPLOY_ROLE_ARN` |
   | `TF_STATE_BUCKET` | `terraform output -raw TF_STATE_BUCKET` |
   | `TF_BOUNDARY_ARN` | `terraform output -raw TF_BOUNDARY_ARN` |

   And this one as a **variable** (the Variables tab): `AWS_REGION`, from `terraform output -raw AWS_REGION`.

   Until all five are set, the Deploy workflow does nothing. Then run it (Actions > Deploy > Run workflow, on `main`). Its summary shows the web address.

4. **Make your account.** Sign-up is invite-only, so nobody else can make an account and run up your bill. After the first deploy:

   ```sh
   POOL=$(aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?Name=='daybook-users'].Id" --output text)
   aws cognito-idp admin-create-user --user-pool-id "$POOL" --username you@example.com \
     --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true
   ```

   Cognito emails you a temporary password; you choose your own the first time you sign in.

5. **Phone builds.** The Deploy summary also lists three `EXPO_PUBLIC_*` values. Put them in `apps/mobile/.env.local` (git ignores it) or in EAS environment variables, and phone builds can sign in and sync too. They are public, like the web app itself.

## Signing in from a local web server

The hosted sign-in page only sends people back to addresses it knows. To sign in from `npx expo start` in a browser, add `dev_origins = ["http://localhost:8081"]` for a deploy you run yourself, or set the variable in the workflow. Leave it empty otherwise.

## If a deploy fails with "AccessDenied"

The deploy role is allowed only what Daybook's resources need. If AWS adds a step Terraform now calls, the error names the action. Add it to `aws_iam_role_policy.deploy` in `infra/bootstrap/main.tf` and run `terraform apply` there again.

## What protects what

- Each person's records are stored under their own Cognito id, which the Lambda takes only from the signed token API Gateway checked.
- The app's sign-in client may use `aws.cognito.signin.user.admin`, so a signed-in person can delete their own account from the app (Cognito `DeleteUser` with their own token). It reaches only their own sign-in.
- On a phone the sign-in is kept in the keychain or keystore, on that device only; in a browser, in that site's storage. Signing out takes the token back (Cognito revokes it) and ends the sign-in page's session.
- The deploy role can only change Daybook's own resources, and any role it makes must carry the boundary, which allows nothing but the Daybook table and its logs.
- The deploy role can manage the table but never read or export what is in it, and it can change user pools but not users' passwords or sign-ins.
- IAM Access Analyzer (free) flags any role or bucket that trusts someone outside the account.
- The API is throttled (5 requests a second, bursts of 10), each request is at most 1 MB, each record at most 64 KB (256 KB for settings), and each person can write at most 20 MB a day. The budget alert emails you at 80% of $5.
- The web app reaches the API at its own address (CloudFront sends `/sync` to API Gateway), so its Content-Security-Policy allows only itself and the sign-in page.
- The account number is a GitHub secret, so it is masked in the public build logs, and the jobs that install npm packages never get an AWS token.
- The table has deletion protection and point-in-time recovery. Erasing your log turns every record into a deletion, so your other devices remove it too.
