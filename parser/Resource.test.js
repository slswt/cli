/* eslint-env jest */
import Resource from './Resource';

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
  const result = await resource.generate();

  const expected = `resource "aws_dynamo_db_table" "sometable" {
  role        = "\${aws_lambda_function.some_function.role}"
  name        = "theWefProject/stage/123/aws/eu-north-1/aws_dynamo_db_table.some_path_main_sometable"
  description = "theWefProject/stage/123/aws/eu-north-1/aws_dynamo_db_table.some_path_main_sometable"
}
`;
  expect(result).toBe(expected);
});
