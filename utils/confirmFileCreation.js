const inquirer = require('inquirer');

module.exports = async (files) => {
  console.log('Will create the following files:');
  console.log(JSON.stringify(files, null, 2));
  const { confirmed } = await inquirer.prompt([
    {
      name: 'confirmed',
      type: 'confirm',
      message: 'Is this okey?',
    },
  ]);
  return confirmed;
};
