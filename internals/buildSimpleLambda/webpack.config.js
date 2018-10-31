const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = ({
  entry, mode = 'production', projectRoot, bundleDeps, whitelist = []
}) => {
  const externals = !bundleDeps
    ? [
      nodeExternals({
        /* background-tasks, friend-requests are es2015 modules which can be tree shaked and transpiled */
        /* cognito-to-voximplant-id is just small, bundle it (and errors when trying to add as it is bitbucket version) */
        modulesDir: path.join(projectRoot, 'node_modules'),
        whitelist: [
          '@slswt/javascript',
          ...whitelist
        ],
      }),
    ]
    : [];
  const base = require(path.join(projectRoot, 'webpack.config.js'));
  return {
    optimization: {
      // We no not want to minimize our code.
      minimize: false,
    },
    performance: {
      // Turn off size warnings for entry points
      hints: false,
    },
    stats: 'verbose',
    ...base,
    entry,
    externals,
    mode,
    target: 'node',
    output: {
      /* memory fs path */
      path: '/',
      filename: '[contenthash].service.js',
      libraryTarget: 'commonjs2',
    },
  };
};
