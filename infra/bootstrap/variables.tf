variable "aws_account_id" {
  description = "Your PERSONAL AWS account number. Terraform refuses to touch any other account, so it can never run against a work account by mistake. Put it in terraform.tfvars (kept out of git)."
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be the 12-digit AWS account number."
  }
}

variable "region" {
  description = "The AWS region for everything Daybook uses."
  type        = string
  default     = "us-east-2"
}

variable "github_repo" {
  description = "The GitHub repository allowed to deploy, as owner/name."
  type        = string
  default     = "jdsmith2004/daybook"
}

variable "github_owner_id" {
  description = "The numeric id of the repository's owner (gh api users/<owner> --jq .id). GitHub puts it in the deploy token's subject, so a renamed or re-created account cannot deploy."
  type        = string
  default     = "97774477"
}

variable "github_repo_id" {
  description = "The numeric id of the repository (gh api repos/<owner>/<name> --jq .id). GitHub puts it in the deploy token's subject, so a repository re-created under the same name cannot deploy."
  type        = string
  default     = "1422351306"
}

variable "alert_email" {
  description = "Where AWS sends budget alerts. Put it in terraform.tfvars (kept out of git), never in this file."
  type        = string
}

variable "monthly_budget_usd" {
  description = "Send an alert when the month's AWS bill is on track to pass this."
  type        = number
  default     = 5
}

variable "create_github_oidc_provider" {
  description = "Set to false if this AWS account already has the GitHub OIDC provider (token.actions.githubusercontent.com)."
  type        = bool
  default     = true
}
