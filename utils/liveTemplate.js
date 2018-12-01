const requiredParam = require('@slswt/utils/requiredParam');

const getProviderBlock = (platform, data) => {
  if (platform === 'aws') {
    return `
provider "aws" {
  region = "${data.region}"

  assume_role {
    role_arn = "arn:aws:iam::${data.accountId}:role/${data.role}"
  }
}`;
  }
  if (platform === 'cloudflare') {
    return `
provider "cloudflare" {
  email = "${data.email}"
  token = "${data.token}"
}
    `;
  }
  return '';
};

const liveTemplate = ({
  stateBucket = requiredParam('stateBucket'),
  stateBucketRegion = requiredParam('stateBucketRegion'),
  key = requiredParam('key'),
  moduleName = requiredParam('moduleName'),
  source = requiredParam('source'),
  providers = requiredParam('providers'),
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

${Object.keys(providers)
    .map(
      (platform) => `${getProviderBlock(platform, { region, ...providers[platform] })}\n`,
    )
    .join('')}

module "${moduleName}" {
  source = "${source}"
}

`;

module.exports = liveTemplate;
