const { writeFileSync, ensureDirSync } = require('fs-extra');
const { join, parse } = require('path');
const inquirer = require('inquirer');

const directories = {
  Blueprints: {
    data_stores: {},
    services: {},
  },
  Environments: {
    data_stores: {},
    services: {},
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
    utils: {},
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
    .filter((cd) => {
      return !folders.find((d) => d.match(cd) && d !== cd);
    })
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
  const { remoteStateBucket, roleArn, region } = await inquirer.prompt([
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
      message: 'In which aws region would you like to houst your state files?',
      choices: [
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
      ],
    },
  ]);
  const tfFile = remoteStateConfig({ remoteStateBucket, roleArn, region });
  console.log('Will create the following config file');
  console.log(tfFile);

  console.log('Will create the following directories');
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
    writeFileSync(
      join(path, 'slswt-config.json'),
      JSON.stringify(
        {
          remoteStateBucket,
          roleArn,
          region,
        },
        null,
        2
      )
    );
  }
};

module.exports = scaffold;
