#!/usr/bin/env node
const program = require('commander');
const fs = require('fs');
const build = require('./internals/buildSimpleLambda/build');
const makeCfResolverTemplate = require('./internals/makeCfResolverTemplate');
const camelCase = require('./internals/camelCase');
const snakeCase = require('./internals/snakeCase');

program.version('0.0.1');

program
  .command('build_lambda')
  .option('-e, --environment [environment]', 'Deployment environment')
  .option(
    '-f, --functionName [name]',
    'Lambda path (relative to microservices directory)'
  )
  .option('-w, --webpackMode [mode]', 'webpack mode (production/development)')
  .option(
    '-p, --path <path>',
    'The location of the service path(where the tf file of the module service is(and javascript files))'
  )
  .option(
    '-m, --modulePath <path>',
    'The path of where the root module is installed'
  )
  .option(
    '-r, --rootPath <path>',
    'The origin path of the service in the Live folder (the build directory is also here)'
  )
  .option(
    '-s, --servicePath <path>',
    'The relative path from the root path to the javascript entry file(relative path, e.g. ./ service.js)'
  )
  .option(
    '-n, --nodeExternalsWhitelist [jsonstring]',
    'JSON string of array with whitelisted modules which should be included in the bundle'
  )
  .description('Builds the simple lambda js bundle')
  .action(function(options) {
    build(options);
  });

program
  .command('camel_case [value]')
  .description('Camelcases the value')
  .action(function(value) {
    camelCase(value);
  });

program
  .command('snake_case [value]')
  .description('Snakecases the value')
  .action(function(value) {
    snakeCase(value);
  });

program
  .command('make_cf_resolver_template')
  .option('-a, --ApiId [id]', 'id of the API')
  .option(
    '-f, --fields [jsonstring]',
    'jsonstring of array with gql fields which should invoke the resolver'
  )
  .option(
    '-d, --DataSourceName [name]',
    'Name of the datasource (usually an md5 id)'
  )
  .description('Creates a cloudformation template for appsync resolvers')
  .action(function(options) {
    makeCfResolverTemplate(options);
  });

program
  .command('cat <path>')
  .description('Prints the content of a file')
  .action(function(path) {
    process.stdout.write(`${fs.readFileSync(path)}\n`);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
