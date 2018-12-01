# Workflow

    .
    ├── .Live
    │   ├── {environment}
    │   │   ├── {version}
    │   │   │   ├── {account}
    │   │   │   │   ├── {region}
    │   │   │   │   │   ├── {environment}
    │   │   │   │   │   │   ├── {version}
    │   │   │   │   │   │   │   ├── {path}
    ├── data_stores
    ├── services
    ├── Global                     
    │   ├── s3
    │   │   ├── remote_state
    ├── Modules
    │   └── ...
    └── ...


### Referencing other modules
A release means that all of the services that are pushed from the Blueprints folder are prefixed with the environment+version (the tag).
On master the tag is prod+hash and on other branches it is stage+branch name. If the prefix together with the name becomes to long it will be md5 hashed.

To reference deployed modules use:
module "get_blueprint" {
  source = "github.com/slswtf/modules/utils/get_blueprint"
}
module "get_environment" {
  source = "github.com/slswtf/modules/utils/get_environment"
}

### Writing microservices
Remember that one microservice consists of multiple other resources like iam roles, sns topics etc. Put all of that together with the source code in one microservice.


### Names

  dynamodb: md5(.Live/project/platform/account/region/environment/version/path/aws_dynamodb_table/id)
  lambda: md5(.Live/project/platform/account/region/environment/version/path/aws_lambda_function/id/entry)
  appsync datasource name: md5(.Live/project/platform/account/region/environment/version/path/md5(jsonencode(var.fields)))


### Deployment params
 * `project`: Your project id
 * `platform`: The platform deploying to
 * `account`: 
 * `region`: 
 * `environment`: 
 * `version`: 
 * `path`: 
