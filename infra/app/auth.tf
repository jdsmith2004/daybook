/* ---------- sign-in: a Cognito user pool with its own hosted sign-in page ----------
   The apps open the hosted page and get tokens back with the authorization code flow and PKCE (no client secret, which an
   app could not keep secret anyway). Invite-only by default: accounts are made with the AWS CLI (see infra/README.md). */
resource "aws_cognito_user_pool" "users" {
  name                     = "daybook-users"
  user_pool_tier           = "ESSENTIALS"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"
  mfa_configuration        = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = var.invite_only
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = false
    require_uppercase                = false
    require_numbers                  = false
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  username_configuration {
    case_sensitive = false
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # a new email address (which is also the sign-in name) only takes effect once its code is confirmed
  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  # with auto_confirm, the sign-up trigger confirms new accounts, so no code is emailed at sign-up; with apple_sign_in, the
  # Apple trigger runs the one-step custom sign-in (services/api/src/apple-auth.ts)
  dynamic "lambda_config" {
    for_each = var.auto_confirm || var.apple_sign_in ? [1] : []
    content {
      pre_sign_up                    = var.auto_confirm ? aws_lambda_function.signup[0].arn : null
      define_auth_challenge          = var.apple_sign_in ? aws_lambda_function.apple_auth[0].arn : null
      create_auth_challenge          = var.apple_sign_in ? aws_lambda_function.apple_auth[0].arn : null
      verify_auth_challenge_response = var.apple_sign_in ? aws_lambda_function.apple_auth[0].arn : null
    }
  }
}

/* ---------- the sign-up trigger (services/api/src/signup.ts) ----------
   Confirms an account made in the app at once, with the email left unverified, so a mistyped address can never be used to
   reset the password. Its role (logs only) is made by the bootstrap stack; only Cognito may call it. */
data "aws_iam_role" "signup" {
  count = var.auto_confirm ? 1 : 0
  name  = "daybook-app-signup"
}

resource "aws_cloudwatch_log_group" "signup" {
  count             = var.auto_confirm ? 1 : 0
  name              = "/aws/lambda/daybook-signup"
  retention_in_days = 14
}

resource "aws_lambda_function" "signup" {
  count            = var.auto_confirm ? 1 : 0
  function_name    = "daybook-signup"
  role             = data.aws_iam_role.signup[0].arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = var.signup_zip
  source_code_hash = filebase64sha256(var.signup_zip)
  memory_size      = 128
  timeout          = 5
  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.signup[0].name
  }
}

resource "aws_lambda_permission" "signup" {
  count         = var.auto_confirm ? 1 : 0
  statement_id  = "cognito-pre-sign-up"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.signup[0].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.users.arn
}

/* ---------- the Sign in with Apple trigger (services/api/src/apple-auth.ts) ----------
   Cognito's custom sign-in, one step: the answer is Apple's identity token, right only when Apple signed it and it is the
   Apple ID joined to the account. Only the sync function joins an Apple ID to an account (the app client may write only
   the email, below). Its role (logs only) is made by the bootstrap stack; only Cognito may call it. */
data "aws_iam_role" "apple_auth" {
  count = var.apple_sign_in ? 1 : 0
  name  = "daybook-app-apple-auth"
}

resource "aws_cloudwatch_log_group" "apple_auth" {
  count             = var.apple_sign_in ? 1 : 0
  name              = "/aws/lambda/daybook-apple-auth"
  retention_in_days = 14
}

resource "aws_lambda_function" "apple_auth" {
  count            = var.apple_sign_in ? 1 : 0
  function_name    = "daybook-apple-auth"
  role             = data.aws_iam_role.apple_auth[0].arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = var.apple_auth_zip
  source_code_hash = filebase64sha256(var.apple_auth_zip)
  memory_size      = 128
  timeout          = 5
  environment {
    variables = {
      APPLE_AUDIENCES = join(",", compact([var.apple_bundle_id, var.apple_services_id]))
    }
  }
  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.apple_auth[0].name
  }
}

resource "aws_lambda_permission" "apple_auth" {
  count         = var.apple_sign_in ? 1 : 0
  statement_id  = "cognito-custom-auth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.apple_auth[0].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.users.arn
}

resource "aws_cognito_user_pool_domain" "users" {
  domain                = "daybook-${local.suffix}"
  user_pool_id          = aws_cognito_user_pool.users.id
  managed_login_version = 2
}

/* scopes: only openid and email, which say who signed in. A token cannot change the account itself (its email or password),
   so a stolen token cannot take the account over. "Delete my account" goes through the sync API instead (DELETE /sync?all=1),
   whose Lambda may delete users in this pool and nothing else about them.
   A sign-in lasts a year from when it was made (Cognito cannot extend it while in use), on phones and on browsers the person
   trusts; an untrusted browser forgets it when the tab closes. With rotation, every renewal (about hourly while the app is in
   use) replaces the refresh token and retires the old one a minute later, so a copied token stops working soon after. The
   older REFRESH_TOKEN_AUTH flow is off, because rotation requires that; the apps renew with GetTokensFromRefreshToken.
   The apps sign people up and in natively, with their own screens (apps/mobile/src/app/account.tsx) calling the Cognito
   API: SignUp and ConfirmSignUp, and USER_PASSWORD_AUTH (the password goes only to Cognito, over TLS). Sign in with Apple
   goes through the sync function (POST /sync/apple), which signs the account in with CUSTOM_AUTH. The OAuth settings
   and the hosted page below are no longer used by the apps, and are kept so nothing breaks while older builds are around. */
resource "aws_cognito_user_pool_client" "app" {
  name                                 = "daybook-app"
  user_pool_id                         = aws_cognito_user_pool.users.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = concat(["daybook://auth"], [for o in local.origins : "${o}/auth"])
  logout_urls                          = concat(["daybook://signed-out"], [for o in local.origins : "${o}/"])
  explicit_auth_flows                  = concat(["ALLOW_USER_SRP_AUTH", "ALLOW_USER_PASSWORD_AUTH"], var.apple_sign_in ? ["ALLOW_CUSTOM_AUTH"] : [])
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  access_token_validity                = 60
  id_token_validity                    = 60
  refresh_token_validity               = 365
  refresh_token_rotation {
    feature                    = "ENABLED"
    retry_grace_period_seconds = 60
  }
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
  # a token may change only the email. preferred_username marks the Apple ID an account signs in with, and only the sync
  # function sets it, so nobody can point their account at someone else's Apple ID
  write_attributes = ["email"]
}

/* the look of the hosted sign-in page (Cognito's own, for now) */
resource "aws_cognito_managed_login_branding" "app" {
  user_pool_id                = aws_cognito_user_pool.users.id
  client_id                   = aws_cognito_user_pool_client.app.id
  use_cognito_provided_values = true
}
