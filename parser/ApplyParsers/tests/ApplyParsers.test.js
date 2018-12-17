/* eslint-env jest */
import fs from 'fs';
import { join } from 'path';
import ApplyParsers from '../index';

test('ApplyParsers', () => {
  const parser = new ApplyParsers({
    deploymentParams: {
      project: 'wef',
      environment: 'stage',
      version: 123,
      platform: 'aws/eu-north-1',
    },
    rootFolder: join(__dirname, 'testProject'),
  });

  const result = parser.build(join(__dirname, 'testProject/somemodule/main.tf'));
  console.log(result);
});
