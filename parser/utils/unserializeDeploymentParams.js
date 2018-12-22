const unserializeDeploymentParams = (string) => {
  const [, project, environment, version, platform] = string.match(
    /[^/]+\/[^/]+\/[^/]+\/[^/]+\//,
  );
  return {
    project,
    environment,
    version,
    platform,
  };
};

export default unserializeDeploymentParams;
