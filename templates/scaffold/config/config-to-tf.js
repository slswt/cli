const config = require('./config');

process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
