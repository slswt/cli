#!/usr/bin/env node
const program = require('commander');
const { join } = require('path');
const pkgDir = require('pkg-dir');
const scaffold = require('./scaffold');
const projectBlueprints = require('@slswt/utils/projectBlueprints');
const getDeploymentSchema = require('@slswt/utils/getDeploymentSchema');
const { readFileSync } = require('fs');
const templateService = require('./templateService');

program.version('0.0.1');

const parseDir = (dir) => {
  dir = dir || '.';
  if (dir[0] === '.') {
    return join(process.cwd(), dir);
  } else {
    return dir;
  }
};

program
  .command('init [dir]')
  .description('Scaffold the project')
  .action(function(dir, options) {
    scaffold(parseDir(dir));
  });

program
  .command('project [dir]')
  .description('Project blueprints')
  .action(function(dir, options) {
    const terraformRoot = pkgDir.sync(parseDir(dir));
    const { remoteStateBucket, roleArn, region } = JSON.parse(
      readFileSync(join(terraformRoot, 'slswt-remote-config.json'))
    );
    projectBlueprints({
      terraformRoot,
      stateBucket: remoteStateBucket,
      stateBucketRegion: region,
      role: roleArn,
    });
  });

program
  .command('template [dir]')
  .description('Initialize a new service from template')
  .action(function(dir, options) {
    const serviceFolder = parseDir(dir);
    templateService(serviceFolder);
  });

program
  .command('schema [dir]')
  .description('Print the deployment schema')
  .action(function(dir, options) {
    const terraformRoot = pkgDir.sync(parseDir(dir));
    getDeploymentSchema(terraformRoot);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
