/* ---------- what Daybook learns: the events function (services/api/src/events.ts) ----------
   Its own function, apart from sync and the pulse. Its role, the Firehose stream and the bucket are made by infra/bootstrap
   (events.tf there), so a deploy can hand the function its role but never read the events. Off until the owner has applied
   the bootstrap stack (var.events). API Gateway keeps no access log, and the function logs nothing about a request. */
data "aws_iam_role" "events" {
  count = var.events ? 1 : 0
  name  = "daybook-app-events"
}

resource "aws_cloudwatch_log_group" "events" {
  count             = var.events ? 1 : 0
  name              = "/aws/lambda/daybook-events"
  retention_in_days = 7
}

resource "aws_lambda_function" "events" {
  count            = var.events ? 1 : 0
  function_name    = "daybook-events"
  role             = data.aws_iam_role.events[0].arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = var.events_zip
  source_code_hash = filebase64sha256(var.events_zip)
  memory_size      = 128
  timeout          = 10
  environment {
    variables = {
      STREAM                              = "daybook-events"
      CAPS                                = "daybook-pulse"
      NODE_OPTIONS                        = "--enable-source-maps"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }
  logging_config {
    log_format = "JSON"
    log_group  = aws_cloudwatch_log_group.events[0].name
  }
}

resource "aws_apigatewayv2_integration" "events" {
  count                  = var.events ? 1 : 0
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.events[0].invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 10000
}

/* sending needs no sign-in, and nothing ever reads back through this door */
resource "aws_apigatewayv2_route" "events" {
  count     = var.events ? 1 : 0
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /events"
  target    = "integrations/${aws_apigatewayv2_integration.events[0].id}"
}

resource "aws_lambda_permission" "events" {
  count         = var.events ? 1 : 0
  statement_id  = "api-gateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.events[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/events"
}
