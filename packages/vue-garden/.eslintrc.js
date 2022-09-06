// eslint rc.js
module.exports = {
  // look in current directory for src
  root: true,
  // define your environment
  env: {
    // node: true,
    browser: true,
    es2021: true,
  },
  // packages to extend
  extends: [
    "eslint:recommended", 
    "plugin:vue/vue3-recommended", 
    "prettier"
  ],
  // override/add rules settings
  rules: {
    "vue/multi-word-component-names": "off",
  },
  // parser options
  parserOptions: {
    ecmaVersion: 12, // "latest"
    sourceType: "module",
  },
}
