import snakeCase from 'lodash/snakeCase';
import fs from 'fs';
import { join } from 'path';
import requiredParam from '../utils/requiredParam';
import ScriptParser from '../ScriptParser';

class ApplyParsers {
  constructor({
    deploymentParams: {
      project = requiredParam('project'),
      environment = requiredParam('environment'),
      version = requiredParam('version'),
      platform = requiredParam('platform'),
    } = requiredParam('deploymentParams'),
    rootFolder = requiredParam('rootFolder'),
  }) {
    this.deploymentParams = {
      project,
      environment,
      version,
      platform,
    };
    this.rootFolder = rootFolder;
  }

  build(sourceFile) {
    const hcl = fs.readFileSync(sourceFile).toString();
    const hclParser = new ScriptParser({
      hcl,
      deploymentParams: this.deploymentParams,
      sourceFile,
      rootFolder: this.rootFolder,
      deployFolder: join(__dirname, '../'),
    });

    return hclParser.parse();
  }
}

export default ApplyParsers;
