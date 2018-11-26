const crypto = require('crypto');
const getBranchName = require('./getBranchName');
const getLatestHash = require('./getLatestHash');

const md5 = (what) => crypto
  .createHash('md5')
  .update(what)
  .digest('hex');

const getReleaseInfo = (dirname) => {
  const branch = md5(getBranchName(dirname)).substr(0, 7);
  let version = branch;
  let environment = 'stage';
  if (branch === 'master') {
    version = getLatestHash(dirname);
    environment = 'prod';
  }

  /* override */
  const dirnameMatches = dirname.match(/\/(stage|prod)\//);
  if (dirnameMatches) {
    [, environment] = dirnameMatches;
  }

  return {
    version,
    environment,
  };
};
module.exports = getReleaseInfo;
