import { HStack, VStack } from '@chakra-ui/layout'
import { Heading, Text, Button, Input } from '@chakra-ui/react'
import { config } from '../../config'
import { OpenSeaLink } from '../OpenSeaLink'
import { RaribleLink } from '../RaribleLink'
import {
  useNFTName,
  useTotalSupply,
  useBaseURIEnabled,
  useBaseURI,
  useSetBaseURIEnabled,
  useSetBaseURI,
  useContractInfoURI,
  useSetContractInfoURI,
  useRoyaltyInfo,
  useSetRoyalties,
  useProxyRegistryEnabled,
  useSetProxyRegistryEnabled,
  useProxyRegistry,
  useSetProxyRegistryAndEnable,
} from '../../lib/contractWrappers/token'
import { useState } from 'react'
import { RoyaltiesForm, RoyaltiesParams } from '@create-nft-dao/shared'

export const TokenAdmin = () => {
  const totalSupply = useTotalSupply()
  const tokenName = useNFTName()
  const isBaseURIEnabled = useBaseURIEnabled()
  const baseURI = useBaseURI()
  const contractInfoURI = useContractInfoURI()

  const [baseURIFormValue, setBaseURIFormValue] = useState('')
  const [contractInfoURIFormValue, setContractInfoURIFormValue] = useState('')

  const { send: setBaseURIEnabled, state: setBaseURIEnabledState } =
    useSetBaseURIEnabled()
  const { send: setBaseURI, state: setBaseURIState } = useSetBaseURI()
  const { send: setContractInfoURI, state: setContractInfoURIState } =
    useSetContractInfoURI()

  const { royaltiesRecipient, royaltiesBPs } = useRoyaltyInfo()
  const [royaltiesFormValues, setRoyaltiesFormValues] = useState({})
  const { send: setRoyalties } = useSetRoyalties()

  const [proxyRegistryFormValue, setProxyRegistryFormValue] = useState('')
  const isProxyRegistryEnabled = useProxyRegistryEnabled()
  const proxyRegistryAddress = useProxyRegistry()
  const { send: setProxyRegistryEnabled, state: setProxyRegistryEnabledState } =
    useSetProxyRegistryEnabled()
  const {
    send: setProxyRegistryAndEnable,
    state: setProxyRegistryAndEnableState,
  } = useSetProxyRegistryAndEnable()

  const onBaseURIToggleClick = () => {
    if (isBaseURIEnabled === undefined) {
      return
    }
    setBaseURIEnabled(!isBaseURIEnabled)
  }

  const onBaseURISubmit = (e) => {
    e.preventDefault()
    setBaseURI(baseURIFormValue)
  }

  const onContractInfoURISubmit = (e) => {
    e.preventDefault()
    setContractInfoURI(contractInfoURIFormValue)
  }

  const onUpdateRoyaltiesClick = (_) => {
    const params = royaltiesFormValues as RoyaltiesParams

    let recipient = config.timelockAddress
    if (params.isRoyaltiesRecipientOverrideEnabled) {
      recipient = params.royaltiesRecipientOverride
    }

    setRoyalties(recipient, params.royaltiesBPs)
  }

  const onProxyRegistryEnabledToggleClick = () => {
    if (isProxyRegistryEnabled === undefined) {
      return
    }
    setProxyRegistryEnabled(!isProxyRegistryEnabled)
  }

  const onProxyRegistrySubmit = (e) => {
    e.preventDefault()
    setProxyRegistryAndEnable(proxyRegistryFormValue)
  }

  return (
    <VStack spacing={16} alignItems="flex-start">
      <VStack spacing={4} alignItems="flex-start">
        <Heading as="h3" size="lg">
          Name: {tokenName}
        </Heading>
        <Text>Contract address: {config.tokenAddress}</Text>
        <HStack spacing={4}>
          <OpenSeaLink linkText="View on OpenSea" />
          <RaribleLink linkText="View on Rarible" />
        </HStack>
        <Text>
          Total supply (minted so far): {totalSupply && totalSupply.toString()}
        </Text>
      </VStack>
      <VStack spacing={4} alignItems="flex-start">
        <Heading as="h3" size="lg">
          Assets URI
        </Heading>
        <VStack alignItems="flex-start">
          <Heading as="h4" size="md">
            Base URI Enabled
          </Heading>
          <HStack spacing={4}>
            <Text>
              Current value: {isBaseURIEnabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Button
              onClick={onBaseURIToggleClick}
              isLoading={setBaseURIEnabledState.status === 'Mining'}
            >
              {isBaseURIEnabled ? 'Disable' : 'Enable'}
            </Button>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            When Base URI is disabled, your NFTs use an auto-generated
            placeholder image that contains the name of your NFT and the ID of
            the asset.
          </Text>
        </VStack>
        <VStack alignItems="flex-start">
          <Heading as="h4" size="md">
            Base URI
          </Heading>
          <Text>Current value: {baseURI}</Text>
          <form onSubmit={onBaseURISubmit}>
            <HStack minW="md">
              <Input
                type="text"
                value={baseURIFormValue}
                onChange={(e) => {
                  setBaseURIFormValue(e.target.value)
                }}
              />
              <Button
                minW="min"
                type="submit"
                isDisabled={!baseURIFormValue}
                isLoading={setBaseURIState.status === 'Mining'}
              >
                Update Base URI
              </Button>
            </HStack>
          </form>
        </VStack>
        <VStack alignItems="flex-start">
          <Heading as="h4" size="md">
            Contract Info URI
          </Heading>
          <Text>Current value: {contractInfoURI}</Text>
          <form onSubmit={onContractInfoURISubmit}>
            <HStack minW="md">
              <Input
                type="text"
                value={contractInfoURIFormValue}
                onChange={(e) => {
                  setContractInfoURIFormValue(e.target.value)
                }}
              />
              <Button
                minW="min"
                type="submit"
                isDisabled={!contractInfoURIFormValue}
                isLoading={setContractInfoURIState.status === 'Mining'}
              >
                Update Contract Info URI
              </Button>
            </HStack>
          </form>
        </VStack>
      </VStack>
      <VStack spacing={6} alignItems="flex-start">
        <Heading as="h3" size="lg">
          Royalties
        </Heading>
        <VStack spacing={4} alignItems="flex-start">
          <Heading as="h4" size="md">
            Current values
          </Heading>
          <Text>
            Recipient:{' '}
            {royaltiesRecipient
              ? royaltiesRecipient.toLowerCase() ===
                config.timelockAddress.toLowerCase()
                ? 'The DAO'
                : royaltiesRecipient
              : ''}
          </Text>
          <Text>
            Royalties:{' '}
            {royaltiesBPs
              ? (royaltiesBPs.toNumber() / 100).toString() + '%'
              : ''}
          </Text>
        </VStack>
        <VStack spacing={4} alignItems="flex-start">
          <Heading as="h4" size="md">
            Update values
          </Heading>
          <RoyaltiesForm
            values={royaltiesFormValues}
            onValuesChange={setRoyaltiesFormValues}
          />
          <Button onClick={onUpdateRoyaltiesClick}>Update</Button>
        </VStack>
      </VStack>
      <VStack spacing={6} alignItems="flex-start">
        <Heading as="h3" size="lg">
          OpenSea proxy registry
        </Heading>
        <Text fontSize="sm" color="gray.400">
          This feature makes trading on OpenSea cheaper, since it removes the
          gas cost of submitting a transaction that approves OpenSea to trade
          your NFT on behalf of their users.
        </Text>
        <HStack spacing={4}>
          <Text>
            Current state: {isProxyRegistryEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Button
            onClick={onProxyRegistryEnabledToggleClick}
            isLoading={setProxyRegistryEnabledState.status === 'Mining'}
          >
            {isProxyRegistryEnabled ? 'Disable' : 'Enable'}
          </Button>
        </HStack>
        <Text>Current proxy address: {proxyRegistryAddress}</Text>
        <VStack spacing={4} alignItems="flex-start">
          <form onSubmit={onProxyRegistrySubmit}>
            <HStack minW="lg">
              <Input
                type="text"
                value={proxyRegistryFormValue}
                onChange={(e) => {
                  setProxyRegistryFormValue(e.target.value)
                }}
              />
              <Button
                minW="min"
                type="submit"
                isDisabled={!proxyRegistryFormValue}
                isLoading={setProxyRegistryAndEnableState.status === 'Mining'}
              >
                Set address and enable
              </Button>
            </HStack>
          </form>
          <Text fontSize="sm" color="gray.400">
            On the Ethereum mainnet the OpenSea proxy registry is at
            0xa5409ec958C83C3f309868babACA7c86DCB077c1. On Rinkeby it's at
            0xF57B2c51dED3A29e6891aba85459d600256Cf317.
          </Text>
        </VStack>
      </VStack>
    </VStack>
  )
}
