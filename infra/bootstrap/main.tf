/*
 * Run once, by you, with your own AWS sign-in. It makes:
 *   1. an S3 bucket for the app stack's Terraform state (versioned, encrypted, private)
 *   2. a role GitHub Actions can take on to deploy, with no stored AWS keys (OpenID Connect), only from a workflow running
 *      on this repo's main branch
 *   3. the sync function's role, with exactly what it may do (the Daybook table, its own logs, deleting a user who closes their
 *      account), the sign-up trigger's role (its own logs, nothing else), and the pulse function's role (its own table of
 *      opt-in totals and feedback, nothing else). They are made here, not by the deploys: a deploy cannot make or change any role, so it can never give itself, or
 *      an outside account, a way into the table
 *   4. a monthly budget alert, and IAM Access Analyzer (free), which flags any role or bucket that trusts someone outside
 *      this account
 */
data "aws_caller_identity" "me" {}
data "aws_partition" "p" {}

locals {
  account = data.aws_caller_identity.me.account_id
  arn     = data.aws_partition.p.partition
  state   = "daybook-tfstate-${local.account}"
}

/* ---------- 1. the state bucket ---------- */
resource "aws_s3_bucket" "state" {
  bucket = local.state
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    id     = "old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "state" {
  bucket = aws_s3_bucket.state.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "HttpsOnly"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.state.arn, "${aws_s3_bucket.state.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
}

/* ---------- 2. deploys from GitHub, with no stored keys ---------- */
resource "aws_iam_openid_connect_provider" "github" {
  count          = var.create_github_oidc_provider ? 1 : 0
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

resource "aws_iam_role" "deploy" {
  name                 = "daybook-deploy"
  description          = "GitHub Actions deploys Daybook with this role (only from the main branch of ${var.github_repo})."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = local.oidc_arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          # only a workflow running on main: not a pull request, not another branch, not a fork
          # GitHub's immutable subject: owner and repository by name and by id, so only this exact repository matches
          "token.actions.githubusercontent.com:sub" = "repo:${split("/", var.github_repo)[0]}@${var.github_owner_id}/${split("/", var.github_repo)[1]}@${var.github_repo_id}:ref:refs/heads/main"
        }
      }
    }]
  })
}

/* ---------- 3. the sync function's role ---------- */
resource "aws_iam_role" "sync" {
  name                 = "daybook-app-sync"
  description          = "The Daybook sync Lambda. Made by the bootstrap stack; deploys may pass it to the Lambda but never change it."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "aws:SourceAccount" = local.account } }
    }]
  })
}

resource "aws_iam_role_policy" "sync" {
  name = "daybook-sync"
  role = aws_iam_role.sync.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:BatchWriteItem"]
        Resource = ["arn:${local.arn}:dynamodb:${var.region}:${local.account}:table/daybook-records", "arn:${local.arn}:dynamodb:${var.region}:${local.account}:table/daybook-records/index/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-sync:*"]
      },
      {
        # closing an account from the app; the Lambda takes the user name only from the token API Gateway checked.
        # AdminGetUser: when the account was made, for keeping sync on accounts from before tips (services/api supporter.ts)
        Effect   = "Allow"
        Action   = ["cognito-idp:AdminDeleteUser", "cognito-idp:AdminGetUser"]
        Resource = ["arn:${local.arn}:cognito-idp:${var.region}:${local.account}:userpool/*"]
      },
      {
        # the Stripe restricted key (read only, Checkout Sessions only), which the owner puts in Parameter Store by hand;
        # it is never in Terraform, its state, GitHub or the code (docs/plan.md, "Payments")
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = ["arn:${local.arn}:ssm:${var.region}:${local.account}:parameter/daybook/stripe-key"]
      },
      {
        # decrypting that one parameter, and only through Parameter Store
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = ["arn:${local.arn}:kms:${var.region}:${local.account}:key/*"]
        Condition = {
          StringEquals = {
            "kms:ViaService"                      = "ssm.${var.region}.amazonaws.com"
            "kms:EncryptionContext:PARAMETER_ARN" = "arn:${local.arn}:ssm:${var.region}:${local.account}:parameter/daybook/stripe-key"
          }
        }
      }
    ]
  })
}

/* ---------- 3b. the sign-up trigger's role ----------
   Cognito calls this function when someone signs up in the app; it confirms the account without an emailed code and reads
   and stores nothing, so all it may do is write its own logs. */
