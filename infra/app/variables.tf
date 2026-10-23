variable "aws_account_id" {
  description = "The personal AWS account Daybook lives in. Terraform refuses to touch any other account. Set by the deploy workflow from the AWS_ACCOUNT_ID repository variable."
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be the 12-digit AWS account number."
  }
}

variable "region" {
  type    = string
  default = "us-east-2"
}

variable "lambda_zip" {
  description = "The built sync Lambda (npm run build -w @daybook/api)."
  type        = string
  default     = "../../services/api/dist/sync.zip"
}

variable "signup_zip" {
  description = "The built sign-up trigger (npm run build -w @daybook/api)."
  type        = string
  default     = "../../services/api/dist/signup.zip"
}

variable "auto_confirm" {
  description = "true: signing up in the app needs no emailed code (the sign-up trigger confirms the account and leaves the email unverified until the person confirms it from Settings). Needs the daybook-app-signup role, which infra/bootstrap makes: turn this on only after the owner has applied the bootstrap stack."
  type        = bool
  default     = true
}

variable "invite_only" {
  description = "true: only the owner can make accounts (with the AWS CLI). false (the default): anyone can sign up in the app, with a checked email. Cognito's built-in email sends about 50 a day, which also caps new sign-ups a day."
  type        = bool
  default     = false
}

variable "dev_origins" {
  description = "Extra web origins allowed to sign in and call the API, for local development (like http://localhost:8081). Empty in production."
  type        = list(string)
  default     = []
}

variable "pulse" {
  description = "true: the opt-in counts and feedback (infra/app/pulse.tf). Needs the daybook-app-pulse role, which infra/bootstrap makes: turn this on only after the owner has applied the bootstrap stack."
  type        = bool
  default     = false
}

variable "pulse_zip" {
  description = "The built pulse Lambda (npm run build -w @daybook/api)."
  type        = string
  default     = "../../services/api/dist/pulse.zip"
}

variable "owner_sub" {
  description = "The owner's account id (Cognito sub), the only one that may read the counts and feedback. Set by the deploy workflow from the DAYBOOK_OWNER_SUB secret; the Stats page in the app shows it. Empty: no one can read them."
  type        = string
  default     = ""
}

variable "apple_sign_in" {
  description = "true: Sign in with Apple (services/api apple-sign-in.ts). Needs the daybook-app-apple-auth role and the sync role's new rights, which infra/bootstrap makes: turn this on only after the owner has applied the bootstrap stack."
  type        = bool
  default     = false
}

variable "apple_auth_zip" {
  description = "The built Sign in with Apple trigger (npm run build -w @daybook/api)."
  type        = string
  default     = "../../services/api/dist/apple-auth.zip"
}

variable "apple_bundle_id" {
  description = "The iPhone app's bundle id: Apple's identity tokens from the app are for it."
  type        = string
  default     = "com.jdsmith2004.daybook"
}

variable "apple_services_id" {
  description = "The Services ID for Sign in with Apple on the web (Apple Developer, Identifiers). Empty: the web has no Apple button. Not secret."
  type        = string
  default     = ""
}

variable "apple_team_id" {
  description = "The Apple Developer Team ID, for revoking Apple's tokens when an account is closed. Not secret."
  type        = string
  default     = ""
}

variable "apple_key_id" {
  description = "The Key ID of the Sign in with Apple key. Not secret; the key itself (.p8) is only ever in Parameter Store at /daybook/apple-key, put there by the owner."
  type        = string
  default     = ""
}
