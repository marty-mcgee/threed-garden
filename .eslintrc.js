module.exports = {
  root: true,
  env: {
    // node: true,
    browser: true,
    es2021: true
  },
  extends: [
    "eslint:recommended",
    "@vue/prettier",
    "plugin:vue/vue3-essential"
  ],
  parserOptions: {
    // parser: "babel-eslint",
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "vue"
  ],
  rules: {
    "indent": ["error", 2],
    "linebreak-style": ["error", "windows"],
    "quotes": ["error", "double"],
    "semi": ["error", "never"],
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off"
  }
}
