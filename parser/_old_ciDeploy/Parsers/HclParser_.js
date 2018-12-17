/* eslint-env jest */
const HclParser = require('./HclParser');

xtest('wef', () => {
  const parser = new HclParser();
  parser.withPrefixedResources()
});
