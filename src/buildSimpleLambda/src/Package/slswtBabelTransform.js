const babel = require('@babel/core');
const readServiceParseDeploymentParams = require('../../../../utils/readServiceParseDeploymentParams');
const { join } = require('path');

const slswtBabelTransform = (sourceCode, deploymentParams) => {
  const plugin = ({ types: t }) => ({
    visitor: {
      Identifier(astPath) {
        if (t.isIdentifier(astPath.node, { name: 'slswtResource' })) {
          const [
            deploymentPath,
            serviceName,
            resourceId,
          ] = astPath.parentPath.node.arguments.map(({ value }) => value);

          const resourceCustomIdentifiers = astPath.parentPath.node.arguments[3].properties.reduce(
            (curr, { key, value }) => ({
              ...curr,
              [key.name]: value.value,
            }),
            {},
          );

          let resourceURI = '';

          const {
            project,
            platform,
            account,
            region,
            environment,
            version,
          } = readServiceParseDeploymentParams(deploymentParams);

          if (serviceName === 'aws_lambda') {
            resourceURI = join(
              project,
              platform,
              account,
              region,
              environment,
              version,
              deploymentPath,
              serviceName,
              resourceId,
              resourceCustomIdentifiers.entry,
            );
          }

          astPath.parentPath.replaceWith(
            t.expressionStatement(t.stringLiteral(resourceURI)),
          );
        }
      },
    },
  });

  const { code } = babel.transform(sourceCode, { plugins: [plugin] });
  return code;
};

module.exports = slswtBabelTransform;
