const inquirer = require('inquirer');
const { join, relative, parse } = require('path');
const fs = require('fs-extra');
const pkgDir = require('pkg-dir');

const makeTemplateFolder = require('../utils/makeTemplateFolder');

const SIMPLE_LAMBDA = 'Simple lambda';
const SECRETS_BUCKET = 'Secrets bucket';
const LAMBDA_DEPLOYMENT_BUCKET = 'Lambda deployment bucket';
const SIMPLE_TABLE = 'Simpl ddb table';
const choices = [
  SIMPLE_LAMBDA,
  SECRETS_BUCKET,
  SIMPLE_TABLE,
  LAMBDA_DEPLOYMENT_BUCKET,
];

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
    if (!dir.match('/microservices/')) {
      console.log(
        'This template can only be used inside the services/microservices of Environments or Blueprints',
      );
      return;
    }
    await makeTemplateFolder({
      dir,
      templateFolder: 'simpleLambda',
      templateParams: {
        lambdaPath: dir.replace(/.*\/microservices\//, ''),
        configPath: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/config'),
        ),
        microservicesEnv: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/microservices_env'),
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
          join(pkgDir.sync(dir), 'Modules/utils/config'),
        ),
        microservicesEnv: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/microservices_env'),
        ),
      },
    });
    fs.ensureDirSync(join(dir, 'secret_files'));
  } else if (templateName === SIMPLE_TABLE) {
    await makeTemplateFolder({
      dir,
      templateFolder: 'simpleTable',
      templateParams: {
        tableName: parse(dir).name,
        configPath: relative(
          dir,
          join(pkgDir.sync(dir), 'Modules/utils/config'),
        ),
      },
    });
  } else if (templateName === LAMBDA_DEPLOYMENT_BUCKET) {
    await makeTemplateFolder({
      dir,
      templateFolder: 'lambdaDeploymentBucket',
      templateParams: {},
    });
  }
};
