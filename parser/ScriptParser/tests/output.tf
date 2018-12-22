


module "main_api_gateway" {
  source = "github.com/slswt/modules//aws/services/api_gateway"
  id = "api_gateway"
}



output "something123" {
  value = "${theValue}"
}



output "main_rest_api_id" {
  value = "${module.main_api_gateway.rest_api_id}"
}
output "main_root_resource_id" {
  value = "${module.main_api_gateway.root_resource_id}__${module.main_api_gateway.rest_api_id}"
}

output "main_execution_arn" {
  value = "${module.main_api_gateway.execution_arn}"
}

output "main_deployment_uri" {
  value = "${module.main_api_gateway.deployment_uri}"
}



resource "aws_route53_record" "domain_example" {
      zone_id = "${aws_route53_zone.domain_example.id}"
name = "wefwef-245dd4"
type = "A"
alias = {
      name = "${aws_api_gateway_domain_name.domain_api_gateway_domain.cloudfront_domain_name}"
zone_id = "${aws_api_gateway_domain_name.domain_api_gateway_domain.cloudfront_zone_id}"
evaluate_target_health = {
      
    }
    }
    }
module "table_table" {
  source         = "github.com/slswt/modules//data_stores/ddb/simple_table"
  read_capacity  = 3
  write_capacity = 3
}

module "table_analytics_table" {
  source         = "github.com/slswt/modules//data_stores/ddb/simple_table"
  read_capacity  = 3
  write_capacity = 3
  id             = "analytics_table"
}

resource "aws_api_gateway_domain_name" "domain_api_gateway_domain" {
  domain_name = "kyc-stage.redeye.se"
}

# Example DNS record using Route53.
# Route53 is not specifically required; any DNS host can be used.
resource "aws_route53_record" "domain_example" {
  zone_id = "${aws_route53_zone.domain_example.id}" # See aws_route53_zone for how to create this

  name = "${aws_api_gateway_domain_name.domain_api_gateway_domain.domain_name}"
  type = "A"

  alias {
    name                   = "${aws_api_gateway_domain_name.domain_api_gateway_domain.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.domain_api_gateway_domain.cloudfront_zone_id}"
    evaluate_target_health = true
  }
}

