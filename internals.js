#!/usr/bin/env node --experimental-modules --no-warnings
const program = require('commander');
const fs = require('fs');
const { join, parse } = require('path');
const pkgDir = require('pkg-dir');
const { execFileSync } = require('child_process');

const minimist = require('minimist');
const build = require('./src/buildSimpleLambda/build');
const makeCfResolverTemplate = require('./internals/makeCfResolverTemplate');
const camelCase = require('./internals/camelCase');
const snakeCase = require('./internals/snakeCase');
const parseDir = require('./utils/parseDir');
const getBranchName = require('./utils/getBranchName');
const getLatestHash = require('./utils/getLatestHash');
const getReleaseInfo = require('./utils/getReleaseInfo');
const naming = require('./naming');

program.version('0.0.1');

program
  .command('build_lambda')
  .option(
    '-s, --service <name>',
    'The relative path from the root path to the javascript entry file (in same folder, e.g. service.js)',
  )
  .option('-l, --liveFolder <path>', 'Live folder path')
  .description('Builds the simple lambda js bundle')
  .action((options) => {
    build(options);
  });

program
  .command('camel_case [value]')
  .description('Camelcases the value')
  .action((value) => {
    camelCase(value);
  });

program
  .command('snake_case [value]')
  .description('Snakecases the value')
  .action((value) => {
    snakeCase(value);
  });

program
  .command('make_cf_resolver_template')
  .option('-a, --ApiId <id>', 'id of the API')
  .option(
    '-f, --fields <jsonstring>',
    'jsonstring of array with gql fields which should invoke the resolver',
  )
  .option(
    '-d, --DataSourceName <name>',
    'Name of the datasource (usually an md5 id)',
  )
  .description('Creates a cloudformation template for appsync resolvers')
  .action((options) => {
    const args = {
      ApiId: options.ApiId,
      fields: options.fields,
      DataSourceName: options.DataSourceName,
    };
    makeCfResolverTemplate(args);
  });

program
  .command('cat <path>')
  .description('Prints the content of a file')
  .action((path) => {
    process.stdout.write(`${fs.readFileSync(path)}\n`);
  });

program
  .command('slswtrc <dirname>')
  .description('Prints the .slswtrc')
  .action((path) => {
    const rootDir = pkgDir.sync(path);
    process.stdout.write(`${fs.readFileSync(join(rootDir, '.slswtrc'))}\n`);
  });

program
  .command('git-branch [dirname]')
  .description('Prints the git branch name as json')
  .action((dirname) => {
    const b = getBranchName(dirname);
    console.log(b);
  });

program
  .command('git-hash [dirname]')
  .description('Prints the git branch name as json')
  .action((dirname) => {
    const b = getLatestHash(dirname);
    console.log(b);
  });

program
  .command('release-info [dirname]')
  .description('Prints the git branch name as json')
  .action((dirname) => {
    process.stdout.write(
      `${JSON.stringify(getReleaseInfo(dirname), null, 2)}\n`,
    );
  });

program
  .command('get_name [dir]')
  .allowUnknownOption()
  .description('Retrieves names for different services and entities')
  .action((liveFolder) => {
    const argv = minimist(process.argv.slice(2));
    if (!argv.key) {
      throw new Error('You must pass the --key argument');
    }
    if (!naming[argv.key]) {
      throw new Error(`${argv.key} was not found`);
    }
    const name = naming[argv.key]({
      liveFolder,
      ...argv,
    });
    process.stdout.write(`${JSON.stringify({ name })}\n`);
  });

const simpleLambdaPathName = (dir) => {
  const path = parseDir(dir);
  const matches = path.match(/microservices\/(.*)$/);
  if (!matches) {
    throw new Error(
      'The dirname provided must be a child directory of microservices',
    );
  }
  const pathName = matches[1];
  return pathName;
};

program
  .command('simple_lambda_path_name [dirname]')
  .description('Prints the git branch name as json')
  .action((dir) => {
    const pathName = simpleLambdaPathName(dir);
    process.stdout.write(
      `${JSON.stringify(
        {
          pathName,
        },
        null,
        2,
      )}\n`,
    );
  });
const simpleLambdaServicePath = (dir, reldir) => {
  const pathName = simpleLambdaPathName(dir);
  const terraformRoot = pkgDir.sync(parseDir(dir));
  const servicePath = join(
    terraformRoot,
    'Blueprints/services/microservices',
    pathName,
    reldir,
  );
  return servicePath;
};
program
  .command('simple_lambda_service_path [dirname]')
  .option(
    '-r, --reldir <path>',
    'path to the service.js file in the microservice folder',
  )
  .description('Prints the git branch name as json')
  .action((dir, options) => {
    const servicePath = simpleLambdaServicePath(dir, options.reldir);
    process.stdout.write(
      `${JSON.stringify(
        {
          servicePath,
        },
        null,
        2,
      )}\n`,
    );
  });
// program
//   .command('simple_lambda_function_names [dirname]')
//   .option('-e, --entires <json>', 'json string of entries')
//   .option(
//     '-r, --reldir <path>',
//     'path to the service.js file in the microservice folder'
//   )
//   .description('prints the functions names information')
//   .action((dir, options) => {
//     const pathName = simpleLambdaPathName(dir);
//     const terraformRoot = pkgDir.sync(parseDir(dir));
//     const { environment, version } = getReleaseInfo(dir);
//     process.stdout.write(
//       `${JSON.stringify(
//         {
//           names: [
//             {
//               s3Key: `${environment}/${version}//${
//                 parse(options.reldir).base
//               }.${data.external.webpack_build.result.completeHash}.zip`,
//               name,
//               description,
//             },
//           ],
//         },
//         null,
//         2
//       )}\n`
//     );
//   });
program.command('test').action(() => {
  process.stdout.write(
    `${JSON.stringify(
      {
        entries: 'no,lol',
        nested: 'omg',
      },
      null,
      2,
    )}\n`,
  );
});
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