resource "aws_iam_role" "signup" {
  name                 = "daybook-app-signup"
  description          = "The Daybook sign-up trigger Lambda. Made by the bootstrap stack; deploys may pass it to the Lambda but never change it."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "aws:SourceAccount" = local.account } }
    }]
  })
}

resource "aws_iam_role_policy" "signup" {
  name = "daybook-signup"
  role = aws_iam_role.signup.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = ["arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-signup:*"]
    }]
  })
}

/* ---------- 3c. the pulse function's role ----------
   The opt-in counts and anonymous feedback (services/api/src/pulse.ts). Its door is open (no sign-in), so its role can
   touch nothing but its own table: add to the totals, keep feedback, and read them back for the owner. It can never
   reach daybook-records, where the logs are. */
resource "aws_iam_role" "pulse" {
  name                 = "daybook-app-pulse"
  description          = "The Daybook pulse Lambda (opt-in counts and feedback). Made by the bootstrap stack; deploys may pass it to the Lambda but never change it."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "aws:SourceAccount" = local.account } }
    }]
  })
}

resource "aws_iam_role_policy" "pulse" {
  name = "daybook-pulse"
  role = aws_iam_role.pulse.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:UpdateItem", "dynamodb:PutItem", "dynamodb:Query"]
        Resource = ["arn:${local.arn}:dynamodb:${var.region}:${local.account}:table/daybook-pulse"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-pulse:*"]
      },
    ]
  })
}

