const {
  writeFileSync,
  ensureDirSync,
  readFileSync,
  existsSync,
  copySync,
} = require('fs-extra');
const { join, parse, relative } = require('path');
const inquirer = require('inquirer');
const saveJsonFile = require('@slswt/utils/saveJsonFile');
const pkgDir = require('pkg-dir');
const maybeAskForData = require('./scaffold/maybeAskForData');
const evalTemplate = require('./utils/evalTemplate');

const directories = {
  Blueprints: {
    data_stores: {},
    services: {
      microservices: {},
    },
  },
  Environments: {
    data_stores: {},
    services: {
      microservices: {},
    },
  },
  Global: {
    s3: {
      remote_state: {},
    },
  },
  Live: {
    data_stores: {},
    services: {},
  },
  Modules: {
    data_stores: {},
    services: {},
    utils: {
      config: {},
    },
  },
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

const remoteStateConfig = ({ region, roleArn, remoteStateBucket }) => `
provider "aws" {
  region = "${region}"

  assume_role {
    role_arn = "${roleArn}"
  }
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${remoteStateBucket}"

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
  const regions = [
    'us-west-2',
    'us-west-1',
    'us-east-2',
    'us-east-1',
    'ap-sou',
    'ap-nor',
    'ap-sou',
    'ap-sou',
    'ap-nor',
    'ca-central-1',
    'cn-nor',
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'sa-east-1',
  ];

  const slswtConfigPath = join(path, 'slswt-remote-config.json');

  const { remoteStateBucket, roleArn, region } = await maybeAskForData(
    slswtConfigPath,
    ['remoteStateBucket', 'roleArn', 'region'],
    [
      {
        name: 'remoteStateBucket',
        type: 'input',
        message: 'What should the name of the remote state bucket be?',
        default: `slswt-remote-state-${parse(path).name}`,
      },
      {
        name: 'roleArn',
        type: 'input',
        message:
          'Which aws role are you assuming (arn:aws:iam::xxxxxxxxxxxx:role/YourRole)?',
      },
      {
        name: 'region',
        type: 'list',
        message:
          'In which aws region would you like to houst your state files?',
        choices: regions,
      },
    ],
  );

  const tfFile = remoteStateConfig({ remoteStateBucket, roleArn, region });

  const gitignorePath = join(path, '.gitignore');
  const webpackPath = join(path, 'webpack.config.js');
  const packageJsonPath = join(path, 'package.json');
  const configRoot = join(path, 'Modules/utils/config');
  const configPaths = [
    {
      outpath: join(configRoot, 'config.json'),
      template: join(__dirname, 'templates/scaffold/config/config.json'),
    },
    {
      outpath: join(configRoot, 'main.tf'),
      template: join(__dirname, 'templates/scaffold/config/main.tf'),
    },
  ];

  const { projectId } = await maybeAskForData(
    configPaths[1].outpath,
    ['projectId'],
    [
      {
        name: 'projectId',
        type: 'input',
        message:
          'Enter a project specific id (will be used for your lambdas, dynamodb tables and buckets)',
      },
    ],
  );

  console.log('Will create the following files');
  console.log(
    JSON.stringify(
      [
        gitignorePath,
        webpackPath,
        packageJsonPath,
        ...configPaths.map(({ outpath }) => outpath),
      ],
      null,
      2,
    ),
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
      remoteStateBucket,
      roleArn,
      region,
    });

    writeFileSync(
      gitignorePath,
      readFileSync(join(__dirname, 'templates/scaffold/gitignore.txt')),
    );
    writeFileSync(
      webpackPath,
      readFileSync(join(__dirname, 'templates/scaffold/webpack.config.js')),
    );
    writeFileSync(
      packageJsonPath,
      readFileSync(join(__dirname, 'templates/scaffold/package.json')),
    );

    writeFileSync(
      packageJsonPath,
      readFileSync(join(__dirname, 'templates/scaffold/package.json')),
    );

    configPaths.forEach(({ outpath, template }) => {
      writeFileSync(
        outpath,
        evalTemplate(template, {
          projectId,
        }),
      );
    });

    copySync(
      join(__dirname, 'templates/scaffold/microservices_env'),
      join(path, 'Modules/utils/microservices_env'),
      {
        overwrite: false,
      },
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
