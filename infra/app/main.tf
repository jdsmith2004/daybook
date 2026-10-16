/*
 * Daybook's cloud: sign-in (Cognito), the sync API (API Gateway + one Lambda), the records table (DynamoDB),
 * and the web app (a private S3 bucket behind CloudFront). Everything is pay-per-use, so one person costs about nothing.
 */
data "aws_caller_identity" "me" {}
data "aws_partition" "p" {}

locals {
  account = data.aws_caller_identity.me.account_id
  # a short, stable suffix for names that must be unique across AWS, without putting the account number in them
  suffix     = substr(sha1("${local.account}-${var.region}"), 0, 8)
  web_origin = "https://${aws_cloudfront_distribution.web.domain_name}"
  origins    = concat([local.web_origin], var.dev_origins)
}
