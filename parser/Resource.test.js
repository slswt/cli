/* eslint-env jest */
import Resource from './Resource';
import HclPrettier from './HclPrettier';

const deploymentParams = {
  project: 'theWefProject',
  environment: 'stage',
  version: '123',
  platform: 'aws/eu-north-1',
};

test('Resource', async () => {
  const resource = new Resource({
    deploymentParams,
    sourceFile: '/some/path/main.tf',
    resourceType: 'aws_dynamo_db_table',
    resourceName: 'sometable',
    resourceIdentifiers: ['name', 'description'],
    resourceParams: {
      role: '${aws_lambda_function.some_function.role}',
    },
    rootFolder: '/',
  });
  // const ref = new Ref(deploymentParams);
  const hcl = resource.generate();
  const prettier = new HclPrettier(hcl);

  const expected = `resource "aws_dynamo_db_table" "sometable" {
  role        = "\${aws_lambda_function.some_function.role}"
  name        = "theWefProject-8097ef"
  description = "theWefProject/stage/123/aws/eu-north-1/aws_dynamo_db_table.some_path_main_sometable"
}
`;
  const result = await prettier.format();
  expect(result).toBe(expected);
});
