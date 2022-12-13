// ==============================================================
// RESOURCES

/** =============================================================
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * See: ./config/app.config.ts for configuration, such as TARGET_NETWORK
 * See: ../common/src/config/appContracts.config.ts and ../common/src/config/externalContracts.config.ts
 *      to configure your contracts
 * See: pageList variable below to configure your pages
 * See: ../common/src/config/web3Modal.config.ts to configure the web3 modal
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * =========================================================== */

'use client'

// NextJS Imports
import { NextPage } from 'next'

// React Imports
import { ReactElement } from 'react'

// Component + Layout (+ Type) Imports
import { EthPageFooter, EthPageHeader, createTabsAndPages, TContractPageList } from '#/ui/eth'

// ETH -- CONTRACTS + HOOKS Imports
import { GenericContract } from 'eth-components/ant/generic-contract'
import { useContractReader, useBalance, useEthersAdaptorFromProviderOrSigners, useEventListener } from 'eth-hooks'
import { useEthersAppContext } from 'eth-hooks/context'
import { useDexEthPrice } from 'eth-hooks/dapps'
import { asEthersAdaptor } from 'eth-hooks/functions'

// Types + Interfaces Imports
import { useLoadAppContracts, useConnectAppContracts, useAppContracts } from '~common/components/context'
import { useCreateAntNotificationHolder } from '~common/components/hooks/useAntNotification'
import { useBurnerFallback } from '~common/components/hooks/useBurnerFallback'
import { useScaffoldAppProviders } from '~common/components/hooks/useScaffoldAppProviders'
import { networkDefinitions } from '~common/constants'
import { useScaffoldHooksExamples } from '~~/app/hooks/useScaffoldHooksExamples'
import {
  AVAILABLE_NETWORKS_DEFINITIONS,
  CONNECT_TO_BURNER_AUTOMATICALLY,
  LOCAL_PROVIDER,
  MAINNET_PROVIDER,
  INFURA_ID,
  BURNER_FALLBACK_ENABLED,
} from '#/lib/config/nextjsApp.config'

// Types + Interfaces Imports
import { TAppProps } from '~#/lib/types/models/TAppProps'

// =============================================================
// TYPES + INTERFACES

interface IEthPageProps {
  pageName: string
  children?: ReactElement
  appProps: TAppProps
}

/** =============================================================
 * The main component
 * @returns JSX.Element
 */
