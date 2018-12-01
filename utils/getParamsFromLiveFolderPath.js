const getParamsFromLiveFolderPath = (liveFolder) => {
  const [,
    project,
    environment,
    version,
    path,
  ] = liveFolder.match(
    /\.Live\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
  );

  return {
    project,
    environment,
    version,
    path,
  };
};

module.exports = getParamsFromLiveFolderPath;
