const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const { join } = require('path');
const pkgDir = require('pkg-dir');
const requiredParam = require('@slswt/utils/requiredParam');
const kebabCase = require('lodash/kebabCase');
const getExportsFromWebpackEntryInStats = require('../../../../utils/getExportsFromWebpackEntryInStats');
const getParamsFromLiveFolderPath = require('../../../../utils/getParamsFromLiveFolderPath');
const removeDevDeps = require('../../removeDevDeps');
const Compiler = require('./Compiler');
const print = require('./print');
const slswtBabelTransform = require('./slswtBabelTransform');

const getHash = (fname) => fname.match(/^(\w|\d)+\./)[0].slice(0, -1);

const getUsedDependencies = (stats) => [
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

class Compilation {
  constructor({
    liveFolder = requiredParam('liveFolder'),
    service = requiredParam('service'),
    id = requiredParam('id'),
  }) {
    this.print = print;

    const {
      project,
      platform,
      account,
      region,
      environment,
      version,
      path,
    } = getParamsFromLiveFolderPath(liveFolder);

    this.deploymentIdParams = {
      project,
      platform,
      account,
      region,
      environment,
      version,
      path,
    };
    const projectRoot = pkgDir.sync(liveFolder);

    const serviceNoExt = service.replace(/\.[^.]+$/, '');

    const buildDir = join(liveFolder, '.webpack', serviceNoExt);

    this.folders = {
      live: liveFolder,
      projectRoot,
      source: join(projectRoot, path),
      build: buildDir,
    };
    this.files = {
      service,
      webpackEntry: join(this.folders.source, service),
      debugOutput: join(buildDir, 'debug.log'),
    };

    this.names = { serviceNoExt, id };

    this.deploymentParams = JSON.parse(
      fs.readFileSync(join(liveFolder, 'params.json')),
    );
  }

  initFolderStructure() {
    fs.ensureDirSync(this.folders.build);

    const inputData = `${JSON.stringify(
      {
        liveFolder: this.folders.live,
        service: this.files.service,
      },
      null,
      2,
    )}\n`;

    fs.writeFileSync(join(this.folders.build, 'input.json'), inputData);

    const variablesDebugContent = `${JSON.stringify(
      {
        buildDir: this.folders.build,
        webpackEntry: this.files.webpackEntry,
      },
      null,
      2,
    )}\n`;

    fs.writeFileSync(
      join(this.folders.build, 'variables.json'),
      variablesDebugContent,
    );
  }

  handleError(err) {
    const errMsg = err.stack || err;
    fs.writeFileSync(this.files.debugOutput, `${errMsg}`);
    throw new Error(
      `Something went wrong, check your .Live folder debug.log: ${errMsg}`,
    );
  }

  async build() {
    const { projectRoot } = this.folders;
    const { webpackEntry } = this.files;
    const compilerGetDeps = new Compiler('analyzeDeps', {
      entry: webpackEntry,
      projectRoot,
      bundleDeps: true,
    });
    const compiler = new Compiler('noDeps', {
      entry: webpackEntry,
      projectRoot,
      bundleDeps: false,
    });
    return Promise.all([
      compiler.run(this.folders.build),
      compilerGetDeps.run(this.folders.build),
    ])
      .then(([noDeps, deps]) => {
        const hash = getHash(Object.keys(deps.fs.data)[0]);
        this.saveCompilationArtifacts({ stats: deps.stats, hash });
        return Promise.resolve({
          data: slswtBabelTransform(
            noDeps.fs.data[Object.keys(noDeps.fs.data)[0]],
            this.deploymentParams,
          ),
          usedDependencies: getUsedDependencies(deps.stats),
        });
      })
      .then((props) => this.zip(props))
      .catch((err) => this.handleError(err));
  }

  zip({ data, usedDependencies }) {
    const zip = new AdmZip();
    // add file directly
    zip.addFile('service.js', data);
    fs.writeFileSync(join(this.folders.build, 'service.js'), data);

    const { projectRoot } = this.folders;

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
          name: kebabCase(this.names.serviceNoExt),
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
    const zipFilePath = join(this.folders.build, 'lambda_package.zip');
    zip.writeZip(zipFilePath);

    this.savePackageArtifacts({ zipFilePath });
  }

  saveCompilationArtifacts({ stats, hash }) {
    this.compilation = {
      entriesList: getExportsFromWebpackEntryInStats(
        stats.toJson(),
        this.files.webpackEntry,
      ),
      hash,
    };
  }

  savePackageArtifacts({ zipFilePath }) {
    this.package = {
      zipFilePath,
    };
  }
}

module.exports = Compilation;
