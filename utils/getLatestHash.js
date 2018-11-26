const pkgDir = require('pkg-dir');
const { execFileSync } = require('child_process');
const parseDir = require('./parseDir');

const getLatestHash = (dirname) => {
  const path = parseDir(dirname);
  const rootDir = pkgDir.sync(path);
  const cp = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const hash = cp.toString().replace(/\s|\n\r/, '');
  return hash;
};
module.exports = getLatestHash;
