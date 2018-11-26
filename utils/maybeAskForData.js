const { existsSync, readFileSync } = require('fs-extra');
const inquirer = require('inquirer');
const has = require('lodash/has');

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
      try {
        args = JSON.parse(readFileSync(path));
      } catch (err) {
        console.log(err);
      }
    }
  }

  if (!keys.every((key) => has(args, key))) {
    const neededQuestionsKeys = keys.filter((key) => !args[key]);
    const neededQuestions = questions.filter(({ name }) => neededQuestionsKeys.includes(name));
    const newArgs = await inquirer.prompt(neededQuestions);
    Object.assign(args, newArgs);
  }

  return args;
};
