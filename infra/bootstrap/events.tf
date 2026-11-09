/* ---------- 6. what Daybook learns: the events store (the owner, November 9, 2026) ----------
   The events API (services/api/src/events.ts) puts each phone's events on a Firehose stream; Firehose writes them, gzipped,
   to a private bucket by day; Athena reads them for the Stats workflow. Everything here is made by the owner's apply, not by
   the deploys, so the deploy role can never read, copy or change the events: it can only hand the events function its role.

   Kept for 2 years, then deleted by the bucket itself. No access logs anywhere: no internet address is ever kept.
   Cost: pay-per-use. At about 1,000 people a day, under $1 a month; at 10,000, about $3 to $5 (docs/plan.md). */
locals {
  events_bucket = "daybook-events-${local.account}"
  events_stream = "daybook-events"
  events_keep   = 730
}

resource "aws_s3_bucket" "events" {
  bucket = local.events_bucket
}

resource "aws_s3_bucket_public_access_block" "events" {
  bucket                  = aws_s3_bucket.events.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "events" {
  bucket = aws_s3_bucket.events.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "events" {
  bucket = aws_s3_bucket.events.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

/* the events go after 2 years; Athena's answers after a week; anything Firehose could not deliver after a month */
resource "aws_s3_bucket_lifecycle_configuration" "events" {
  bucket = aws_s3_bucket.events.id
  rule {
    id     = "events"
    status = "Enabled"
    filter {
      prefix = "raw/"
    }
    expiration {
      days = local.events_keep
    }
  }
  rule {
    id     = "answers"
    status = "Enabled"
    filter {
      prefix = "athena/"
    }
    expiration {
      days = 7
    }
  }
  rule {
    id     = "errors"
    status = "Enabled"
    filter {
      prefix = "errors/"
    }
    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "events" {
  bucket = aws_s3_bucket.events.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "EncryptedConnectionsOnly"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.events.arn, "${aws_s3_bucket.events.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
}

/* Firehose's own role: write to this bucket, nothing else */
resource "aws_iam_role" "events_firehose" {
  name                 = "daybook-events-firehose"
  description          = "Firehose writes Daybook's events to their bucket with this role, and does nothing else."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "firehose.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "sts:ExternalId" = local.account } }
    }]
  })
}

resource "aws_iam_role_policy" "events_firehose" {
  name = "daybook-events-firehose"
  role = aws_iam_role.events_firehose.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:AbortMultipartUpload", "s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads", "s3:PutObject"]
      Resource = [aws_s3_bucket.events.arn, "${aws_s3_bucket.events.arn}/raw/*", "${aws_s3_bucket.events.arn}/errors/*"]
    }]
  })
}

resource "aws_kinesis_firehose_delivery_stream" "events" {
  name        = local.events_stream
  destination = "extended_s3"
  server_side_encryption {
    enabled  = true
    key_type = "AWS_OWNED_CMK"
  }
  extended_s3_configuration {
    role_arn            = aws_iam_role.events_firehose.arn
    bucket_arn          = aws_s3_bucket.events.arn
    prefix              = "raw/dt=!{timestamp:yyyy-MM-dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/dt=!{timestamp:yyyy-MM-dd}/"
    compression_format  = "GZIP"
    # a file every 15 minutes at most (fewer, larger files: cheaper to write and to read)
    buffering_interval = 900
    buffering_size     = 5
  }
}

/* the events function's role: put records on this one stream, count its own ceiling in the pulse table's "#cap" partition,
   and its own logs. It can never read the stream back, the bucket, the totals, feedback or anyone's records. */
resource "aws_iam_role" "events" {
  name                 = "daybook-app-events"
  description          = "The Daybook events Lambda. Made by the bootstrap stack; deploys may pass it to the Lambda but never change it."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "aws:SourceAccount" = local.account } }
    }]
  })
}

