const requiredParam = require('@slswt/utils/requiredParam');
const parseDir = require('../../utils/parseDir');
const Package = require('./src/Package/index');

const build = async ({
  liveFolder = requiredParam('liveFolder'),
  service = requiredParam('service'),
  id = requiredParam('id'),
}) => {
  const pkg = new Package({
    liveFolder: parseDir(liveFolder),
    service,
    id,
  });
  pkg.initFolderStructure();
  await pkg.build();
  pkg.print();
};

module.exports = build;
