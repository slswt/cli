variable "environment" {}

module "config" {
  source      = "<%= configPath %>"
  environment = "${var.environment}"
}

resource "aws_s3_bucket" "lambda_deployment_bucket" {
  bucket = "${module.config.lambda_deployment_bucket}"
}
