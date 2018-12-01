module.exports = {
  LAMBDA_DEPLOYMENT_BUCKET: ({ region, liveFolder }) => {
    const [, projectId] = liveFolder.match(/\.Live\/([^/]+)\/(.+)$/);
    return `lambda-deployments-${projectId}-${region}`;
  },
};
