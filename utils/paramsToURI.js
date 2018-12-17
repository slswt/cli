const { join } = require('path');

const keys = ['project', 'environment', 'version'];

const paramsToURI = (params) => join(
  ...keys.map((key) => (params[key] ? params[key].toString() : '_')),
  /* the path cannot be updated */
  params.path,
);

module.exports = paramsToURI;
