const path = require('path');

module.exports = {
  entry: './src/index.js', // Your entry point file
  output: {
    filename: 'bundle.js', // The output bundle file name
    path: path.resolve(__dirname, './Final'), // Absolute path to the output directory
  },
  devServer: {
    port: 3000,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Example: logging middleware
      devServer.app.use((req, res, next) => {
        console.log('Request received:', req.url);
        next();
      });

      return middlewares;
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Apply the loader to all .js files
        exclude: /node_modules/, // Exclude the node_modules directory
        use: {
          loader: 'babel-loader', // Use the babel-loader to transpile the files
        },
      },
    ],
  },
  plugins: [
    // other plugins,
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
    }),
  ],
};
