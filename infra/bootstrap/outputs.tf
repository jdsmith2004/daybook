/* Copy these into the GitHub repository's settings: Settings > Secrets and variables > Actions > Variables. See infra/README.md. */
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
