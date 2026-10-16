variable "region" {
  type    = string
  default = "us-east-2"
}

variable "boundary_arn" {
  description = "The permissions boundary from the bootstrap stack (its TF_BOUNDARY_ARN output). Every role here carries it."
  type        = string
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
  description = "Extra web origins allowed to call the API and sign in, for local development."
  type        = list(string)
  default     = ["http://localhost:8081"]
}
