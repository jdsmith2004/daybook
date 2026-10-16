/* ---------- the sync API: API Gateway checks the sign-in token, then one Lambda does the work ---------- */
/* the function's role is made by the bootstrap stack, with exactly what the function may do; a deploy can only hand it over */
data "aws_iam_role" "sync" {
  name = "daybook-app-sync"
}

resource "aws_cloudwatch_log_group" "sync" {
  name              = "/aws/lambda/daybook-sync"
  retention_in_days = 14
}

resource "aws_lambda_function" "sync" {
  function_name    = "daybook-sync"
  role             = data.aws_iam_role.sync.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = var.lambda_zip
  source_code_hash = filebase64sha256(var.lambda_zip)
  memory_size      = 256
  timeout          = 15
  environment {
    variables = {
      TABLE                               = aws_dynamodb_table.records.name
      USER_POOL_ID                        = aws_cognito_user_pool.users.id
      NODE_OPTIONS                        = "--enable-source-maps"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }
  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.sync.name
  }
}

/* the web app reaches the API through its own address (CloudFront sends /sync here), so no cross-origin access is needed;
   only a local development server, if one is listed, is allowed */
resource "aws_apigatewayv2_api" "api" {
  name          = "daybook-api"
  protocol_type = "HTTP"
  dynamic "cors_configuration" {
    for_each = length(var.dev_origins) > 0 ? [1] : []
    content {
      allow_origins = var.dev_origins
      allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
      allow_headers = ["authorization", "content-type"]
      max_age       = 3600
    }
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.api.id
  name             = "cognito"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  jwt_configuration {
    issuer   = "https://${aws_cognito_user_pool.users.endpoint}"
    audience = [aws_cognito_user_pool_client.app.id]
  }
}

resource "aws_apigatewayv2_integration" "sync" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sync.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 15000
}

resource "aws_apigatewayv2_route" "sync" {
  for_each           = toset(["GET /sync", "POST /sync", "DELETE /sync"])
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.sync.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
  # a ceiling on requests, so a runaway client (or anyone else) cannot run up a bill
  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }
}

resource "aws_lambda_permission" "api" {
  statement_id  = "api-gateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sync.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/sync"
}
