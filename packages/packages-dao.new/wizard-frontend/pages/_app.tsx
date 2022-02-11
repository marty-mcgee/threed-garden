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
import { multicallOnLocalhost } from '../config'
import Script from 'next/script'

const config: Config = {
  readOnlyChainId: ChainId.Rinkeby,
  readOnlyUrls: {
    [ChainId.Mainnet]: process.env.NEXT_PUBLIC_MAINNET_JSON_RPC,
    [ChainId.Rinkeby]: process.env.NEXT_PUBLIC_RINKEBY_JSON_RPC,
    [ChainId.OptimismKovan]: 'https://kovan.optimism.io',
    [ChainId.Hardhat]: 'http://localhost:8545',
    [ChainId.Localhost]: 'http://localhost:8545',
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
        {/* Global Site Tag (gtag.js) - Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
          }}
        />
        <Component {...pageProps} />
      </ChakraProvider>
    </DAppProvider>
  )
}

export default MyApp
