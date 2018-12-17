const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join } = require('path');
const requiredParam = require('@slswt/utils/requiredParam');
const getReleaseInfo = require('../utils/getReleaseInfo');

const getDeploymentParams = (liveFolder = requiredParam('liveFolder')) => {
  const root = pkgDir.sync(liveFolder);

  const params = ['project', 'environment', 'version', 'path'];

  const slswtPath = liveFolder.replace(root, '').replace(/^\//, '');

  const { version, environment } = getReleaseInfo(liveFolder);
  const slswtRc = JSON.parse(fs.readFileSync(join(root, '.slswtrc')));

  const keys = {
    project: slswtRc.projectId,
    environment,
    version,
    path: slswtPath,
  };

  return params.reduce(
    (curr, key) => ({
      ...curr,
      [key]: keys[key] ? keys[key].toString() : '_',
    }),
    {},
  );
};

module.exports = getDeploymentParams;