const EthPage: NextPage<IEthPageProps> = (props) => {
  // passed in by nextjs getInitalProps
  const appProps: TAppProps = props.appProps

  console.debug('EthPage props', props)

  const notificationHolder = useCreateAntNotificationHolder()

  // -----------------------------
  // Providers, signers & wallets
  // -----------------------------
  // 🛰 providers
  // see useLoadProviders.ts for everything to do with loading the right providers
  const scaffoldAppProviders = useScaffoldAppProviders({
    targetNetworks: AVAILABLE_NETWORKS_DEFINITIONS,
    connectToBurnerAutomatically: CONNECT_TO_BURNER_AUTOMATICALLY,
    localProvider: LOCAL_PROVIDER,
    mainnetProvider: MAINNET_PROVIDER,
    infuraId: INFURA_ID,
  })

  // 🦊 Get your web3 ethers context from current providers
  const ethersAppContext = useEthersAppContext()

  // if no user is found use a burner wallet on localhost as fallback if enabled
  useBurnerFallback(scaffoldAppProviders, BURNER_FALLBACK_ENABLED)

  // -----------------------------
  // Load Contracts
  // -----------------------------
  // 🛻 load contracts
  useLoadAppContracts()
  // 🏭 connect to contracts for mainnet network & signer
  const [mainnetAdaptor] = useEthersAdaptorFromProviderOrSigners(MAINNET_PROVIDER)
  useConnectAppContracts(mainnetAdaptor)
  // 🏭 connec to  contracts for current network & signer
  useConnectAppContracts(asEthersAdaptor(ethersAppContext))

  // -----------------------------
  // Hooks use and examples
  // -----------------------------
  // 🎉 Console logs & More hook examples:
  // 🚦 disable this hook to stop console logs
  // 🏹🏹🏹 go here to see how to use hooks!
  useScaffoldHooksExamples(scaffoldAppProviders)

  // ----------------------------------------
  // These are the Solidity contracts to use
  // ----------------------------------------

  // init contracts
  const yourContract = useAppContracts('YourContract', ethersAppContext.chainId)
  const threedNFT = useAppContracts('ThreeDNFT', ethersAppContext.chainId)
  const yourNFT = useAppContracts('YourNFT', ethersAppContext.chainId)
  const mainnetDai = useAppContracts('DAI', networkDefinitions.mainnet.chainId)

  // keep track of a variable from the contract in the local React state:
  const [purpose, update] = useContractReader(
    yourContract,
    yourContract?.purpose,
    [],
    yourContract?.filters.SetPurpose()
  )

  // 📟 Listen for broadcast events
  const [setPurposeEvents] = useEventListener(yourContract, 'SetPurpose', 0)

  // 💵 This hook will get the price of ETH from 🦄 Uniswap:
  const [ethPrice] = useDexEthPrice(
    scaffoldAppProviders.mainnetAdaptor?.provider,
    ethersAppContext.chainId !== 1 ? scaffoldAppProviders.currentTargetNetwork : undefined
  )

  // 💰 this hook will get your balance
  const [yourCurrentBalance] = useBalance(ethersAppContext.account)

  // -----------------------------
  // 🎇
  // -----------------------------

  // -----------------------------
  // 📃 App Page List
  // -----------------------------
  // This is the list of tabs and their contents
  const pageList: TContractPageList = {
    ethHomePage: {
      name: 'Ethereum Home',
      content: (
        <div><br/><h2>ThreeD Ethereum Home 'EthPage'</h2><br/></div>
      ),
    },
    ethPages: [
      {
        name: 'YourContract',
        content: (
          <GenericContract
            contractName='YourContract'
            contract={yourContract}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}
          />
        ),
      },
      {
        name: 'ThreeDNFT',
        content: (
          <GenericContract
            contractName='ThreeDNFT'
            contract={threedNFT}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}
          ></GenericContract>
        ),
      },
      {
        name: 'YourNFT',
        content: (
          <GenericContract
            contractName='YourNFT'
            contract={yourNFT}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}
          ></GenericContract>
        ),
      },
      {
        name: 'Mainnet-Dai',
        content: (
          <GenericContract
            contractName='DAI'
            contract={mainnetDai}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}
          />
        ),
      },
    ],
  }
  // setup pages and tabs for those pages
  const { tabMenu, pages } = createTabsAndPages(pageList)
  // set a variable to flag that Route Not Found from the expected URL Path Slug ;)
  const RouteNotFound = <h3 className='p-10 mt-10 text-xl'>Route Not Found</h3>

  // --------------------------------------------------------------------
  // 📃 Render the react components as JSX and return to function caller
  // --------------------------------------------------------------------
  return (
    <div id='ThreeD-EthPage'>
      <EthPageHeader
        scaffoldAppProviders={scaffoldAppProviders}
        price={ethPrice}
        appProps={appProps}
      />
      <div id='ThreeD-EthPage-tabMenu'>
        {tabMenu}
      </div>
      <div id='ThreeD-EthPage-pages.page'>
        {pages[props.pageName] ?? RouteNotFound}
      </div>
      <EthPageFooter
        scaffoldAppProviders={scaffoldAppProviders}
        price={ethPrice}
        appProps={appProps}
      />
      <div id='ThreeD-EthPage-notification' className='absolute bg-slate-600'>
        {notificationHolder}
      </div>
    </div>
  )
}

export default EthPage

// ==============================================================
// END EthPage<JSX.Element>.tsx
// ==============================================================
