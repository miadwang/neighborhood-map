module.exports = {
  entry: './src/js/app.js',
  output: {
    path: './dist/', //For build
    filename: 'bundle.js',
    publicPath: '/dist/' //For dev server
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css'}
    ]
  }
};
