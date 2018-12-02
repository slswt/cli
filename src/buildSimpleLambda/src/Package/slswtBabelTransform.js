const babel = require('@babel/core');
const readServiceParseDeploymentParams = require('../../../../utils/readServiceParseDeploymentParams');
const { join } = require('path');

const slswtBabelTransform = (sourceCode, deploymentParams, sourceFolder) => {
  const plugin = ({ types: t }) => ({
    visitor: {
      Identifier(astPath) {
        if (t.isIdentifier(astPath.node, { name: 'slswtResource' })) {
          const [
            globalURI,
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
            environment,
            version,
          } = readServiceParseDeploymentParams(sourceFolder, deploymentParams);

          if (serviceName === 'aws_lambda_function') {
            resourceURI = join(
              project,
              environment,
              version,
              globalURI,
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
