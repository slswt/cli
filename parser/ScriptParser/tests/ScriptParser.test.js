/* eslint-env jest */
import fs from 'fs';
import { join } from 'path';
import ScriptParser from '../index';

const hcl = fs.readFileSync(join(__dirname, 'main.tf')).toString();

test('parsing scripts', () => {
  const hclParser = new ScriptParser({
    hcl,
    deploymentParams: {
      environment: 'stage',
    },
    sourceFile: join(__dirname, 'main.tf'),
    rootFolder: __dirname,
    deployFolder: join(__dirname, '../'),
  });
  const result = hclParser.parse();
  // fs.writeFileSync(join(__dirname, './output.tf'), result);
  expect(result).toBe(
    fs.readFileSync(join(__dirname, './output.tf')).toString(),
  );
});
