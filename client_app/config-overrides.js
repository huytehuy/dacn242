const webpack = require('webpack');

module.exports = function override(config) {
  // Đảm bảo config.resolve tồn tại
  config.resolve = config.resolve || {};
  config.resolve.fallback = config.resolve.fallback || {};

  // Thêm fallbacks cho các module Node.js core
  Object.assign(config.resolve.fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "fs": false,
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "util": require.resolve("util"),
    "assert": require.resolve("assert"),
    "url": require.resolve("url")
  });
  
  // Thêm plugins
  if (!config.plugins) config.plugins = [];
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    })
  );
  
  return config;
};