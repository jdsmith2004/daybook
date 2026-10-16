/* ---------- the records: one table, one partition per person ----------
   pk = the person's Cognito id, sk = the record id (settings, days/YYYY-MM-DD, reviews/wN).
   u = when the person changed it, s = when the server saved it; the by_s index answers "what changed since". */
resource "aws_dynamodb_table" "records" {
  name                        = "daybook-records"
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
  attribute {
    name = "s"
    type = "N"
  }

  local_secondary_index {
    name            = "by_s"
    range_key       = "s"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  # only the server's own daily allowance records carry a ttl; a person's records never expire
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
