const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'index.ts'),
  target: 'node',
  mode: 'production',
  devtool: 'eval',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
    noParse: /node_modules[\\|/](prettier|vscode-languageserver|vscode-json-languageservice)/
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
