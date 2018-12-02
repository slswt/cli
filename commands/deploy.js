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

const getOutput = (sourceDirectory, moduleName) => {
  const re = /^output\s+"([^"]+)"\s+\{\s+value/gm;
  const concated = glob
    .sync(join(sourceDirectory, '*.tf'))
    .map((fpath) => `${fs.readFileSync(fpath)}\n`)
    .reduce((concatedContent, content) => `${concatedContent}\n${content}`, '');
  let match = get(re.exec(concated), 1);
  const matches = [];
  while (match) {
    matches.push(match);
    match = get(re.exec(concated), 1);
  }
  const hclOutputs = matches.reduce((all, name) => `
${all}

output "${name}" {
  value = "\${module.${moduleName}.${name}}"
}
`, '');
  return hclOutputs;
};

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

  const liveDirectory = join(root, '.Live', deployURI);
  const key = join('.Live', deployURI, `${region}.terraform.tfstate`);

  const moduleName = parse(dirname).name;

  console.log({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    moduleName,
    key,
    source: relative(liveDirectory, dirname),
  });

  const output = getOutput(dirname, moduleName);

  /* @TODO ask for which providers should be available */

  const template = liveTemplate({
    stateBucket: slswtRc.tfRemoteStateBucket,
    stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
    moduleName,
    key,
    source: relative(liveDirectory, dirname),
    region,
    providers,
    output,
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
  const rawParams = getDeploymentParams(dirname);
  fs.writeFileSync(
    join(liveDirectory, 'rawParams.json'),
    `${JSON.stringify(rawParams, null, 2)}\n`,
  );
  console.log('Run tf init and tf apply in');
  console.log(`cd ${liveDirectory}`);
};
