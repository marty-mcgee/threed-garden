import { ChakraProvider } from '@chakra-ui/react'
import {
  ArbitrumRinkeby,
  ChainId,
  Config,
  DAppProvider,
  Hardhat,
  Localhost,
  Mainnet,
  Mumbai,
  OptimismKovan,
  Rinkeby,
} from '@usedapp/core'
import type { AppProps } from 'next/app'
import React from 'react'
import { CHAIN_ID, multicallOnLocalhost } from '../config'

const config: Config = {
  readOnlyChainId: CHAIN_ID,
  readOnlyUrls: {
    [ChainId.Mainnet]: process.env.NEXT_PUBLIC_MAINNET_JSON_RPC,
    [ChainId.Rinkeby]: process.env.NEXT_PUBLIC_RINKEBY_JSON_RPC,
    [ChainId.OptimismKovan]: 'https://kovan.optimism.io',
    [ChainId.ArbitrumRinkeby]: 'https://rinkeby.arbitrum.io/rpc',
    [ChainId.Hardhat]: 'http://localhost:8545',
    [ChainId.Localhost]: 'http://localhost:8545',
    [ChainId.Mumbai]:
      'https://rpc-mumbai.maticvigil.com/v1/02ce83b56ad2783400835e64c6775f90ba09b376',
  },
  networks: [
    Mainnet,
    Rinkeby,
    Localhost,
    Hardhat,
    OptimismKovan,
    ArbitrumRinkeby,
    Mumbai,
  ],
  multicallAddresses: {
    [ChainId.Localhost]: multicallOnLocalhost,
  },
}

const MyApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  return (
    <DAppProvider config={config}>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </DAppProvider>
  )
}

export default MyApp
