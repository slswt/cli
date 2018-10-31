const camelCase = require('lodash/camelCase');

module.exports = (value) => {
  process.stdout.write(
    `${JSON.stringify(
      {
        value: camelCase(value),
      },
      null,
      2
    )}\n`
  );
};
