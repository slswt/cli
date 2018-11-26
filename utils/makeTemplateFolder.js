const template = require('lodash/template');
const fs = require('fs-extra');
const { join, relative } = require('path');
const glob = require('glob');
const evalTemplate = require('../utils/evalTemplate');
const confirmFileCreation = require('../utils/confirmFileCreation');

module.exports = async ({ dir, templateFolder, templateParams }) => {


  const templatesRootFolder = join(
    __dirname,
    '../',
    'templates',
    templateFolder,
  );
  const globPattern = join(templatesRootFolder, '**/*');
  const sourceFiles = glob.sync(globPattern);

  const newFiles = sourceFiles.map((templateFile) => ({
    src: templateFile,
    dest: join(dir, relative(templatesRootFolder, templateFile)),
  }));

  const confirmed = await confirmFileCreation(newFiles.map(({ dest }) => dest));

  if (confirmed) {
    newFiles.forEach(({ src, dest }) => {
      const content = evalTemplate(src, templateParams);
      fs.writeFileSync(dest, content);
    });
  }
};
