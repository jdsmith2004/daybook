/* what the apps need to know, passed to the web build as EXPO_PUBLIC_* settings by the deploy workflow */
output "web_url" {
  value = local.web_origin
}

/* the sync API, through the app's own address (the apps use this one) */
output "sync_url" {
  value = "${local.web_origin}/sync"
}

/* the API Gateway address itself, for testing */
output "api_url" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "user_pool_id" {
  value = aws_cognito_user_pool.users.id
}

output "client_id" {
  value = aws_cognito_user_pool_client.app.id
}

output "auth_domain" {
  value = "https://${aws_cognito_user_pool_domain.users.domain}.auth.${var.region}.amazoncognito.com"
}

output "web_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "distribution_id" {
  value = aws_cloudfront_distribution.web.id
}