/* what the deploy role may change: only Daybook's own resources. It cannot make, change or act as any role. */
resource "aws_iam_role_policy" "deploy" {
  name = "daybook-deploy"
  role = aws_iam_role.deploy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "State"
        Effect   = "Allow"
        Action   = ["s3:ListBucket", "s3:GetBucketVersioning"]
        Resource = [aws_s3_bucket.state.arn]
      },
      {
        Sid      = "StateObjects"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.state.arn}/app/*"]
      },
      {
        Sid      = "Who"
        Effect   = "Allow"
        Action   = ["sts:GetCallerIdentity"]
        Resource = ["*"]
      },
      {
        # manage the table, but never read or export what is in it
        Sid    = "Table"
        Effect = "Allow"
        Action = ["dynamodb:CreateTable", "dynamodb:UpdateTable", "dynamodb:DeleteTable", "dynamodb:Describe*", "dynamodb:List*",
        "dynamodb:UpdateContinuousBackups", "dynamodb:UpdateTimeToLive", "dynamodb:TagResource", "dynamodb:UntagResource"]
        Resource = ["arn:${local.arn}:dynamodb:${var.region}:${local.account}:table/daybook-*"]
      },
      {
        Sid      = "Function"
        Effect   = "Allow"
        Action   = ["lambda:*"]
        Resource = ["arn:${local.arn}:lambda:${var.region}:${local.account}:function:daybook-*"]
      },
      {
        Sid      = "Logs"
        Effect   = "Allow"
        Action   = ["logs:*"]
        Resource = ["arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-*", "arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-*:*"]
      },
      {
        Sid      = "LogsList"
        Effect   = "Allow"
        Action   = ["logs:DescribeLogGroups"]
        Resource = ["*"]
      },
      {
        # look at the app roles (Terraform reads them), and hand them to their Lambdas, but never change them
        Sid      = "ReadTheSyncRole"
        Effect   = "Allow"
        Action   = ["iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies"]
        Resource = [aws_iam_role.sync.arn, aws_iam_role.signup.arn, aws_iam_role.pulse.arn]
      },
      {
        Sid       = "PassTheSyncRoleToLambdaOnly"
        Effect    = "Allow"
        Action    = ["iam:PassRole"]
        Resource  = [aws_iam_role.sync.arn, aws_iam_role.signup.arn, aws_iam_role.pulse.arn]
        Condition = { StringEquals = { "iam:PassedToService" = "lambda.amazonaws.com" } }
      },
      {
        # the deployer ships the code, but never reads a log itself: it cannot call the sync function (which would let it
        # make up whose log to read), open it to the internet, let anything but API Gateway call it, or act as its role
        Sid    = "NeverReadTheLog"
        Effect = "Deny"
        Action = ["lambda:InvokeFunction", "lambda:InvokeAsync", "lambda:InvokeWithResponseStream", "lambda:InvokeFunctionUrl",
        "lambda:CreateFunctionUrlConfig", "lambda:UpdateFunctionUrlConfig"]
        Resource = ["*"]
      },
      {
        # API Gateway may call the sync function, and Cognito the sign-up trigger; nothing else may be let in
        Sid       = "OnlyApiGatewayMayCallIt"
        Effect    = "Deny"
        Action    = ["lambda:AddPermission"]
        Resource  = ["*"]
        Condition = { StringNotEquals = { "lambda:Principal" = ["apigateway.amazonaws.com", "cognito-idp.amazonaws.com"] } }
      },
      {
        Sid       = "CognitoNeverCallsTheSyncFunction"
        Effect    = "Deny"
        Action    = ["lambda:AddPermission"]
        Resource  = ["arn:${local.arn}:lambda:${var.region}:${local.account}:function:daybook-sync"]
        Condition = { StringEquals = { "lambda:Principal" = "cognito-idp.amazonaws.com" } }
      },
      {
        Sid      = "NeverActAsTheAppRoles"
        Effect   = "Deny"
        Action   = ["sts:AssumeRole", "sts:TagSession", "sts:SetSourceIdentity"]
        Resource = ["arn:${local.arn}:iam::${local.account}:role/daybook-app-*"]
      },
      {
        # belt and braces: whatever is added above later, a deploy never makes or changes a role or a policy
        # (service-linked roles, which only AWS defines, are left alone in case a service needs to make one)
        Sid    = "NoIamChanges"
        Effect = "Deny"
        Action = ["iam:CreateRole", "iam:CreatePolicy", "iam:CreatePolicyVersion", "iam:CreateUser", "iam:CreateAccessKey", "iam:CreateLoginProfile",
          "iam:CreateGroup", "iam:CreateInstanceProfile", "iam:CreateOpenIDConnectProvider", "iam:CreateSAMLProvider", "iam:Put*", "iam:Attach*",
        "iam:Detach*", "iam:DeleteRole*", "iam:DeletePolicy*", "iam:Update*", "iam:Add*", "iam:Remove*", "iam:Set*", "iam:Tag*", "iam:Untag*"]
        Resource = ["*"]
      },
      {
        Sid      = "Api"
        Effect   = "Allow"
        Action   = ["apigateway:GET", "apigateway:POST", "apigateway:PUT", "apigateway:PATCH", "apigateway:DELETE", "apigateway:TagResource", "apigateway:UntagResource"]
        Resource = ["arn:${local.arn}:apigateway:${var.region}::/apis", "arn:${local.arn}:apigateway:${var.region}::/apis/*", "arn:${local.arn}:apigateway:${var.region}::/tags/*"]
      },
      {
        Sid      = "AuthCreate"
        Effect   = "Allow"
        Action   = ["cognito-idp:CreateUserPool", "cognito-idp:ListUserPools", "cognito-idp:DescribeUserPoolDomain"]
        Resource = ["*"]
      },
      {
        # the user pools in this account and region: their settings, never the users' passwords or sign-ins
        Sid    = "Auth"
        Effect = "Allow"
        Action = ["cognito-idp:Describe*", "cognito-idp:GetUserPoolMfaConfig", "cognito-idp:GetSigningCertificate", "cognito-idp:ListUserPoolClients",
          "cognito-idp:ListTagsForResource", "cognito-idp:UpdateUserPool", "cognito-idp:DeleteUserPool",
          "cognito-idp:CreateUserPoolClient", "cognito-idp:UpdateUserPoolClient", "cognito-idp:DeleteUserPoolClient",
          "cognito-idp:CreateUserPoolDomain", "cognito-idp:UpdateUserPoolDomain", "cognito-idp:DeleteUserPoolDomain",
          "cognito-idp:CreateManagedLoginBranding", "cognito-idp:UpdateManagedLoginBranding", "cognito-idp:DeleteManagedLoginBranding",
        "cognito-idp:SetUserPoolMfaConfig", "cognito-idp:TagResource", "cognito-idp:UntagResource"]
        Resource = ["arn:${local.arn}:cognito-idp:${var.region}:${local.account}:userpool/*"]
      },
      {
        Sid      = "WebBucket"
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = ["arn:${local.arn}:s3:::daybook-web-*", "arn:${local.arn}:s3:::daybook-web-*/*"]
      },
      {
        Sid      = "Cdn"
        Effect   = "Allow"
        Action   = ["cloudfront:*"]
        Resource = ["*"]
      }
    ]
  })
}

/* ---------- 4. the budget alert ---------- */
resource "aws_budgets_budget" "monthly" {
  name         = "daybook-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}

/* ---------- 5. a free check for anything that trusts an outside account ---------- */
resource "aws_accessanalyzer_analyzer" "account" {
  analyzer_name = "daybook-account"
  type          = "ACCOUNT"
}
