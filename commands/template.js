const inquirer = require('inquirer');
const { join, relative } = require('path');
const fs = require('fs-extra');
const template = require('lodash/template');
const pkgDir = require('pkg-dir');
const evalTemplate = require('../utils/evalTemplate');
const confirmFileCreation = require('../utils/confirmFileCreation');
const glob = require('glob');

const SIMPLE_LAMBDA = 'Simple lambda';
const SECRETS_BUCKET = 'Secrets bucket';
const choices = [SIMPLE_LAMBDA, SECRETS_BUCKET];

module.exports = async (dir) => {
  const { templateName } = await inquirer.prompt([
    {
      name: 'templateName',
      type: 'list',
      message: 'Which template would you like to use?',
      choices,
    },
  ]);

  if (templateName === SIMPLE_LAMBDA) {
    await makeTemplateFolder({
      dir,
      templateFolder: 'simpleLambda',
      templateParams: {
        lambdaPath: dir.replace(/.*\/microservices\//, ''),
        configPath: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/config')
        ),
        microservicesEnv: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/microservices_env')
        ),
      },
    });
  } else if (templateName === SECRETS_BUCKET) {
    await makeTemplateFolder({
      dir,
      templateFolder: 'secretsBucket',
      templateParams: {
        lambdaPath: dir.replace(/.*\/microservices\//, ''),
        configPath: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/config')
        ),
        microservicesEnv: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/microservices_env')
        ),
      },
    });
    fs.ensureDirSync(join(dir, 'secret_files'))
  }
};
