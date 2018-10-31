const { existsSync } = require('fs-extra');
const inquirer = require('inquirer');
const has = require('lodash/has');

let { remoteStateBucket, roleArn, region } = {};

module.exports = async (path, keys, questions) => {
  let args = {};
  if (existsSync(path)) {
    const { confirmedUseExisting } = await inquirer.prompt([
      {
        name: 'confirmedUseExisting',
        type: 'confirm',
        message: `Would you like to use your existing configuration file? (${path})`,
      },
    ]);
    if (confirmedUseExisting) {
      args = require(path);
    }
  }
  
  if (!keys.every((key) => has(args, key))) {
    const neededQuestionsKeys = keys.filter((key) => !args[key]);
    const neededQuestions = questions.filter(({ name }) => neededQuestionsKeys.includes(name));
    args = await inquirer.prompt(questions);
  }

  return args;
}
