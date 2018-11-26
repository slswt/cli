module.exports = {
  LAMBDA_DEPLOYMENT_BUCKET: ({ liveFolder }) => {
    const [, projectId, , , region] = liveFolder.match(
      /\.Live\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
    );
    return `lambda-deployments-${projectId}-${region}`;
  },
};
