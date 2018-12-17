const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join } = require('path');
const getReleaseInfo = require('../utils/getReleaseInfo');
const readServiceParseDeploymentParams = require('../utils/readServiceParseDeploymentParams');

const getDeployURI = (dirname) => {
  const root = pkgDir.sync(dirname);

  const params = ['project', 'environment', 'version', 'path'];

  const slswtPath = dirname.replace(root, '').replace(/^\//, '');

  const { version, environment } = getReleaseInfo(dirname);
  const slswtRc = JSON.parse(fs.readFileSync(join(root, '.slswtrc')));

  const keys = readServiceParseDeploymentParams(dirname, {
    project: slswtRc.projectId,
    environment,
    version,
    path: slswtPath,
  });

  return join(...params.map((key) => (keys[key] ? keys[key].toString() : '_')));
};
module.exports = getDeployURI;
