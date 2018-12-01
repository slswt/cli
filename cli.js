#!/usr/bin/env node
const program = require('commander');
const { join } = require('path');
const pkgDir = require('pkg-dir');
const { readFileSync } = require('fs');
const getDeploymentSchema = require('./commands/schema');
const projectBlueprints = require('./commands/project');
const template = require('./commands/template');
const scaffold = require('./commands/scaffold');
const invoke = require('./commands/invoke');
const deploy = require('./commands/deploy');
const parseDir = require('./utils/parseDir');

program.version('0.0.1');

program
  .command('init [dir]')
  .description('Scaffold the project')
  .action((dir) => {
    scaffold(parseDir(dir));
  });

program
  .command('project [dir]')
  .description('Project blueprints')
  .action((dir) => {
    const terraformRoot = pkgDir.sync(parseDir(dir));
    const { tfRemoteStateBucket, region } = JSON.parse(
      readFileSync(join(terraformRoot, '.slswtrc')),
    );
    const providers = JSON.parse(
      readFileSync(join(terraformRoot, '.slswtrc.secrets')),
    );
    projectBlueprints({
      terraformRoot,
      stateBucket: tfRemoteStateBucket,
      stateBucketRegion: region,
      providers,
    });
  });

program
  .command('template [dir]')
  .description('Initialize a new service from template')
  .action((dir) => {
    const serviceFolder = parseDir(dir);
    template(serviceFolder);
  });

program
  .command('schema [dir]')
  .description('Print the deployment schema')
  .action((dir, options) => {
    const terraformRoot = pkgDir.sync(parseDir(dir));
    getDeploymentSchema(terraformRoot);
  });

program
  .command('deploy [dir]')
  .description(
    'Will deploy the service in dir (must be service in Environments or Blueprints)',
  )
  .action((dir) => {
    const serviceFolder = parseDir(dir);
    deploy(serviceFolder);
  });

program
  .command('invoke <file>')
  .description('Will invoke the service in the current directory')
  .action((file) => {
    invoke(join(process.cwd(), file));
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
