import crypto from 'crypto';
import AdmZip from 'adm-zip';
import identity from 'lodash/identity';
import fs from 'fs-extra';
import MemoryFs from 'memory-fs';
import webpack from 'webpack';
import { join, parse } from 'path';
import pkgDir from 'pkg-dir';
import requiredParam from '@slswt/utils/requiredParam';
import kebabCase from 'lodash/kebabCase';
import getExportsFromWebpackEntryInStats from '../../../utils/getExportsFromWebpackEntryInStats';
import getDeployKey from '../../../utils/getDeployKey';
import makeWebpackConfig from '../webpack.config';
import removeDevDeps from '../removeDevDeps';
import { LAMBDA_DEPLOYMENT_BUCKET } from '../../../naming';
import Compiler from './Compiler';

const getHash = (fname) => fname.match(/^(\w|\d)+\./)[0].slice(0, -1);

class Compilation {
  constructor({
    liveFolder = requiredParam('liveFolder'),
    service = requiredParam('service'),
  }) {
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

    const buildDir = join(liveFolder, '.webpack', this.names.serviceNoExt);

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

    this.names = { serviceNoExt: this.files.service.replace(/\.[^.]+$/, '') };
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
    fs.writeFileSync(this.files.debugOutput, `${err.stack || err}`);
    throw new Error('Something went wrong, check your .Live folder debug.log');
  }

  build() {
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
    Promise.all([
      compiler.run(this.folders.build),
      compilerGetDeps.run(this.folders.build),
    ])
      .then(([noDeps, deps]) => {
        const fileName = Object.keys(noDeps.data)[0];
        return Promise.resolve({
          completeHash: getHash(Object.keys(deps.data)[0]),
          data: noDeps.fs.data[fileName],
          fileName,
          usedDependencies: [
            ...new Set(
              deps.stats
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
          ].filter((name) => name !== 'aws-sdk'),
        });
      })
      .then(this.zip)
      .catch(this.handleError);
  }

  zip({
    completeHash, data, fileName, usedDependencies,
  }) {
    const zip = new AdmZip();
    // add file directly
    zip.addFile('service.js', data);
    fs.writeFileSync(join(this.folders.build, 'service.js'), data);
  }
}

module.exports = Compilation;
