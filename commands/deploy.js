const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join, parse, relative } = require('path');
const inquirer = require('inquirer');
const confirmFileCreation = require('../utils/confirmFileCreation');
const getReleaseInfo = require('../utils/getReleaseInfo');
const liveTemplate = require('../utils/liveTemplate');
const { AWS_REGIONS } = require('../constants');
const getDeployKey = require('../utils/getDeployKey');

module.exports = async (somedir) => {
  let dirname = somedir;

  if (somedir.match(/\.Live/)) {
    const { source } = JSON.parse(
      fs.readFileSync(join(somedir, 'source.json')),
    );
    dirname = join(somedir, source);
  }

  const root = pkgDir.sync(dirname);
  const slswtRc = JSON.parse(fs.readFileSync(join(root, '.slswtrc')));
  const { roleArn } = JSON.parse(
    fs.readFileSync(join(root, '.slswtrc.secrets')),
  );
  const deployConfig = require(join(dirname, 'deploy.js'));
  const params = await getDeployKey(dirname, deployConfig);
  const {
    project,
    platform,
    account,
    region,
    environment,
    version,
    path,
  } = params;

  console.log(project, platform, account, region, environment, version, path);

  const p = join(
    project,
    platform,
    account,
    region,
    environment,
    version,
    path,
  );

  const liveDirectory = join(root, '.Live', p);
  const key = join('.Live', p, 'terraform.tfstate');
  console.log(key);

  const template = liveTemplate({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    role: roleArn,
    moduleName: parse(dirname).name,
    key,
    source: relative(liveDirectory, dirname),
    region,
  });

  const mainTf = join(liveDirectory, 'main.tf');
  const okey = await confirmFileCreation([mainTf]);
  if (!okey) {
    return;
  }
  fs.ensureDirSync(liveDirectory);
  fs.writeFileSync(mainTf, template);
  fs.writeFileSync(
    join(liveDirectory, 'source.json'),
    `${JSON.stringify(
      {
        source: relative(liveDirectory, dirname),
      },
      null,
      2,
    )}\n`,
  );
  console.log('Run tf init and tf apply in');
  console.log(`cd ${liveDirectory}`);
};
