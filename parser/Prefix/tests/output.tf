module "some_path_main_api_gateway" {
  source = "github.com/slswt/modules//aws/services/api_gateway"
  id     = "api_gateway"
}

output "some_path_main_rest_api_id" {
  value = "${module.some_path_main_api_gateway.rest_api_id}"
}

output "some_path_main_root_resource_id" {
  value = "${module.some_path_main_api_gateway.root_resource_id}__${module.some_path_main_api_gateway.rest_api_id}"
}

resource "aws_api_gateway_domain_name" "some_path_main_api_gateway_domain" {
  domain_name = "some-domain.domain.com"
}

# Example DNS record using Route53.
# Route53 is not specifically required; any DNS host can be used.
resource "aws_route53_record" "some_path_main_example" {
  zone_id = "${aws_route53_zone.some_path_main_example.id}" # See aws_route53_zone for how to create this

  name = "${aws_api_gateway_domain_name.some_path_main_api_gateway_domain.domain_name}"
  type = "A"

  alias {
    name                   = "${aws_api_gateway_domain_name.some_path_main_api_gateway_domain.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.some_path_main_api_gateway_domain.cloudfront_zone_id}"
    evaluate_target_health = true
  }
}

data "terraform_remote_state" "some_path_main_microservices_apigw" {
  backend = "s3"

  config {
    bucket = "slswt-remote-state-website-backend"
    key    = ".Live/website-backend/aws/xxx/eu-west-3/_/_/services/apigw/terraform.tfstate"
    region = "eu-central-1"
  }
}
