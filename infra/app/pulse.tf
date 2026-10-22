/* ---------- the pulse: opt-in counts and anonymous feedback (services/api/src/pulse.ts) ----------
   Its own table and function, apart from sync, so the open door (no sign-in) can never reach anyone's log. Off until the
   owner has applied the bootstrap stack, which makes its role (var.pulse). Nothing here keeps who sent what: the table
   holds totals per day and feedback, API Gateway keeps no access log, and the function logs nothing about a request. */
resource "aws_dynamodb_table" "pulse" {
  count                       = var.pulse ? 1 : 0
  name                        = "daybook-pulse"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "pk"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  # feedback and the daily ceilings expire; the totals are kept
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

data "aws_iam_role" "pulse" {
  count = var.pulse ? 1 : 0
  name  = "daybook-app-pulse"
}

resource "aws_cloudwatch_log_group" "pulse" {
  count             = var.pulse ? 1 : 0
  name              = "/aws/lambda/daybook-pulse"
  retention_in_days = 7
}

resource "aws_lambda_function" "pulse" {
  count            = var.pulse ? 1 : 0
  function_name    = "daybook-pulse"
  role             = data.aws_iam_role.pulse[0].arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = var.pulse_zip
  source_code_hash = filebase64sha256(var.pulse_zip)
  memory_size      = 128
  timeout          = 10
  environment {
    variables = {
      TABLE                               = aws_dynamodb_table.pulse[0].name
      OWNER                               = var.owner_sub
      NODE_OPTIONS                        = "--enable-source-maps"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }
  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.pulse[0].name
  }
}

resource "aws_apigatewayv2_integration" "pulse" {
  count                  = var.pulse ? 1 : 0
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.pulse[0].invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 10000
}

/* sending needs no sign-in (counts and feedback work with no account); reading is for the owner, signed in */
resource "aws_apigatewayv2_route" "pulse_open" {
  for_each  = var.pulse ? toset(["POST /pulse", "POST /pulse/feedback"]) : toset([])
  api_id    = aws_apigatewayv2_api.api.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.pulse[0].id}"
}

resource "aws_apigatewayv2_route" "pulse_read" {
  count              = var.pulse ? 1 : 0
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = "GET /pulse"
  target             = "integrations/${aws_apigatewayv2_integration.pulse[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "pulse" {
  count         = var.pulse ? 1 : 0
  statement_id  = "api-gateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pulse[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/pulse*"
}
