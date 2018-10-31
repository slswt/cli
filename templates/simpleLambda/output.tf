output "has_errors" {
  value = "${module.simple_lambda.has_errors}"
}

output "lambda_arn" {
  value = "${module.simple_lambda.lambda_arn}"
}

output "handler_entries" {
  value = "${module.simple_lambda.handler_entries}"
}
