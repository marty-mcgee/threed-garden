import { VStack } from '@chakra-ui/layout'
import { Button, Text, Heading } from '@chakra-ui/react'
import { useState } from 'react'
import { useMintingFilterFunction } from '../lib/contractWrappers/mintingFilter'
import { MintingFilterNFTsTable } from './MintingFilterNFTsTable'
import { MintingFilterEditNFTs } from './MintingFilterEditNFTs'
import { MintingFilterToggle } from '@create-nft-dao/shared'
import { MintingFilterNFTsInputs } from '@create-nft-dao/shared'
import { ethers } from 'ethers'

export const MintingFilterEditForm = ({
  mintingFilterAddress,
  onDeployMintingFilter,
  isDeployMintingFilterLoading,
}) => {
  const isFilterDeployed = mintingFilterAddress !== ethers.constants.AddressZero
  const [mintingFilterToggle, setMintingFilterToggle] =
    useState(isFilterDeployed)
  const [mintingFilterTokens, setMintingFilterTokens] = useState([])

  const { send: setTokenFilters, state: setTokenFiltersState } =
    useMintingFilterFunction(mintingFilterAddress, 'setTokenFilters')

  const onMintingFilterToggleChange = (newValue) => {
    setMintingFilterToggle(newValue)
  }

  const onMintingFilterTokensChange = (newValues) => {
    setMintingFilterTokens(newValues)
  }

  const onUpdateClick = () => {
    const addresses = mintingFilterTokens.map((t) => t.address)
    const balances = mintingFilterTokens.map((t) => t.minBalance)

    if (
      !isFilterDeployed &&
      mintingFilterToggle &&
      mintingFilterTokens.length > 0
    ) {
      onDeployMintingFilter(addresses, balances)
    } else if (isFilterDeployed) {
      if (!mintingFilterToggle || mintingFilterTokens.length === 0) {
        // This is weird UX, for the sake of optimizing gas for the user.
        // If we remove the filter entirely, and the user wants to re-enable it, they would
        // need to pay gas for another filter clone and init.
        // By just emptying the filter arrays, the re-enable is cheaper because it avoids
        // the cloning costs.
        setTokenFilters([], [])
      } else {
        setTokenFilters(addresses, balances)
      }
    }
  }

  return (
    <VStack spacing={6} alignItems="flex-start">
      <VStack spacing={2} alignItems="flex-start">
        <Heading as="h4" size="md">
          Current values
        </Heading>
        <Text>State: {isFilterDeployed ? 'Enabled' : 'Disabled'}</Text>
        <Text>Current required NFTs: {!isFilterDeployed ? 'None' : ''}</Text>
        {isFilterDeployed ? (
          <MintingFilterNFTsTable mintingFilterAddress={mintingFilterAddress} />
        ) : (
          <></>
        )}
      </VStack>

      <VStack spacing={4} alignItems="flex-start">
        <Heading as="h4" size="md">
          Update values
        </Heading>

        <VStack spacing={2} alignItems="flex-start">
          <MintingFilterToggle
            value={mintingFilterToggle}
            onValueChange={onMintingFilterToggleChange}
          />

          {mintingFilterToggle ? (
            isFilterDeployed ? (
              <MintingFilterEditNFTs
                mintingFilterAddress={mintingFilterAddress}
                values={mintingFilterTokens}
                onValuesChange={onMintingFilterTokensChange}
              />
            ) : (
              <MintingFilterNFTsInputs
                values={mintingFilterTokens}
                onValuesChange={onMintingFilterTokensChange}
              />
            )
          ) : (
            <></>
          )}
        </VStack>

        <Button
          onClick={onUpdateClick}
          isLoading={
            setTokenFiltersState.status === 'Mining' ||
            isDeployMintingFilterLoading
          }
        >
          Update buyer filtering
        </Button>
      </VStack>
    </VStack>
  )
}
