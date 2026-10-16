terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  # This stack keeps its own state on your computer (terraform.tfstate, which .gitignore keeps out of git).
  # It only makes the few things every later deploy needs, so it is run once, by you, with your own AWS sign-in.
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { app = "daybook", stack = "bootstrap" }
  }
}
