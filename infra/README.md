# AWS for Daybook

Two Terraform stacks:

- **`bootstrap`**: run once, by you, from your own computer. It makes the bucket for Terraform's state, the role GitHub Actions uses to deploy (signed in with OpenID Connect, so no AWS keys are stored anywhere), a permissions boundary that caps what any app role can ever do, and a $5 monthly budget alert.
- **`app`**: Cognito sign-in, the sync API (API Gateway and one Lambda), the DynamoDB table, and the web app (S3 and CloudFront). GitHub Actions deploys it on every push to `main` once the variables below are set.

Everything is pay-per-use. For one person it should cost well under a dollar a month.

## One-time setup

You need a **personal** AWS account, the AWS CLI, and Terraform 1.10 or newer (`brew install awscli terraform` on a Mac).

> **Locked to one account.** Both stacks take your personal account number (`aws_account_id`) and Terraform refuses to run in any other account, even if the computer is signed in to a work AWS account. The deploy workflow checks it three times: the role must belong to that account, the sign-in must land in it, and Terraform must agree.

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

3. **Tell GitHub.** In the repository on GitHub: Settings > Secrets and variables > Actions > Variables. Add the five outputs from step 2 as repository variables:

   | Variable | From |
   | --- | --- |
   | `AWS_ACCOUNT_ID` | `terraform output -raw AWS_ACCOUNT_ID` |
   | `AWS_REGION` | `terraform output -raw AWS_REGION` |
   | `AWS_DEPLOY_ROLE_ARN` | `terraform output -raw AWS_DEPLOY_ROLE_ARN` |
   | `TF_STATE_BUCKET` | `terraform output -raw TF_STATE_BUCKET` |
   | `TF_BOUNDARY_ARN` | `terraform output -raw TF_BOUNDARY_ARN` |

   These are not secrets, so they are variables. Until all of them are set, the Deploy workflow skips itself. Then run the **Deploy** workflow (Actions > Deploy > Run workflow). Its summary shows the web address.

4. **Make your account.** Sign-up is invite-only, so nobody else can make an account and run up your bill. After the first deploy:

   ```sh
   POOL=$(aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?Name=='daybook-users'].Id" --output text)
   aws cognito-idp admin-create-user --user-pool-id "$POOL" --username you@example.com \
     --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true
   ```

   Cognito emails you a temporary password; you choose your own the first time you sign in.

## What protects what

- Each person's records are stored under their own Cognito id, which the Lambda takes only from the signed token API Gateway checked.
- The deploy role can only change Daybook's own resources, and any role it makes must carry the boundary, which allows nothing but the Daybook table and its logs.
- The API is throttled (10 requests a second, bursts of 20), and the budget alert emails you at 80% of $5.
- The web app sends a strict Content-Security-Policy: it only loads its own code and only talks to the API and the sign-in page.
- The table has deletion protection and point-in-time recovery.
