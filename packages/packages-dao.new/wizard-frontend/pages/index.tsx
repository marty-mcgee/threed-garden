import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { ChainId, useEthers, useSendTransaction } from '@usedapp/core'
import { providers, utils } from 'ethers'
import React, { useEffect, useReducer, useState } from 'react'
import { Layout } from '@create-nft-dao/shared'
import {
  DEFAULT_TOKEN_SUPPLY,
  DEFAULT_TOKEN_PRICE,
  DEFAULT_MAX_MINTS,
  DEFAULT_TIMELOCK_DELAY,
  DEFAULT_PROP_THRESHOLD,
  DEFAULT_VOTING_DELAY,
  DEFAULT_VOTING_PERIOD,
  DEFAULT_QUORUM_NUMERATOR,
  DEFAULT_CREATOR_PERCENTAGE,
  DEFAULT_SALE_START_DELAY,
} from '../lib/contractUtils'
import { MintingFilterInputs } from '../components/MintingFilterInputs'
import { RoyaltiesParams } from '@create-nft-dao/shared'
import { MintingFilterParmas, StateType } from '../lib/wizardTypes'
import { wizardReducer } from '../lib/wizardReducerEventHandlers'
import { clone } from '../lib/deployer'
import { TokenInputs } from '../components/TokenInputs'
import { MinterInputs } from '../components/MinterInputs'
import { GovernorInputs } from '../components/GovernorInputs'
import { ClonesView } from '../components/ClonesView'
import { Web3Provider } from '@ethersproject/providers'
import { ChainSelector } from '../components/ChainSelector'

/**
 * Constants & Helpers
 */
const localProvider = new providers.StaticJsonRpcProvider(
  'http://localhost:8545'
)

/**
 * Component
 */
function getDefaultStartBlock(library: Web3Provider): number {
  return library && library.getSigner().provider.blockNumber > 0
    ? library.getSigner().provider.blockNumber + DEFAULT_SALE_START_DELAY
    : 0
}

const initialState: StateType = {
  isLoading: false,
  tokenConfig: {
    name: '',
    symbol: '',
    baseURI: '',
    contractInfoURI: '',
  },
  minterConfig: {
    implementationIndex: 0,
    maxTokens: DEFAULT_TOKEN_SUPPLY,
    tokenPrice: DEFAULT_TOKEN_PRICE,
    maxMintsPerTx: DEFAULT_MAX_MINTS,
    creatorPercentage: DEFAULT_CREATOR_PERCENTAGE,
    startingBlock: 0,
    extraInitCallData: '',
  },
  governorConfig: {
    name: '',
    proposalThreshold: DEFAULT_PROP_THRESHOLD,
    votingDelay: DEFAULT_VOTING_DELAY,
    votingPeriod: DEFAULT_VOTING_PERIOD,
    quorumNumerator: DEFAULT_QUORUM_NUMERATOR,
    timelockDelay: DEFAULT_TIMELOCK_DELAY,
    upgradable: true,
  },
  mintingFilterConfig: {
    useMintingFilter: false,
    tokens: [],
  },
  royaltiesConfig: {
    royaltiesBPs: 0,
    isRoyaltiesRecipientOverrideEnabled: false,
    royaltiesRecipientOverride: '',
  },
  clones: null,
}

