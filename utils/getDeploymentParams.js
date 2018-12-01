const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join } = require('path');
const requiredParam = require('@slswt/utils/requiredParam');
const getReleaseInfo = require('../utils/getReleaseInfo');

const getDeploymentParams = (dirname, region) => {
  const root = pkgDir.sync(dirname);

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
  const { accountId = requiredParam('accountId') } = JSON.parse(
    fs.readFileSync(join(root, '.slswtrc.secrets')),
  );

  const keys = {
    project: slswtRc.projectId,
    platform: 'aws',
    account: accountId,
    region,
    environment,
    version,
    path: slswtPath,
  };

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

module.exports = getDeploymentParams;
