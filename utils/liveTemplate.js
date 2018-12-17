const get = require('lodash/get');
const requiredParam = require('@slswt/utils/requiredParam');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const getOutput = (sourceContent, moduleName) => {
  const re = /^output\s+"([^"]+)"\s+\{\s+value/gm;

  let match = get(re.exec(sourceContent), 1);
  const matches = [];
  while (match) {
    matches.push(match);
    match = get(re.exec(sourceContent), 1);
  }
  const hclOutputs = matches.reduce(
    (all, name) => `
${all}

output "${name}" {
  value = "\${module.${moduleName}.${name}}"
}
`,
    '',
  );
  return hclOutputs;
};

const changeModuleDirectory = (hcl, oldFolder, newFolder) => {
  const moduleSourceRe = /source\s*=\s*"([^"]+)"/g;
  return hcl.replace(moduleSourceRe, (searchValue, replaceValue) => {
    if (replaceValue.match(/^\.{1,2}\//)) {
      return searchValue;
    }

    /* replaceValue is a relative path */
    return searchValue.replace(
      replaceValue,
      path.relative(newFolder, path.join(oldFolder, replaceValue)),
    );
  });
};

const evalScripts = (sourceContent, sourceFolder, liveFolder, parsedParams) => {
  const re = /^```([^```]+)(```)/gm;
  let match = get(re.exec(sourceContent), 1);
  const matches = [];
  while (match) {
    matches.push(match);
    match = get(re.exec(sourceContent), 1);
  }
  sourceContent.match(/```(([^```]|\n)+)/g);

  const additionalContent = [];

  const evalScript = matches.join('\n');
  const sandbox = {
    ...parsedParams,
    fs,
    path,
    __dirname: sourceFolder,
    include: (fpath) => {
      const hcl = fs.readFileSync(fpath);

      const parsed = evalScript(hcl, path.parse(fpath).dir, liveFolder);

      additionalContent.push(parsed);
    },
  };
  vm.createContext(sandbox); // Contextify the sandbox.
  vm.runInContext(evalScript, sandbox);

  const stripped = sourceContent.replace(re, '');

  const hcl = `
    ${stripped}
    ${additionalContent.join('\n\n')}
  `;

  return changeModuleDirectory(hcl, sourceFolder, liveFolder);
};

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
  relativeSource = requiredParam('relativeSource'),
  sourceFolder = requiredParam('sourceFolder'),
  providers = requiredParam('providers'),
  region = requiredParam('region'),
  sourceContent = requiredParam('sourceContent'),
  liveFolder = requiredParam('liveFolder'),
  parsedParams = requiredParam('parsedParams'),
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

${evalScripts(sourceContent, sourceFolder, liveFolder, parsedParams)}

`;

module.exports = liveTemplate;
