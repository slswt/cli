const fs = require('fs-extra');
const identity = require('lodash/identity');
const MemoryFs = require('memory-fs');
const webpack = require('webpack');
const get = require('lodash/get');
const nodeExternals = require('webpack-node-externals');
const { join, parse } = require('path');
const pkgDir = require('pkg-dir');
const { execFileSync } = require('child_process');
const inquirer = require('inquirer');
const getExportsFromWebpackEntryInStats = require('../utils/getExportsFromWebpackEntryInStats');
const makeWebpackConfig = require('../src/buildSimpleLambda/src/webpack.config');
const getDeployKey = require('../utils/getDeployKey');

const getEnv = ({
  project,
  platform,
  account,
  region,
  environment,
  version,
  path,
  dir,
}) => ({
  SLSWT_LOCAL_INVOKE: true,
  dir,
  root: pkgDir.sync(dir),
  project,
  platform,
  account,
  region,
  environment,
  version,
  path,
});

const build = (
  webpackEntry,
  {
    project, platform, account, region, environment, version, path,
  },
) => new Promise((resolve, reject) => {
  const { dir } = parse(webpackEntry);
  const functionName = parse(dir).name;
  const buildDir = join(dir, '.webpack', parse(webpackEntry).name);
  const projectRoot = pkgDir.sync(dir);
  const debugFile = join(buildDir, 'debug.json');
  const outputFile = join(buildDir, 'output.json');

  fs.ensureDirSync(buildDir);

  fs.writeFileSync(
    join(buildDir, 'input.json'),
    JSON.stringify(
      {
        functionName,
        buildDir,
        projectRoot,
        webpackEntry,
        debugFile,
        outputFile,
      },
      null,
      2,
    ),
  );

  const result = {
    hasErrors: 'nope',
    buildDir,
  };
  fs.writeFileSync(debugFile, 'No errors');

  const handleError = (err) => {
    fs.writeFileSync(debugFile, `${err.stack || err}`);
    result.hasErrors = 'There were some build errors, check the .webpack folder';
    console.log(JSON.stringify(result, null, 2));
    reject();
  };

  function execBuild() {
    const memFs = new MemoryFs();
    const compiler = webpack(
      makeWebpackConfig({
        entry: webpackEntry,
        projectRoot,
        bundleDeps: false,
      }),
    );
    compiler.outputFileSystem = memFs;

    const getHash = (fname) => fname.match(/^(\w|\d)+\./)[0].slice(0, -1);

    compiler.run((err, stats) => {
      const statsFile = join(buildDir, 'webpack_stats.json');
      const cliOutputFile = join(buildDir, 'webpack_output.log');
      const errFile = join(buildDir, 'webpack_errors.json');
      const jsonStats = stats.toJson();
      if (err || stats.hasErrors()) {
        fs.writeFileSync(errFile, err);
        result.hasErrors += `There were some errors, please check ${errFile} and ${statsFile}\n`;
      }
      fs.writeFileSync(statsFile, JSON.stringify(jsonStats, null, 2));
      fs.writeFileSync(cliOutputFile, stats);

      /* The stats correpond to analyzeDeps, but the saved file is form noDeps */
      const compiledFileName = Object.keys(memFs.data)[0];
      result.fileHash = getHash(compiledFileName);

      /* save service entry file to disk */
      fs.writeFileSync(
        join(buildDir, parse(webpackEntry).base),
        memFs.data[compiledFileName],
      );

      // fs.writeFileSync(
      //   join(buildDir, 'service.js'),
      // )
      // console.log(stats);

      const stringResponse = JSON.stringify(result, null, 2);
      fs.writeFileSync(outputFile, stringResponse);
      resolve({ stats: jsonStats, entry: webpackEntry });
    });
  }
  try {
    return execBuild();
  } catch (err) {
    handleError(err);
  }
});

module.exports = async (webpackEntry) => {
  const { dir, name } = parse(webpackEntry);
  const params = await getDeployKey(dir, identity);
  const { stats, entry } = await build(webpackEntry, params);

  const compiledServicePath = require.resolve(join(dir, '.webpack', name));

  const choices = getExportsFromWebpackEntryInStats(stats, entry);

  if (!choices.length) {
    console.log('No exports found');
    return;
  }

  const { funcName } = await inquirer.prompt([
    {
      name: 'funcName',
      type: 'list',
      message: 'Which exported function would you like to invoke?',
      choices,
    },
  ]);
  const invokeDataPath = [
    join(dir, `invoke_data.${name}.${funcName}.args.js`),
    join(dir, 'invoke_data', name, `${funcName}.args.js`),
  ].find((p) => fs.existsSync(p));

  const invokeEnvPath = [
    join(dir, `invoke_data.${name}.${funcName}.env.js`),
    join(dir, 'invoke_data', name, `${funcName}.env.js`),
  ].find((p) => fs.existsSync(p));

  let funcData = [];
  if (invokeDataPath) {
    funcData = require(invokeDataPath);
    if (!Array.isArray(funcData)) {
      throw new Error(
        'The module.exports in '
          + `invoke_data.${name}.${funcName}.args.js must be an array of arguments to pass to the ${funcName} function`,
      );
    }
  } else {
    fs.ensureDirSync(join(dir, 'invoke_data', name));
    fs.writeFileSync(
      join(dir, 'invoke_data', name, `${funcName}.args.js`),
      'module.exports = [];\n',
    );
  }

  if (invokeEnvPath) {
    const envs = require(invokeEnvPath);
    if (!envs || Array.isArray(envs)) {
      throw new Error(
        'The module.exports in '
          + `invoke_data.${funcName}.env.js must be an object of environment variables to pass to the ${funcName} function`,
      );
    }
    Object.assign(
      process.env,
      getEnv({
        ...params,
        dir,
      }),
      params,
      envs,
    );
  } else {
    fs.ensureDirSync(join(dir, 'invoke_data', name));
    fs.writeFileSync(
      join(dir, 'invoke_data', name, `${funcName}.env.js`),
      'module.exports = {};\n',
    );
  }
  const result = await require(compiledServicePath)[funcName](...funcData);
  console.log(result);
};
