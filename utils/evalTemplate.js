const template = require('lodash/template');
const fs = require('fs');

module.exports = (path, args) => {
  return template(
    fs.readFileSync(path),
    {
      interpolate: /<%=([\s\S]+?)%>/g,
    }
  )(args);
}
