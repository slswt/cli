const inquirer = require('inquirer');
const { AWS_REGIONS } = require('../constants');

const askForRegion = async () => {
  const { selectedRegion: region } = await inquirer.prompt([
    {
      name: 'selectedRegion',
      type: 'list',
      message: 'Region where to deploy the service',
      choices: AWS_REGIONS,
    },
  ]);

  return region;
};

module.exports = askForRegion;
