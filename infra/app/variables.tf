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
  default     = false
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
