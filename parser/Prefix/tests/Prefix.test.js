/* eslint-env jest */
import fs from 'fs';
import { join } from 'path';
import Prefix from '../Prefix';

test('Prefix', () => {
  const hcl = fs.readFileSync(join(__dirname, 'main.tf')).toString();
  const prefixer = new Prefix({ hcl, relativeSourceFile: 'some/path/main.tf' });

  const result = prefixer.prefix();
  // fs.writeFileSync(join(__dirname, 'output.tf'), result);
  expect(fs.readFileSync(join(__dirname, 'output.tf')).toString()).toBe(result);
});
