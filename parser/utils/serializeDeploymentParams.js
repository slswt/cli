const serializeDeploymentParams = ({
  project, environment, version, platform,
}) =>
  `${project}/${environment}/${version}/${platform}`;

export default serializeDeploymentParams;
