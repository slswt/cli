#!/usr/bin/env node
const program = require('commander');
const { join } = require('path');
const scaffold = require('./scaffold');

program.version('0.0.1');

program
  .command('init [dir]')
  .description('Scaffold the project')
  .action(function(dir, options) {
    dir = dir || '.';
    if (dir[0] === '.') {
      scaffold(join(
        process.cwd(),
        dir
      ));
    } else {
      scaffold(dir);
    }
  });

/*
program
  .command('setup [env]')
  .description('run setup commands for all envs')
  .option('-s, --setup_mode [mode]', 'Which setup mode to use')
  .action(function(env, options) {
    var mode = options.setup_mode || 'normal';
    env = env || 'all';
    console.log('setup for %s env(s) with %s mode', env, mode);
  });

program
  .command('exec <cmd>')
  .alias('ex')
  .description('execute the given remote cmd')
  .option('-e, --exec_mode <mode>', 'Which exec mode to use')
  .action(function(cmd, options) {
    console.log('exec "%s" using %s mode', cmd, options.exec_mode);
  })
  .on('--help', function() {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  $ deploy exec sequential');
    console.log('  $ deploy exec async');
  });

*/

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
