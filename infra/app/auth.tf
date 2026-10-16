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
   older REFRESH_TOKEN_AUTH flow is off, because rotation requires that; the apps renew at the token endpoint. */
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
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH"]
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
}

/* the look of the hosted sign-in page (Cognito's own, for now) */
resource "aws_cognito_managed_login_branding" "app" {
  user_pool_id                = aws_cognito_user_pool.users.id
  client_id                   = aws_cognito_user_pool_client.app.id
  use_cognito_provided_values = true
}
