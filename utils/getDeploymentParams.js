const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join } = require('path');
const getReleaseInfo = require('../utils/getReleaseInfo');

const getDeploymentParams = (dirname) => {
  const root = pkgDir.sync(dirname);

  const params = [
    'project',
    'environment',
    'version',
    'path',
  ];

  const slswtPath = dirname.replace(root, '').replace(/^\//, '');

  const { version, environment } = getReleaseInfo(dirname);
  const slswtRc = JSON.parse(fs.readFileSync(join(root, '.slswtrc')));

  const keys = {
    project: slswtRc.projectId,
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
