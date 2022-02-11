import typescript from 'rollup-plugin-typescript2'
import cleaner from 'rollup-plugin-cleaner'
import json from '@rollup/plugin-json'

import pkg from './package.json'

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      strict: false,
    },
  ],
  plugins: [json(), typescript(), cleaner({ targets: ['./dist'] })],
  external: [
    'react',
    'react-dom',
    '@chakra-ui/react',
    '@chakra-ui/icons',
    '@chakra-ui/button',
    'react/jsx-runtime',
    '@usedapp/core',
    'next/link',
    'next/head',
    'next/router',
    'ethers',
    'ethers/lib/utils',
    '@web3-react/core',
    '@web3-react/injected-connector',
    '@web3-react/walletconnect-connector',
    'blockies-ts',
    '@apollo/client',
    '@apollo/client/utilities',
    'deepmerge',
    'lodash/isEqual',
  ],
}
