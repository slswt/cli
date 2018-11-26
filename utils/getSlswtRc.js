const pkgDir = require('pkg-dir');
const fs = require('fs');
const { join } = require('path');
const parseDir = require('./parseDir');

module.exports = (dir) => {
  const terraformRoot = pkgDir.sync(parseDir(dir));
  return JSON.parse(
    fs.readFileSync(join(terraformRoot, '.slswtrc')),
  );
};
