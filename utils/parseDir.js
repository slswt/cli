const { join } = require('path');

const parseDir = (rawDir) => {
  const dir = rawDir || '.';
  if (dir[0] === '.') {
    return join(process.cwd(), dir);
  }
  return dir;
};
module.exports = parseDir;
