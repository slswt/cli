const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = ({
  entry,
  mode = 'production',
  projectRoot,
  bundleDeps,
  whitelist = [],
  localInvoke = false,
}) => {
  const externals = !bundleDeps
    ? [
      nodeExternals({
        modulesDir: path.join(projectRoot, 'node_modules'),
        whitelist: [/^@slswt\/javascript/, ...whitelist],
      }),
    ]
    : [];
  const base = require(path.join(projectRoot, 'webpack.config.js'));
  const basePlugins = base.plugins || [];
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
    plugins: localInvoke ? [
      ...basePlugins,
      new webpack.EnvironmentPlugin({
        SLSWT_LOCAL_INVOKE: true,
      }),
    ] : basePlugins,
  };
};
