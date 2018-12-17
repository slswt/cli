/* eslint-env jest */
import fs from 'fs';
import { join } from 'path';
import changeRelativeModuleDirectory from '../index';

test('changeRelativeModuleDirectory', () => {
  const content = fs.readFileSync(join(__dirname, './main.tf')).toString();

  const result = changeRelativeModuleDirectory({
    hcl: content,
    oldFolder: __dirname,
    newFolder: join(__dirname, 'new_folder/omg'),
  });

  // fs.writeFileSync(join(__dirname, './output.tf'), result);
  expect(result).toBe(
    fs.readFileSync(join(__dirname, './output.tf')).toString(),
  );
});
