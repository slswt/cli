module "release_info" {
  source = "github.com/slswt/modules//utils/release_info"
}

locals {
  base_variables = {
    DEPLOYMENT_ENV     = "${module.release_info.environment}"
    DEPLOYMENT_VERSION = "${module.release_info.version}"
    AWS_ACCOUNT_ID     = "${data.aws_caller_identity.current.account_id}"
    LAMBDA_NAME_PREFIX = "${module.config.lambda_name_prefix}"
    TABLE_NAME_PREFIX  = "${module.config.ddb_table_name_prefix}"
  }
}
