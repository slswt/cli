resource "aws_api_gateway_domain_name" "api_gateway_domain" {
  domain_name = "kyc-stage.redeye.se"
}

# Example DNS record using Route53.
# Route53 is not specifically required; any DNS host can be used.
resource "aws_route53_record" "example" {
  zone_id = "${aws_route53_zone.example.id}" # See aws_route53_zone for how to create this

  name = "${aws_api_gateway_domain_name.api_gateway_domain.domain_name}"
  type = "A"

  alias {
    name                   = "${aws_api_gateway_domain_name.api_gateway_domain.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.api_gateway_domain.cloudfront_zone_id}"
    evaluate_target_health = true
  }
}

