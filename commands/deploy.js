const pkgDir = require('pkg-dir');
const fs = require('fs-extra');
const { join, parse, relative } = require('path');
const confirmFileCreation = require('../utils/confirmFileCreation');
const liveTemplate = require('../utils/liveTemplate');
const askForRegion = require('../utils/askForRegion');
const getDeployURI = require('../utils/getDeployURI');
const getDeploymentParams = require('../utils/getDeploymentParams');
const getParamsFromLiveFolderPath = require('../utils/getParamsFromLiveFolderPath');

module.exports = async (somedir) => {
  let dirname = somedir;

  let region;

  if (somedir.match(/\.Live/)) {
    const { source } = JSON.parse(
      fs.readFileSync(join(somedir, 'source.json')),
    );
    dirname = join(somedir, source);
    ({ region } = getParamsFromLiveFolderPath(somedir));
  }

  if (!region) {
    region = await askForRegion();
  }

  const root = pkgDir.sync(dirname);
  const slswtRc = JSON.parse(fs.readFileSync(join(root, '.slswtrc')));
  const { role, accountId } = JSON.parse(
    fs.readFileSync(join(root, '.slswtrc.secrets')),
  );
  const roleArn = `arn:aws:iam::${accountId}:role/${role}`;

  const deployURI = getDeployURI(dirname, region);

  const liveDirectory = join(root, '.Live', deployURI);
  const key = join('.Live', deployURI, 'terraform.tfstate');

  console.log({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    role: roleArn,
    moduleName: parse(dirname).name,
    key,
    source: relative(liveDirectory, dirname),
    region,
  });
  const template = liveTemplate({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    role: roleArn,
    moduleName: parse(dirname).name,
    key,
    source: relative(liveDirectory, dirname),
    region,
  });
  console.log(template);

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
  const params = getDeploymentParams(dirname, region);
  fs.writeFileSync(
    join(liveDirectory, 'params.json'),
    `${JSON.stringify(params, null, 2)}\n`,
  );
  console.log('Run tf init and tf apply in');
  console.log(`cd ${liveDirectory}`);
};
