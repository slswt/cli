const pkgDir = require('pkg-dir');
const get = require('lodash/get');
const fs = require('fs-extra');
const glob = require('glob');
const { join, parse, relative } = require('path');
const confirmFileCreation = require('../utils/confirmFileCreation');
const liveTemplate = require('../utils/liveTemplate');
const askForRegion = require('../utils/askForRegion');
const getDeployURI = require('../utils/getDeployURI');
const getDeploymentParams = require('../utils/getDeploymentParams');
const readServiceParseDeploymentParams = require('../utils/readServiceParseDeploymentParams');

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
  const providers = JSON.parse(fs.readFileSync(join(root, '.slswtrc.secrets')));

  const deployURI = getDeployURI(dirname);

  const region = await askForRegion();

  const liveFolder = join(root, '.Live', deployURI);
  const key = join('.Live', deployURI, `${region}.terraform.tfstate`);

  const moduleName = parse(dirname).name;
  const rawParams = getDeploymentParams(dirname);
  const parsedParams = readServiceParseDeploymentParams(dirname, rawParams);

  console.log({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    moduleName,
    key,
    source: relative(liveFolder, dirname),
  });

  /* @TODO ask for which providers should be available */

  const template = liveTemplate({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    moduleName,
    key,
    relativeSource: relative(liveFolder, dirname),
    liveFolder,
    sourceFolder: dirname,
    region,
    providers,
    parsedParams,
    sourceContent: fs.readFileSync(join(liveFolder, 'main.tf')),
  });
  console.log(template);

  const mainTf = join(liveFolder, 'main.tf');
  const okey = await confirmFileCreation([mainTf]);
  if (!okey) {
    return;
  }
  fs.ensureDirSync(liveFolder);
  fs.writeFileSync(mainTf, template);
  fs.writeFileSync(
    join(liveFolder, 'source.json'),
    `${JSON.stringify(
      {
        source: relative(liveFolder, dirname),
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    join(liveFolder, 'rawParams.json'),
    `${JSON.stringify(rawParams, null, 2)}\n`,
  );
  console.log('Run tf init and tf apply in');
  console.log(`cd ${liveFolder}`);
};
