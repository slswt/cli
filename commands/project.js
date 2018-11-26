const glob = require('glob');
const fs = require('fs-extra');
const {
  join, parse, dirname, relative,
} = require('path');
const get = require('lodash/get');
const identity = require('lodash/identity');
const requiredParam = require('@slswt/utils/requiredParam');
const liveTemplate = require('../utils/liveTemplate');

const getDependencies = ({ environment, content }) => {
  const dependencies = [];
  const re = /^data\s"terraform_remote_state".*\{\n((?:.*?|\n)*?)key\s*=\s*"(.+)"\n/gim;
  let res = re.exec(content);
  while (res !== null) {
    dependencies.push(
      get(res, 2, '').replace(/\$\{var\.environment\}/g, environment),
    );
    res = re.exec(content);
  }
  return dependencies.filter(identity);
};

const makeOutputs = ({ outputs, moduleName }) => outputs.reduce(
  (current, output) => `
${current}
output "${output}" {
  value = "\${module.${moduleName}.${output}}"
}
`,
  '',
);

const getLocationsFactory = ({ liveRootDir, terraformRoot }) => (
  file,
  root,
) => {
  const moduleRoot = dirname(file);
  const moduleName = parse(moduleRoot).name;

  const liveFolder = join(liveRootDir, moduleRoot.replace(root, ''));

  const keyBase = liveFolder.replace(terraformRoot, '');

  return {
    keyBase,
    moduleName,
    liveFolder,
    moduleRoot,
  };
};

const getOutputs = (str) => {
  const matches = [];
  const re = /^output\s"(\w+)".*$/gm;
  let res = re.exec(str);
  while (res !== null) {
    matches.push(get(res, 1, null));
    res = re.exec(str);
  }
  return matches.filter(identity);
};

const projectBlueprints = ({
  terraformRoot = requiredParam('terraformRoot'),
  stateBucket = requiredParam('stateBucket'),
  stateBucketRegion = requiredParam('stateBucketRegion'),
  role = requiredParam('role'),
  environment = requiredParam('env'),
}) => {
  const blueprintRootDir = join(terraformRoot, 'Blueprints');
  const liveRootDir = join(terraformRoot, 'Live');
  const environmentsRootDir = join(terraformRoot, 'Environments');

  const makeTfModule = liveTemplate({
    stateBucket,
    stateBucketRegion,
    role,
    environment,
  });

  const getLocations = getLocationsFactory({ liveRootDir, terraformRoot });

  glob.sync(join(blueprintRootDir, '**/main.tf')).forEach((file) => {
    const {
      keyBase, moduleName, liveFolder, moduleRoot,
    } = getLocations(
      file,
      blueprintRootDir,
    );
    const tfFiles = glob.sync(join(parse(file).dir, '*.tf'));
    const tfFilesContent = tfFiles.reduce(
      (content, tfFilePath) => `${content}\n${fs.readFileSync(tfFilePath)}`,
      '',
    );
    const outputs = getOutputs(tfFilesContent);
    const targetFolder = join(liveFolder, environment);
    const key = join(keyBase, environment, 'terraform.tfstate').replace(
      /^\//,
      '',
    );
    let content = makeTfModule({
      moduleName,
      moduleRoot,
      key,
      targetFolder,
      hasDefinedEnvironment: false,
    });
    content += makeOutputs({ outputs, moduleName });
    const deps = getDependencies({ environment, content: tfFilesContent });
    fs.ensureDirSync(targetFolder);
    fs.writeFileSync(join(targetFolder, 'main.tf'), content);
    fs.writeFileSync(
      join(targetFolder, 'dependencies.json'),
      JSON.stringify(deps, null, 2),
    );
  });

  glob.sync(join(environmentsRootDir, '**/main.tf')).forEach((file) => {
    const env = parse(dirname(file)).name;
    if (env !== environment) {
      return;
    }
    const {
      keyBase, moduleName, liveFolder, moduleRoot,
    } = getLocations(
      join(dirname(file), '../main.tf'),
      environmentsRootDir,
    );
    const tfFiles = glob.sync(join(parse(file).dir, '*.tf'));
    const tfFilesContent = tfFiles.reduce(
      (content, tfFilePath) => `${content}\n${fs.readFileSync(tfFilePath)}`,
      '',
    );
    const outputs = getOutputs(tfFilesContent);
    const targetFolder = join(liveFolder, env);
    const key = join(keyBase, env, 'terraform.tfstate').replace(/^\//, '');
    let content = makeTfModule({
      moduleName,
      moduleRoot: join(moduleRoot, env),
      key,
      targetFolder,
      hasDefinedEnvironment: true,
    });
    content += makeOutputs({ outputs, moduleName });
    const deps = getDependencies({ env, content: tfFilesContent });
    fs.ensureDirSync(targetFolder);
    fs.writeFileSync(join(targetFolder, 'main.tf'), content);
    fs.writeFileSync(
      join(targetFolder, 'dependencies.json'),
      JSON.stringify(deps, null, 2),
    );
  });
};

module.exports = projectBlueprints;
