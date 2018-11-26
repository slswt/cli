
module "config" {
  source      = "<%= configPath %>"
}

module "microservices_env" {
  source      = "<%= microservicesEnv %>"
}

module "simple_lambda" {
  source                   = "github.com/slswt/modules//services/lambda/simple_lambda"
  lambda_path              = "<%= lambdaPath %>"
  service                  = "./service.js"
  module_path              = "${path.module}"
  handler_entries          = ["invoke"]
  lambda_name_prefix       = "${module.config.lambda_name_prefix}"
  lambda_environment       = "${module.microservices_env.lambda_environment}"
}
