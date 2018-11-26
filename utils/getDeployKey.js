const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join } = require('path');
const inquirer = require('inquirer');
const getReleaseInfo = require('../utils/getReleaseInfo');
const { AWS_REGIONS } = require('../constants');

const getKey = async (dirname, deployConfig, regionMaybeNull = null) => {
  const root = pkgDir.sync(dirname);

  let region = regionMaybeNull;

  const params = [
    'project',
    'platform',
    'account',
    'region',
    'environment',
    'version',
    'path',
  ];

  const slswtPath = dirname.replace(root, '').replace(/^\//, '');

  const { version, environment } = getReleaseInfo(dirname);
  const slswtRc = JSON.parse(fs.readFileSync(join(root, '.slswtrc')));
  const { awsAccountId } = JSON.parse(
    fs.readFileSync(join(root, '.slswtrc.secrets')),
  );

  if (!region) {
    const { selectedRegion } = await inquirer.prompt([
      {
        name: 'selectedRegion',
        type: 'list',
        message: 'Region where to deploy the service',
        choices: AWS_REGIONS,
      },
    ]);
    region = selectedRegion;
  }


  const keys = deployConfig({
    project: slswtRc.projectId,
    platform: 'aws',
    account: awsAccountId,
    region,
    environment,
    version,
    path: slswtPath,
  });

  return {
    ...params.reduce(
      (curr, key) => ({
        ...curr,
        [key]: keys[key] ? keys[key].toString() : '_',
      }),
      {},
    ),
    /* the path cannot be updated */
    path: slswtPath,
  };
};
module.exports = getKey;
