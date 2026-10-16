/* Copy these into the GitHub repository settings (Settings > Secrets and variables > Actions): AWS_REGION as a variable, the rest as secrets. See infra/README.md. */
output "AWS_ACCOUNT_ID" {
  value = var.aws_account_id
}

output "AWS_REGION" {
  value = var.region
}

output "AWS_DEPLOY_ROLE_ARN" {
  value = aws_iam_role.deploy.arn
}

output "TF_STATE_BUCKET" {
  value = aws_s3_bucket.state.bucket
}

output "TF_BOUNDARY_ARN" {
  value = aws_iam_policy.boundary.arn
}
