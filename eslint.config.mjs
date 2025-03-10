import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    rules: { 
      // options: 'off' | ['error', { 'ignore': ['args'] }]
      // '@next/next/no-img-element': 'off',
      '@next/next/no-assign-module-variable': 'off',
      '@next/next/no-page-custom-font': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'jsx-a11y/alt-text': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',

      // farmbot frontend: custom/temp rules
      // '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/quotes': 'off',
      '@next/next/no-img-element': 'off',
      // 'no-null/no-null': 'off',
      // 'import/no-default-export': 'off',
      // 'complexity': 'off',

    },
  }),
]

export default eslintConfig