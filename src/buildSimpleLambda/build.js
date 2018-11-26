const crypto = require('crypto');
const AdmZip = require('adm-zip');
const identity = require('lodash/identity');
const fs = require('fs-extra');
const MemoryFs = require('memory-fs');
const webpack = require('webpack');
const { join, parse } = require('path');
const pkgDir = require('pkg-dir');
const requiredParam = require('@slswt/utils/requiredParam');
const kebabCase = require('lodash/kebabCase');
const getExportsFromWebpackEntryInStats = require('../../utils/getExportsFromWebpackEntryInStats');
const getDeployKey = require('../../utils/getDeployKey');
const makeWebpackConfig = require('./src/webpack.config');
const removeDevDeps = require('./removeDevDeps');
const { LAMBDA_DEPLOYMENT_BUCKET } = require('../../naming');

const md5 = (what) => crypto
  .createHash('md5')
  .update(what)
  .digest('hex');

const build = async ({
  liveFolder = requiredParam('liveFolder'),
  service = requiredParam('service'),
}) => {
  /* under which circumstances was this service deployed? */
  const [,
    project,
    platform,
    account,
    region,
    environment,
    version,
    path,
  ] = liveFolder.match(
    /\.Live\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
  );

  const inputData = `${JSON.stringify(
    {
      liveFolder,
      service,
    },
    null,
    2,
  )}\n`;

  const { source } = JSON.parse(
    fs.readFileSync(join(liveFolder, 'source.json')),
  );

  /* deployment params */

  const sourceFolder = join(liveFolder, source);
  const params = await getDeployKey(source, identity, region);

  const projectRoot = pkgDir.sync(liveFolder);

  const serviceNoExt = service.replace(/\.[^.]+$/, '');

  const buildDir = join(liveFolder, '.webpack', serviceNoExt);
  const webpackEntry = join(sourceFolder, service);
  const debugFile = join(buildDir, 'debug.log');

  fs.ensureDirSync(buildDir);

  fs.writeFileSync(join(buildDir, 'input.json'), inputData);

  const variablesDebugContent = `${JSON.stringify(
    {
      buildDir,
      webpackEntry,
    },
    null,
    2,
  )}\n`;
  fs.writeFileSync(join(buildDir, 'variables.json'), variablesDebugContent);

  const handleError = (err) => {
    fs.writeFileSync(debugFile, `${err.stack || err}`);
    throw new Error('Something went wrong, check your .Live folder debug.log');
  };

  function doBuild() {
    const tmpFs = new MemoryFs();
    const compilerGetDeps = webpack(
      makeWebpackConfig({
        entry: webpackEntry,
        projectRoot,
        bundleDeps: true,
      }),
    );
    compilerGetDeps.outputFileSystem = tmpFs;

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

    const runCompiler = (comp, id) => new Promise((resolve) => {
      comp.run((err, stats) => {
        resolve({ err, stats, id });
      });
    });

    Promise.all([
      runCompiler(compiler, 'noDeps'),
      runCompiler(compilerGetDeps, 'analyzeDeps'),
    ])
      .then((compiledResult) => {
        compiledResult.forEach(({ err, stats, id }) => {
          const statsFile = join(buildDir, `${id}_webpack_stats.json`);
          const cliOutputFile = join(buildDir, `${id}_webpack_output.log`);
          const errFile = join(buildDir, `${id}_webpack_errors.json`);
          fs.writeFileSync(statsFile, JSON.stringify(stats.toJson(), null, 2));
          fs.writeFileSync(cliOutputFile, stats.toString());

          if (err || stats.hasErrors()) {
            fs.writeFileSync(errFile, err);
            handleError(
              `There were some errors, please check ${errFile} and ${statsFile}\n`,
            );
          }
        });

        return Promise.resolve(
          compiledResult.find(({ id }) => id === 'analyzeDeps'),
        );
      })
      .then(({ stats }) => {
        /* The stats correpond to analyzeDeps, but the saved file is form noDeps */
        const compiledFileName = Object.keys(memFs.data)[0];
        /* just the hash of the written code, not taking node_modules into account */
        const completeHash = getHash(Object.keys(tmpFs.data)[0]);

        const usedDependencies = [
          ...new Set(
            stats
              .toJson()
              .modules.map(({ name }) => name)
              .filter(
                (name) => !name.match(/^external/) && name.match(/node_modules/),
              )
              .map((name) => {
                const modulePathing = name.split('node_modules/')[1];
                const moduleName = modulePathing.split('/')[0];
                return moduleName;
              }),
          ),
        ].filter((name) => name !== 'aws-sdk');

        const zip = new AdmZip();
        // add file directly
        zip.addFile('service.js', memFs.data[compiledFileName]);
        fs.writeFileSync(
          join(buildDir, 'service.js'),
          memFs.data[compiledFileName],
        );

        const deps = removeDevDeps({
          projectRoot,
          usedDependencies,
        });
        deps.forEach((dep) => {
          zip.addLocalFolder(
            join(projectRoot, 'node_modules', dep),
            `node_modules/${dep}`,
          );
        });
        const packageJson = JSON.parse(
          fs.readFileSync(join(projectRoot, 'package.json'), 'utf-8'),
        );
        const pkgDependencies = deps.reduce(
          (ob, dep) => ({
            ...ob,
            [dep]: packageJson[dep],
          }),
          {},
        );
        zip.addFile(
          'package.json',
          JSON.stringify(
            {
              name: kebabCase(serviceNoExt),
              version: '1.0.0',
              description: 'Packaged externals for the simple_lambda',
              private: true,
              scripts: {},
              dependencies: pkgDependencies,
            },
            null,
            2,
          ),
        );

        // write everything to disk
        const zipFilePath = join(buildDir, 'lambda_package.zip');
        zip.writeZip(zipFilePath);

        fs.writeFileSync(
          join(buildDir, 'test.json'),
          JSON.stringify(stats.toJson(), null, 2),
        );

        const entriesList = getExportsFromWebpackEntryInStats(
          stats.toJson(),
          webpackEntry,
        );

        let entries = '';
        let functionNames = '';
        let functionDescriptions = '';
        let lambdaHandlers = '';
        /* the lambdas are scoped by region and platform(aws) and account */
        const bucket = LAMBDA_DEPLOYMENT_BUCKET({ liveFolder });
        const s3BucketFileName = service.replace(
          /\.[^.]+$/,
          `.${completeHash}.zip`,
        );

        const slswtPath = liveFolder
          .replace(projectRoot, '')
          .replace(/^\//, '');
        const bucketObjectKey = join(slswtPath, s3BucketFileName);
        entriesList.forEach((entry) => {
          const lambdaHandler = `service.${entry}`;
          const functionDescription = `${slswtPath}/lambda/${serviceNoExt}.${entry}`;
          entries += `|${entry}`;
          functionNames += `|${md5(functionDescription)}`;
          functionDescriptions += `|${functionDescription}`;
          lambdaHandlers += `|${lambdaHandler}`;
        });
        entries = entries.slice(1);
        functionNames = functionNames.slice(1);
        functionDescriptions = functionDescriptions.slice(1);
        lambdaHandlers = lambdaHandlers.slice(1);

        const output = {
          entries,
          bucketObjectKey,
          region,
          bucket,
          zipFilePath,
          functionNames,
          functionDescriptions,
          lambdaHandlers,
          project,
          platform,
          account,
          environment,
          version,
          path,
          /* the actual deployment params, not filtered by the deploy.js */
          ...Object.entries(params).reduce(
            (curr, [key, val]) => ({
              ...curr,
              [`env_${key}`]: val,
            }),
            {},
          ),
        };
        const stringResponse = `${JSON.stringify(output, null, 2)}\n`;
        fs.writeFileSync(join(buildDir, 'build_output.json'), stringResponse);
        process.stdout.write(stringResponse);
      })
      .catch((err) => {
        handleError(err);
      });
  }

  try {
    doBuild();
  } catch (err) {
    handleError(err);
  }
};

module.exports = build;
