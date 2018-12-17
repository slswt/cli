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
