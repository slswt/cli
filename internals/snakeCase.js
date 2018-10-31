const snakeCase = require('lodash/snakeCase');

module.exports = (value) => {
  process.stdout.write(
    `${JSON.stringify(
      {
        value: snakeCase(value),
      },
      null,
      2
    )}\n`
  );
};
