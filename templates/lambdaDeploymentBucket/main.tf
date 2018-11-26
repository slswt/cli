data "aws_region" "current" {}

module "lambda_deployment_bucket" {
  source = "github.com/slswt/modules//utils/get_name"
  key = "LAMBDA_DEPLOYMENT_BUCKET"
}


resource "aws_s3_bucket" "lambda_deployment_bucket" {
  bucket = "${module.lambda_deployment_bucket.name}"
  acl    = "private"
}
