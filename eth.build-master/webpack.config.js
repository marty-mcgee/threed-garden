// webpack.config.js
module.exports = {
  
  // ...
  
  // target: 'web', // default
  target: 'node',
  // target: 'node12.18',

  "browser": {
    "fs": false,
    "path": false,
    "os": false
  },

  // config.node = {
  node: {
    fs: 'empty',
  },

}