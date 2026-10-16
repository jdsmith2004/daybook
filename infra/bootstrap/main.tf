/*
 * Run once, by you, with your own AWS sign-in. It makes:
 *   1. an S3 bucket for the app stack's Terraform state (versioned, encrypted, private)
 *   2. a role GitHub Actions can take on to deploy, with no stored AWS keys (OpenID Connect), only from a workflow running
 *      on this repo's main branch
 *   3. a permissions boundary: the most any role the deploys make can ever do (read and write the Daybook table, write logs)
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
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

/* ---------- 3. the most any role made by a deploy can do ---------- */
resource "aws_iam_policy" "boundary" {
  name        = "daybook-app-boundary"
  description = "The most any Daybook app role can do: use the Daybook table and write its own logs."
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:BatchWriteItem"]
        Resource = ["arn:${local.arn}:dynamodb:${var.region}:${local.account}:table/daybook-*"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-*"]
      }
    ]
  })
}

/* what the deploy role may change: only Daybook's own resources, and only roles that carry the boundary above */
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
        Sid       = "MakeRolesOnlyWithBoundary"
        Effect    = "Allow"
        Action    = ["iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:DeleteRolePolicy", "iam:PutRolePermissionsBoundary"]
        Resource  = ["arn:${local.arn}:iam::${local.account}:role/daybook-app-*"]
        Condition = { StringEquals = { "iam:PermissionsBoundary" = aws_iam_policy.boundary.arn } }
      },
      {
        Sid    = "ReadAndRemoveRoles"
        Effect = "Allow"
        Action = ["iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies", "iam:ListInstanceProfilesForRole",
        "iam:DeleteRole", "iam:TagRole", "iam:UntagRole", "iam:UpdateRole", "iam:UpdateRoleDescription", "iam:UpdateAssumeRolePolicy"]
        Resource = ["arn:${local.arn}:iam::${local.account}:role/daybook-app-*"]
      },
      {
        Sid       = "PassRolesToLambdaOnly"
        Effect    = "Allow"
        Action    = ["iam:PassRole"]
        Resource  = ["arn:${local.arn}:iam::${local.account}:role/daybook-app-*"]
        Condition = { StringEquals = { "iam:PassedToService" = "lambda.amazonaws.com" } }
      },
      {
        Sid      = "NoEscapingTheBoundary"
        Effect   = "Deny"
        Action   = ["iam:DeleteRolePermissionsBoundary", "iam:CreatePolicyVersion", "iam:DeletePolicy", "iam:SetDefaultPolicyVersion"]
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
