variable "environment" {
  description = "The deployment environment, dev, stage, prod"
}

data "external" "config" {
  program = [
    "slswtinternals",
    "cat",
    "${path.module}/config.json"
  ]
}

output "ddb_table_name_prefix" {
  value = "${data.external.config.result.projectId}-${var.environment}"
}

locals {
  s3_bucket_name_prefix = "${data.external.config.result.projectId}-${var.environment}"
}


output "s3_bucket_name_prefix" {
  value = "${local.s3_bucket_name_prefix}"
}

output "lambda_name_prefix" {
  value = "${data.external.config.result.projectId}-${var.environment}"
}

output "lambda_deployment_bucket" {
  value = "${local.s3_bucket_name_prefix}-lambda-deployments"
}
