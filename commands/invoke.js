const fs = require('fs-extra');
const MemoryFs = require('memory-fs');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { join, parse } = require('path');
const pkgDir = require('pkg-dir');
const { execFileSync } = require('child_process');
const inquirer = require('inquirer');
const makeWebpackConfig = require('../src/buildSimpleLambda/webpack.config');

const build = (dir) => new Promise((resolve, reject) => {
  const functionName = parse(dir).name;
  const buildDir = join(dir, '.webpack');
  const projectRoot = pkgDir.sync(dir);
  const webpackEntry = join(dir, 'service.js');
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
        localInvoke: true,
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
        join(buildDir, 'service.js'),
        memFs.data[compiledFileName],
      );

      // fs.writeFileSync(
      //   join(buildDir, 'service.js'),
      // )
      // console.log(stats);

      const stringResponse = JSON.stringify(result, null, 2);
      fs.writeFileSync(outputFile, stringResponse);
      resolve();
    });
  }
  try {
    execBuild();
  } catch (err) {
    handleError(err);
  }
});

module.exports = async (dir) => {
  await build(dir);

  const servicePath = require.resolve(join(dir, '.webpack/service'));

  let choices = [];

  try {
    choices = Object.keys(require(servicePath));
    delete require.cache[servicePath];
  } catch (err) {
    // just import this to key the exported values, ignore errors
  }

  if (!choices.length) {
    console.log('No exports found');
    return;
  }

  const { entry } = await inquirer.prompt([
    {
      name: 'entry',
      type: 'list',
      message: 'Which exported function would you like to invoke?',
      choices,
    },
  ]);
  const invokeDataPath = [
    join(dir, `invoke_data.${entry}.args.js`),
    join(dir, `invoke_data/${entry}.args.js`),
  ].find((p) => fs.existsSync(p));

  const invokeEnvPath = [
    join(dir, `invoke_data.${entry}.env.js`),
    join(dir, `invoke_data/${entry}.env.js`),
  ].find((p) => fs.existsSync(p));

  let entryData = [];
  if (invokeDataPath) {
    entryData = require(invokeDataPath);
    if (!Array.isArray(entryData)) {
      throw new Error(
        'The module.exports in '
          + `invoke_data.${entry}.args.js must be an array of arguments to pass to the ${entry} function`,
      );
    }
  } else {
    fs.ensureDirSync(join(dir, 'invoke_data'));
    fs.writeFileSync(
      join(dir, 'invoke_data', `${entry}.args.js`),
      'module.exports = [];\n',
    );
  }

  if (invokeEnvPath) {
    const envs = require(invokeEnvPath);
    if (!envs || Array.isArray(envs)) {
      throw new Error(
        'The module.exports in '
          + `invoke_data.${entry}.env.js must be an object of environment variables to pass to the ${entry} function`,
      );
    }
    Object.assign(process.env, envs);
  } else {
    fs.ensureDirSync(join(dir, 'invoke_data'));
    fs.writeFileSync(
      join(dir, 'invoke_data', `${entry}.env.js`),
      'module.exports = {};\n',
    );
  }
  const result = await require(servicePath)[entry](...entryData);
  console.log(result);
};
