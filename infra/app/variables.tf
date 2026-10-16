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

variable "invite_only" {
  description = "Only you can make accounts (with the AWS CLI). Set to false to let people sign up themselves."
  type        = bool
  default     = true
}

variable "dev_origins" {
  description = "Extra web origins allowed to sign in and call the API, for local development (like http://localhost:8081). Empty in production."
  type        = list(string)
  default     = []
}
