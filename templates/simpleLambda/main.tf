variable "environment" {
  description = "The deployment environment"
}

module "config" {
  source      = "<%= configPath %>"
  environment = "${var.environment}"
}

module "microservices_env" {
  source      = "<%= microservicesEnv %>"
  environment = "${var.environment}"
}

module "simple_lambda" {
  source                   = "github.com/slswt/modules//services/lambda/simple_lambda"
  environment              = "${var.environment}"
  lambda_path              = "<%= lambdaPath %>"
  service                  = "./service.js"
  module_path              = "${path.module}"
  handler_entries          = ["invoke"]
  lambda_deployment_bucket = "${module.config.lambda_deployment_bucket}"
  lambda_name_prefix       = "${module.config.lambda_name_prefix}"
  lambda_environment       = "${module.microservices_env.lambda_environment}"
}
