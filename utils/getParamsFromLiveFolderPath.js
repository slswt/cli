const getParamsFromLiveFolderPath = (liveFolder) => {
  const [,
    project,
    platform,
    account,
    region,
    environment,
    version,
    path,
  ] = liveFolder.match(
    /\.Live\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
  );

  return {
    project,
    platform,
    account,
    region,
    environment,
    version,
    path,
  };
};

module.exports = getParamsFromLiveFolderPath;