resource "aws_iam_role_policy" "events" {
  name = "daybook-events"
  role = aws_iam_role.events.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["firehose:PutRecord", "firehose:PutRecordBatch"]
        Resource = [aws_kinesis_firehose_delivery_stream.events.arn]
      },
      {
        Effect    = "Allow"
        Action    = ["dynamodb:UpdateItem"]
        Resource  = ["arn:${local.arn}:dynamodb:${var.region}:${local.account}:table/daybook-pulse"]
        Condition = { "ForAllValues:StringEquals" = { "dynamodb:LeadingKeys" = ["#cap"] } }
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["arn:${local.arn}:logs:${var.region}:${local.account}:log-group:/aws/lambda/daybook-events:*"]
      },
    ]
  })
}

/* how Athena reads the files: one table over the bucket, the day from the folder name (no crawler, no cost) */
resource "aws_glue_catalog_database" "events" {
  name = "daybook_events"
}

resource "aws_glue_catalog_table" "events" {
  database_name = aws_glue_catalog_database.events.name
  name          = "events"
  table_type    = "EXTERNAL_TABLE"
  parameters = {
    "classification"              = "json"
    "compressionType"             = "gzip"
    "projection.enabled"          = "true"
    "projection.dt.type"          = "date"
    "projection.dt.format"        = "yyyy-MM-dd"
    "projection.dt.range"         = "2026-11-01,NOW"
    "projection.dt.interval"      = "1"
    "projection.dt.interval.unit" = "DAYS"
    "storage.location.template"   = "s3://${local.events_bucket}/raw/dt=$${dt}/"
  }
  partition_keys {
    name = "dt"
    type = "string"
  }
  storage_descriptor {
    location      = "s3://${local.events_bucket}/raw/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"
    ser_de_info {
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
      parameters            = { "ignore.malformed.json" = "true" }
    }
    columns {
      name = "day"
      type = "string"
    }
    columns {
      name    = "i"
      type    = "string"
      comment = "the install id: random, made on the phone, never tied to an account"
    }
    columns {
      name = "pf"
      type = "string"
    }
    columns {
      name = "v"
      type = "string"
    }
    columns {
      name    = "k"
      type    = "bigint"
      comment = "the event's place in this phone's stream: what came next"
    }
    columns {
      name = "n"
      type = "string"
    }
    columns {
      name    = "d"
      type    = "int"
      comment = "days since install"
    }
    columns {
      name    = "h"
      type    = "int"
      comment = "local hour of the day"
    }
    columns {
      name    = "p"
      type    = "string"
      comment = "the props, as JSON (json_extract_scalar)"
    }
  }
}

/* Athena's workgroup: answers in the bucket for a week, and a ceiling of 1 GB scanned a query (5 cents at most) */
resource "aws_athena_workgroup" "events" {
  name          = "daybook-events"
  force_destroy = true
  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = false
    bytes_scanned_cutoff_per_query     = 1073741824
    result_configuration {
      output_location = "s3://${local.events_bucket}/athena/"
      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }
}

/* the Stats workflow runs its queries with the stats role: Athena in this workgroup, the table, the files, its own answers */
resource "aws_iam_role_policy" "stats_events" {
  name = "daybook-stats-events"
  role = aws_iam_role.stats.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["athena:StartQueryExecution", "athena:GetQueryExecution", "athena:GetQueryResults", "athena:StopQueryExecution", "athena:GetWorkGroup"]
        Resource = [aws_athena_workgroup.events.arn]
      },
      {
        Effect = "Allow"
        Action = ["glue:GetDatabase", "glue:GetTable", "glue:GetPartitions"]
        Resource = [
          "arn:${local.arn}:glue:${var.region}:${local.account}:catalog",
          aws_glue_catalog_database.events.arn,
          "arn:${local.arn}:glue:${var.region}:${local.account}:table/${aws_glue_catalog_database.events.name}/*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetBucketLocation", "s3:ListBucket"]
        Resource = [aws_s3_bucket.events.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.events.arn}/raw/*", "${aws_s3_bucket.events.arn}/athena/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:AbortMultipartUpload"]
        Resource = ["${aws_s3_bucket.events.arn}/athena/*"]
      },
    ]
  })
}

output "EVENTS_STREAM" {
  value = aws_kinesis_firehose_delivery_stream.events.name
}
