const get = require('lodash/get');
const requiredParam = require('@slswt/utils/requiredParam');

module.exports = (stats = requiredParam('stats'), entry = requiredParam('entry')) => get(
  stats.chunks[0].modules.find(({ reasons: [{ type, userRequest }] }) => type === 'single entry' && userRequest === entry),
  'providedExports',
) || [];
