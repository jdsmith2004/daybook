terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  # The state lives in the bucket the bootstrap stack made. The bucket name and region are passed at init:
  #   terraform init -backend-config="bucket=$TF_STATE_BUCKET" -backend-config="region=$AWS_REGION"
  backend "s3" {
    key          = "app/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region
  # the lock: if the AWS sign-in in use belongs to any other account (a work account, say), Terraform stops before doing anything
  allowed_account_ids = [var.aws_account_id]
  default_tags {
    tags = { app = "daybook", stack = "app" }
  }
}