function HomeIndex(): JSX.Element {
  const [state, dispatch] = useReducer(wizardReducer, initialState)
  const { account, chainId, library } = useEthers()
  const [clonesBlockNumber, setClonesBlockNumber] = useState(0)
  const [
    didSetStartBlockWithLatestChainValue,
    setDidSetStartBlockWithLatestChainValue,
  ] = useState(false)

  useEffect(() => {
    if (
      getDefaultStartBlock(library) !== 0 &&
      !didSetStartBlockWithLatestChainValue
    ) {
      setStartingBlockDefaultValue(getDefaultStartBlock(library))
      setDidSetStartBlockWithLatestChainValue(true)
    }
  }, [getDefaultStartBlock(library)])

  const isLocalChain =
    chainId === ChainId.Localhost || chainId === ChainId.Hardhat

  // Use the localProvider as the signer to send ETH to our wallet
  const { sendTransaction } = useSendTransaction({
    signer: localProvider.getSigner(),
  })

  async function deployClones(e) {
    e.preventDefault()
    if (!library) {
      // TODO
    }

    dispatch({
      type: 'SET_LOADING',
      isLoading: true,
    })

    try {
      const cloneResult = await clone(account, library, state, chainId)

      setClonesBlockNumber(cloneResult.clonesBlockNumber)
      dispatch({
        type: 'SET_CLONES',
        clones: cloneResult.clones,
      })
    } catch (e) {
      // TODO
    }

    dispatch({
      type: 'SET_LOADING',
      isLoading: false,
    })
  }

  function sendFunds(): void {
    sendTransaction({
      to: account,
      value: utils.parseEther('1'),
    })
  }

  function setStartingBlockDefaultValue(startingBlock: number) {
    dispatch({
      type: 'SET_MINTER_CONFIG',
      minterConfig: {
        ...state.minterConfig,
        startingBlock: startingBlock,
      },
    })
  }

  function onTokenConfigChange(newValues) {
    dispatch({
      type: 'SET_TOKEN_CONFIG',
      tokenConfig: newValues,
    })
  }

  function onRoyaltiesConfigChange(newValues: RoyaltiesParams) {
    dispatch({
      type: 'SET_ROYALTIES_CONFIG',
      royaltiesConfig: newValues,
    })
  }

  function onMinterConfigChange(newValues) {
    dispatch({
      type: 'SET_MINTER_CONFIG',
      minterConfig: newValues,
    })
  }

  function onGovernorConfigChange(newValues) {
    dispatch({
      type: 'SET_GOVERNOR_CONFIG',
      governorConfig: newValues,
    })
  }

  function onMintingFilterConfigChange(newValues: MintingFilterParmas) {
    dispatch({
      type: 'SET_MINTING_FILTER_CONFIG',
      mintingFilterConfig: newValues,
    })
  }

  const layoutProps = {
    title: 'Create NFT DAO: Wizard',
  }
  const navbarLinks = [
    {
      href: '/',
      label: 'Home',
    },
  ]

  return (
    <Layout customMeta={layoutProps} navbarLinks={navbarLinks}>
      <Heading as="h1" mb="8" px={4}>
        Create NFT DAO 🧙‍♀️
      </Heading>
      <Box maxWidth="container.sm" px={4}>
        <Heading as="h2" mb={6} mt={6}>
          1. Connect wallet & select chain
        </Heading>
        <ChainSelector />
        <form onSubmit={deployClones}>
          <TokenInputs
            tokenConfig={state.tokenConfig}
            onTokenConfigChange={onTokenConfigChange}
            royaltiesConfig={state.royaltiesConfig}
            onRoyaltiesConfigChange={onRoyaltiesConfigChange}
          />
          <MinterInputs
            minterConfig={state.minterConfig}
            onMinterConfigChange={onMinterConfigChange}
            defaultStartBlock={getDefaultStartBlock(library)}
          />

          <MintingFilterInputs
            values={state.mintingFilterConfig}
            onValuesChange={onMintingFilterConfigChange}
          />
          <GovernorInputs
            governorConfig={state.governorConfig}
            onGovernorConfigChange={onGovernorConfigChange}
          />
          <Box>
            <Button
              name="submit"
              type="submit"
              mt={8}
              size="lg"
              colorScheme="teal"
              isLoading={state.isLoading}
              isDisabled={!library}
            >
              Deploy Clones
            </Button>
          </Box>
        </form>
      </Box>
      {state.clones !== null ? (
        <ClonesView
          clones={state.clones}
          clonesBlockNumber={clonesBlockNumber}
          governorName={state.governorConfig.name}
          needsVerification={state.governorConfig.upgradable}
        />
      ) : (
        <></>
      )}
      {chainId == ChainId.Localhost ? (
        <Box maxWidth="container.sm" mt={16} ms={4}>
          <Text mb="4">This button only works on a Local Chain.</Text>
          <Button onClick={sendFunds} isDisabled={!isLocalChain}>
            Send Funds From Local Hardhat Chain
          </Button>
        </Box>
      ) : (
        <></>
      )}
    </Layout>
  )
}

export default HomeIndex
