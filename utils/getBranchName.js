const pkgDir = require('pkg-dir');
const { execFileSync } = require('child_process');
const parseDir = require('./parseDir');

const getBranchName = (dirname) => {
  const path = parseDir(dirname);
  const rootDir = pkgDir.sync(path);
  const cp = execFileSync('git', ['branch'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const matches = cp.toString().match(/\*\s.+$/gm);
  const branchName = matches[0].slice(2);
  return branchName;
};

module.exports = getBranchName;
