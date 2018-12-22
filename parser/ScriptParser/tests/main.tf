```
  include(
    path.join(__dirname, 'table.tf')
  );
```


module "api_gateway" {
  source = "github.com/slswt/modules//aws/services/api_gateway"
  id = "api_gateway"
}


```
if (environment === 'stage') {
  include(
    path.join(__dirname, 'domain.tf')
  );
}
const theValue = 'hi123';
insertHere(`
output "something123" {
  value = "\${theValue}"
}
`);
```


output "rest_api_id" {
  value = "${module.api_gateway.rest_api_id}"
}
output "root_resource_id" {
  value = "${module.api_gateway.root_resource_id}__${module.api_gateway.rest_api_id}"
}

output "execution_arn" {
  value = "${module.api_gateway.execution_arn}"
}

output "deployment_uri" {
  value = "${module.api_gateway.deployment_uri}"
}



```
resource("aws_route53_record", "domain_example", "name", {
  zone_id: "${aws_route53_zone.domain_example.id}",
  name: "${aws_api_gateway_domain_name.domain_api_gateway_domain.domain_name}",
  type: "A",
  alias: {
    name                   : "${aws_api_gateway_domain_name.domain_api_gateway_domain.cloudfront_domain_name}",
    zone_id                : "${aws_api_gateway_domain_name.domain_api_gateway_domain.cloudfront_zone_id}",
    evaluate_target_health : true,
  }
});
```
