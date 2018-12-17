/* eslint-env jest */

import ResourceParser from './ResourceParser';

const hcl = `

data "aws_iam_policy_document" "services_lambda_api_table_access_rules" {
  statement {
    actions = [
      "dynamodb:*",
    ]

    resources = [
      "*",
    ]
  }
}

resource "aws_iam_policy" "services_lambda_api_table_access" {
  policy = "\${
    data.aws_iam_policy_document.services_lambda_api_table_access_rules.json
  }"
}

resource "aws_iam_role" "services_lambda_api_policy_attachment" {
  role       = "\${module.services_lambda_api_presignup.role_name}"
  policy_arn = "\${aws_iam_policy.services_lambda_api_table_access.arn}"
}

`;

test('retrieval of resource definitions', () => {
  const resources = new ResourceParser(hcl);
  expect(resources.definitions.length).toBe(2);
  expect(resources.definitions).toEqual([
    {
      service: 'aws_iam_policy',
      name: 'services_lambda_api_table_access',
    },
    {
      service: 'aws_iam_role',
      name: 'services_lambda_api_policy_attachment',
    },
  ]);
});

test('prefixing of resource definitions', () => {
  const resources = new ResourceParser(hcl);
  const result = resources.withPrefixedResources('someprefix');
  resources.hcl = result(hcl);
  expect(resources.definitions).toEqual([
    {
      service: 'aws_iam_policy',
      name: 'someprefix_services_lambda_api_table_access',
    },
    {
      service: 'aws_iam_role',
      name: 'someprefix_services_lambda_api_policy_attachment',
    },
  ]);
});
