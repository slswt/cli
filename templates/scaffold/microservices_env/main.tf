module "config" {
  source      = "../config"
  environment = "${var.environment}"
}

locals {
  base_variables = {
    DEPLOYMENT_ENV     = "${var.environment}"
    AWS_ACCOUNT_ID     = "${data.aws_caller_identity.current.account_id}"
    LAMBDA_NAME_PREFIX = "${module.config.lambda_name_prefix}"
    TABLE_NAME_PREFIX  = "${module.config.ddb_table_name_prefix}"
  }
}
