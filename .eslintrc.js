module.exports = {
  // root: true,
  env: {
    node: true,
    es6: true,
    browser: true,
  },

  extends: [
    // '../common/.eslintrc.js',
    'plugin:@typescript-eslint/recommended', // common
    'plugin:react/recommended', // common
    // 'airbnb', // needed ?
    'plugin:prettier/recommended', // common
    'plugin:@next/next/recommended', // this app
  ],

  // plugins: [
  //   '@typescript-eslint', // common
  //   'react', // common
  //   'prettier', // common
  //   '@next/next', // ?? no such package 'eslint-plugin-next', only 'eslint-config-next'
  // ],

  // parser: '@babel/eslint-parser',
  parser: '@typescript-eslint/parser',
  parserOptions: {
    requireConfigFile: false, // no babel config needed
    project: './tsconfig.json',
    tsconfigRootDir: '.',
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports,
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX,
      modules: true,
      experimentalObjectRestSpread: true,
    },
    projectFolderIgnoreList: [
      'node_modules/*',
      'node_modules',
      'dist',
      'build',
      '.yarn',
      'build-utils',
      'docs',
      './src/generated/*',
      'generated/*',
      '.next/*',
      '.next'
    ],
  },

  // ignorePatterns: ['*.js', '*.jsx', 'src/_testing', 'ThreeDGarden.tsx', 'ThreeDGarden1.tsx'], // ignoring here works ?? no

  // overrides: [
  //   {
  //     files: ['*.ts', '*.tsx'], // Your TypeScript files extension

  //     // As mentioned in the comments, you should extend TypeScript plugins here,
  //     // instead of extending them outside the `overrides`.
  //     // If you don't want to extend any rules, you don't need an `extends` attribute.
  //     // extends: [
  //     //   'plugin:@typescript-eslint/recommended',
  //     //   // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
  //     // ],

  //     parserOptions: {
  //       project: ['./tsconfig.json'], // Specify it only for TypeScript files
  //     },
  //   },
  // ],

  settings: {
    'import/resolver': {
      typescript: {},
    },
    'react': {
      // 'createClass': 'createReactClass', // Regex for Component Factory to use,
      //                                    // default to 'createReactClass'
      // 'pragma': 'React',  // Pragma to use, default to 'React'
      // 'fragment': 'Fragment',  // Fragment to use (may be a property of <pragma>), default to 'Fragment'
      'version': 'detect', // React version. 'detect' automatically picks the version you have installed.
                           // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
                           // It will default to 'latest' and warn if missing, and to 'detect' in the future
      // 'flowVersion': '0.53' // Flow version
    },
  },

  rules: {
    'arrow-body-style': 'off',
    // ['error', 'as-needed', { requireReturnForObjectLiteral: true }], // 'as-needed' is default | 'always'

    // 'react/no-unstable-nested-components': [
    //   'off' | 'warn' | 'error',
    //   { 'allowAsProps': true | false }
    // ],
    'react/no-unstable-nested-components': 'off',

    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'import/no-anonymous-default-export': 'off',

    '@next/next/no-img-element': 'off',

    // add new line above comment
    // 'lines-around-comment': [
    //   'error',
    //   {
    //     beforeLineComment: true,
    //     beforeBlockComment: true,
    //     allowBlockStart: true,
    //     allowClassStart: true,
    //     allowObjectStart: true,
    //     allowArrayStart: true,
    //   },
    // ],

    // add new line above return
    // 'newline-before-return': 'error',

    // add new line below import
    'import/newline-after-import': [
      'warn',
      {
        count: 1,
      },
    ],

    // add new line after each var, const, let declaration
    // 'padding-line-between-statements': [
    //   'error',
    //   { blankLine: 'always', prev: ['export'], next: ['*'] },
    //   { blankLine: 'always', prev: ['*'], next: ['multiline-const', 'multiline-let', 'multiline-var', 'export'] },
    // ],

    // from previous

    'react/function-component-definition': [
      2,
      {
        namedComponents: ['arrow-function', 'function-declaration'],
        unnamedComponents: ['arrow-function', 'function-expression'],
      },
    ],
    'react/require-default-props': 'off',
    'react/prop-types': 'off',
    'no-shadow': 'off',
    'react/jsx-props-no-spreading': 'off',
    // 'import/extensions': [
    //   'error',
    //   'ignorePackages',
    //   {
    //     'ts': 'never',
    //     'tsx': 'never',
    //     'js': 'never'
    //   }
    // ],
    'import/extensions': [
      'error',
      'never',
      {
        ignorePackages: true,
      },
    ],
    // 'react/jsx-filename-extension': [
    //   'warn',
    //   {
    //     extensions: ['.ts', '.tsx', '.js', '.jsx'],
    //   },
    // ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
    // CONSOLE
    'no-console': 'off',
    // 'no-restricted-syntax': [
    //   'error',
    //   {
    //     'selector': 'CallExpression[callee.object.name='console'][callee.property.name!=/^(log|warn|error|info|trace)$/]',
    //     'message': 'Unexpected property on console object was called'
    //   }
    // ],
    // UNUSED VARS
    'no-unused-vars': 'off',
    // [
    //   'error',
    //   { 'vars': 'local', 'args': 'after-used', 'ignoreRestSiblings': false }
    // ]
    // TERNARY OPERATORS
    'no-nested-ternary': 'off',
    // ELSE-IF RETURNS
    'no-else-return': [
      'off',
      {
        allowElseIf: true,
      },
    ],
    // 'no-else-returns': 'off',
    // 'object-shorthand': ['error', 'consistent-as-needed']

    // ** CHANGES TO PASS ESLINT, BUT NEED ADDRESSING
    'object-shorthand': 'off',
    'react/no-array-index-key': 'off',
    'react/destructuring-assignment': 'off',
    'prefer-arrow-callback': 'off',
    'no-param-reassign': 'off',
    'no-promise-executor-return': 'off',
    'import/prefer-default-export': 'off',
    radix: 'off',
    'import/no-unresolved': 'off',
    'react/jsx-no-useless-fragment': 'off',
    camelcase: 'off',
    'react/self-closing-comp': 'off',
    'no-useless-return': 'off',
    'prefer-template': 'off',
    'dot-notation': 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': 'off',
    'prefer-destructuring': 'off',
    'padding-line-between-statements': 'off',
    'no-undef': 'off',
    'no-restricted-globals': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-const': 'off',
    'no-unused-expressions': 'off',
    'no-sequences': 'off',
    'no-use-before-define': 'off',
    'no-plusplus': 'off',
    'one-var': 'off',
    yoda: 'off',
    'prefer-rest-params': 'off',
    'no-var': 'off',
    'no-void': 'off',
    'no-multi-assign': 'off',
    'no-return-assign': 'off',
    'func-names': 'off',
    'no-cond-assign': 'off',
    'vars-on-top': 'off',
    'no-unreachable-loop': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'valid-typeof': 'off',

    'block-scoped-var': 'off',
    'no-redeclare': 'off',
    'prefer-spread': 'off',
    'prefer-exponentiation-operator': 'off',
    'no-restricted-properties': 'off',
    'no-lonely-if': 'off',
    'no-bitwise': 'off',
    'new-cap': 'off',
    'default-case': 'off',
    'no-continue': 'off',
    'no-labels': 'off',

    'prefer-promise-reject-errors': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',

    eqeqeq: 'off',
    'no-self-compare': 'off',
    'import/order': 'off',
    'no-extend-native': 'off',
    'no-new': 'off',
    'no-empty': 'off',
    'spaced-comment': 'off',
    'operator-assignment': 'off',
    'no-extra-label': 'off',
    'no-label-var': 'off',
    'lines-around-directive': 'off',
    'no-unneeded-ternary': 'off',
    'array-callback-return': 'off',
    'prefer-object-spread': 'off',
    'no-useless-escape': 'off',
    'react/jsx-curly-brace-presence': 'off',
    'import/no-cycle': 'off',
    'no-prototype-builtins': 'off',
    'no-throw-literal': 'off',
    'no-loss-of-precision': 'off',
    'no-new-func': 'off',
    'global-require': 'off',
    'no-array-constructor': 'off',
    'import/extensions': 'off',
    'import/no-duplicates': 'off',
    'react/no-danger': 'off',
    'no-alert': 'off',
    'no-loop-func': 'off',
    'no-inner-declarations': 'off',
    'no-case-declarations': 'off',
    'no-fallthrough': 'off',

    // 'rulename': 'off',
  },
}
