/* eslint-disable import/no-dynamic-require, global-require */
const { join } = require('path');

const readServiceParseDeploymentParams = (deploymentFolderPath, params) => {
  try {
    const parse = require(join(
      deploymentFolderPath,
      'parseDeploymentParams.js',
    ));
    return parse(params);
  } catch (err) {
    return params;
  }
};

module.exports = readServiceParseDeploymentParams;
