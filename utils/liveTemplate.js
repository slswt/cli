const requiredParam = require('@slswt/utils/requiredParam');

const liveTemplate = ({
  stateBucket = requiredParam('stateBucket'),
  stateBucketRegion = requiredParam('stateBucketRegion'),
  role = requiredParam('role'),
  key = requiredParam('key'),
  moduleName = requiredParam('moduleName'),
  source = requiredParam('source'),
  region = requiredParam('region'),
}) => `
terraform {
  required_version = "> 0.11.0"

  backend "s3" {
    bucket  = "${stateBucket}"
    key     = "${key}"
    region  = "${stateBucketRegion}"
    encrypt = true
  }
}

provider "aws" {
  region = "${region}"

  assume_role {
    role_arn = "${role}"
  }
}

module "${moduleName}" {
  source = "${source}"
}

`;

module.exports = liveTemplate;
