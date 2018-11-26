# Workflow

    .
    ├── .Live                    # The latest deployed files
    │   ├── {environment}
    │   │   ├── {version}
    ├── Blueprints               # Anything in the Blueprints will be released under new tag every time * (1)
    │   ├── data_stores          # Rarely used, if you want a new data store for each release (be aware of account limitations e.g. max 100 s3 buckets)
    │   ├── services             # Keep services, like iam, apigw, appsync etc here.
    │   │   ├── microservices    # Put your microservices here. The paths used in the lambda functions will be relative to the microservices folder * (2)
    ├── Environments             # This is where you keep items which should be persisted across releases and that should not be replicated * (3)
    │   ├── stage
    │   │   ├── data_stores      # Like aurora or elastic search
    │   │   ├── services         # Keep services, like iam, apigw, appsync etc here.
    │   ├── prod
    │   │   ├── data_stores      # Like aurora or elastic search
    │   │   ├── services         # Keep services, like iam, apigw, appsync etc here.
    ├── Global                     
    │   ├── s3
    │   │   ├── remote_state     # This folder contains the terraform state
    ├── Modules                  # Own Modules that you can re-use
    │   └── ...                  # etc.
    └── ...

*
  1. The blueprints folder will get new release tag on every commit in master and on every new branch (when running swt deploy)
  2. As all the microservices lies here you can reference them by absolute path relative to the microservices folder.
  3. Extra care should be taken when handling these modules. Deleting a folder does not mean that the resources is deleted. Deploy with care.

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

  dynamodb: md5(.Live/project/platform/account/region/environment/version/path)
  lambda: md5(.Live/project/platform/account/region/environment/version/path/service_without_extension.entry)
  appsync datasource name: md5(.Live/project/platform/account/region/environment/version/path/md5(jsonencode(var.fields)))

# Params:
  project,
  platform,
  account,
  region,
  environment,
  version,
  path,

The path cannot be updated through the deploy.js file.


Stage is whenever not on master or there is a folder called stage in the path
Prod is whenever on master or there is a folder called prod in the path
