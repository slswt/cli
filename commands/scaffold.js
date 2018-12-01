const { writeFileSync, ensureDirSync, readFileSync } = require('fs-extra');
const { join, parse } = require('path');
const inquirer = require('inquirer');
const saveJsonFile = require('@slswt/utils/saveJsonFile');
const pkgDir = require('pkg-dir');
const parseDir = require('../utils/parseDir');
const maybeAskForData = require('../utils/maybeAskForData');
const { AWS_REGIONS } = require('../constants');

const directories = {
  Global: {
    s3: {
      remote_state: {},
    },
  },
  data_stores: {},
  services: {},
};

const { keys } = Object;

const getNewFolders = (obf, pathf) => {
  const folders = [];
  const traverse = (baseOb, basePath) => {
    keys(baseOb).forEach((folderName) => {
      const nextBasePath = join(basePath, folderName);
      folders.push(nextBasePath);
      traverse(baseOb[folderName], nextBasePath);
    });
  };
  traverse(obf, pathf);
  return folders
    .filter((cd) => !folders.find((d) => d.match(cd) && d !== cd))
    .sort();
};

const remoteStateConfig = ({
  region,
  accountId,
  role,
  tfRemoteStateBucket,
}) => `
provider "aws" {
  region = "${region}"

  assume_role {
    role_arn = "arn:aws:iam::${accountId}:role/${role}"
  }
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${tfRemoteStateBucket}"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
`;

const scaffold = async (path) => {
  const newFolders = getNewFolders(directories, path);
  const slswtConfigPath = join(path, '.slswtrc');

  const { projectId, tfRemoteStateBucket, region } = await maybeAskForData(
    slswtConfigPath,
    ['projectId', 'tfRemoteStateBucket', 'region'],
    [
      {
        name: 'projectId',
        type: 'input',
        message:
          'Enter a project specific id (will be used for your lambdas, dynamodb tables and buckets)',
      },
      {
        name: 'tfRemoteStateBucket',
        type: 'input',
        message: 'What should the name of the remote state bucket be?',
        default: `slswt-remote-state-${parse(path).name}`,
      },
      {
        name: 'region',
        type: 'list',
        message:
          'In which aws region would you like to houst your state files?',
        choices: AWS_REGIONS,
      },
    ],
  );
  const terraformRoot = pkgDir.sync(parseDir(path));
  const {
    aws: { role, accountId },
  } = JSON.parse(readFileSync(join(terraformRoot, '.slswtrc.secrets')));

  const tfFile = remoteStateConfig({
    region,
    accountId,
    role,
    tfRemoteStateBucket,
  });

  const gitignorePath = join(path, '.gitignore');
  const webpackPath = join(path, 'webpack.config.js');
  const packageJsonPath = join(path, 'package.json');

  console.log('Will create the following files');
  console.log(
    JSON.stringify([gitignorePath, webpackPath, packageJsonPath], null, 2),
  );

  console.log('Will create the following config file');
  console.log(tfFile);

  console.log('Will ensure existance of the following directories');
  console.log(JSON.stringify(newFolders, null, 2));
  const { confirmed } = await inquirer.prompt([
    {
      name: 'confirmed',
      type: 'confirm',
      message: 'Is this okey?',
    },
  ]);
  if (confirmed) {
    newFolders.forEach((folder) => {
      ensureDirSync(folder);
    });

    writeFileSync(join(path, 'Global/s3/remote_state/main.tf'), tfFile);

    saveJsonFile(slswtConfigPath, {
      projectId,
      tfRemoteStateBucket,
      tfRemoteStateBucketRegion: region,
      plugins: [],
    });

    writeFileSync(
      gitignorePath,
      readFileSync(join(__dirname, '../', 'templates/scaffold/gitignore.txt')),
    );

    writeFileSync(
      webpackPath,
      readFileSync(
        join(__dirname, '../', 'templates/scaffold/webpack.config.js'),
      ),
    );

    writeFileSync(
      packageJsonPath,
      readFileSync(join(__dirname, '../', 'templates/scaffold/package.json')),
    );

    writeFileSync(
      packageJsonPath,
      readFileSync(join(__dirname, '../', 'templates/scaffold/package.json')),
    );
  }

  console.log('Everything has been saved');
  console.log('Run:');
  console.log('eval $(assume-role [Your role here])');
  console.log(
    'yarn install && cd Global/s3/remote_state && tf init && tf apply',
  );
};

module.exports = scaffold;
