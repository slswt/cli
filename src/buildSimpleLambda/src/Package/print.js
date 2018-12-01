const crypto = require('crypto');
const fs = require('fs-extra');
const { join } = require('path');
const { LAMBDA_DEPLOYMENT_BUCKET } = require('../../../../naming');

const md5 = (what) => crypto
  .createHash('md5')
  .update(what)
  .digest('hex');

function print() {
  let entries = '';
  let functionNames = '';
  let functionDescriptions = '';
  let lambdaHandlers = '';
  /* the lambdas are scoped by region and platform(aws) and account */
  const { live: liveFolder } = this.folders;
  const bucket = LAMBDA_DEPLOYMENT_BUCKET({ liveFolder });
  const s3BucketFileName = this.files.service.replace(
    /\.[^.]+$/,
    `.${this.compilation.hash}.zip`,
  );

  const slswtPath = liveFolder
    .replace(this.folders.projectRoot, '')
    .replace(/^\//, '');
  const bucketObjectKey = join(slswtPath, s3BucketFileName);
  this.compilation.entriesList.forEach((entry) => {
    const lambdaHandler = `service.${entry}`;
    const functionDescription = join(
      slswtPath,
      'aws_lambda_function',
      this.names.id,
      entry,
    );
    entries += `|${entry}`;
    functionNames += `|${md5(functionDescription)}`;
    functionDescriptions += `|${functionDescription}`;
    lambdaHandlers += `|${lambdaHandler}`;
  });
  entries = entries.slice(1);
  functionNames = functionNames.slice(1);
  functionDescriptions = functionDescriptions.slice(1);
  lambdaHandlers = lambdaHandlers.slice(1);

  const output = {
    entries,
    bucketObjectKey,
    bucket,
    zipFilePath: this.package.zipFilePath,
    functionNames,
    functionDescriptions,
    lambdaHandlers,
    ...this.deploymentIdParams,
    /* the actual env params, not filtered by the deploy.js */
    ...Object.entries(this.deploymentParams).reduce(
      (curr, [key, val]) => ({
        ...curr,
        [`env_${key}`]: val,
      }),
      {},
    ),
  };
  const stringResponse = `${JSON.stringify(output, null, 2)}\n`;
  fs.writeFileSync(
    join(this.folders.build, 'build_output.json'),
    stringResponse,
  );
  process.stdout.write(stringResponse);
}

module.exports = print;
