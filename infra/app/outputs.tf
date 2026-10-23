/* what the apps need to know, passed to the web build as EXPO_PUBLIC_* settings by the deploy workflow */
output "web_url" {
  value = local.web_origin
}

/* the sync API, through the app's own address (the apps use this one) */
output "sync_url" {
  value = "${local.web_origin}/sync"
}

/* the opt-in counts and feedback, through the app's own address; empty while the pulse is off, so the app never asks */
output "pulse_url" {
  value = var.pulse ? "${local.web_origin}/pulse" : ""
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

/* Sign in with Apple: "on" once it is set up, for the phone build (EXPO_PUBLIC_APPLE); and the web's Services ID, empty
   until there is one, so the web shows no Apple button */
output "apple" {
  value = var.apple_sign_in ? "on" : ""
}

output "apple_services_id" {
  value = var.apple_sign_in ? var.apple_services_id : ""
}
