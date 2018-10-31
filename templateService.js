const inquirer = require('inquirer');
const { join, relative } = require('path');
const fs = require('fs');
const confirmFileCreation = require('./confirmFileCreation');
const template = require('lodash/template');
const evalTemplate = require('./utils/evalTemplate');
const pkgDir = require('pkg-dir');

const SIMPLE_LAMBDA = 'Simple lambda';
const choices = [SIMPLE_LAMBDA];

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
        'This template can only be used inside the services/microservices of Environments or Blueprints'
      );
      return;
    }

    const mainTfPath = join(dir, 'main.tf');
    const outputTfPath = join(dir, 'output.tf');
    const serviceJsPath = join(dir, 'service.js');

    const confirmed = await confirmFileCreation([
      mainTfPath,
      outputTfPath,
      serviceJsPath,
    ]);

    if (confirmed) {
      const lambdaPath = dir.replace(/.*\/microservices\//, '');
      const mainTfContent = evalTemplate(
        join(__dirname, 'templates/simpleLambda/main.tf'),
        {
          lambdaPath,
          configPath: relative(
            dir,
            join(pkgDir.sync(dir), 'Modules/utils/config')
          ),
          microservicesEnv: relative(
            dir,
            join(pkgDir.sync(dir), 'Modules/utils/microservices_env')
          ),
        }
      );
      fs.writeFileSync(mainTfPath, mainTfContent);
      fs.writeFileSync(
        outputTfPath,
        fs.readFileSync(join(__dirname, 'templates/simpleLambda/output.tf'))
      );
      fs.writeFileSync(
        serviceJsPath,
        fs.readFileSync(join(__dirname, 'templates/simpleLambda/service.js'))
      );
    }
  }
};
