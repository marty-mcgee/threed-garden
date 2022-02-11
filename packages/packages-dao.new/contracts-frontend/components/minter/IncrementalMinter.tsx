import { HStack } from '@chakra-ui/react'
import React from 'react'
import { useIncrementalMinterMintPrice } from '../../lib/contractWrappers/minter'
import { IncrementalMinterMintForm } from './IncrementalMinterMintForm'

export const IncrementalMinter = () => {
  const tokenPrice = useIncrementalMinterMintPrice()

  return (
    <HStack spacing="20">
      <IncrementalMinterMintForm tokenPrice={tokenPrice} />
    </HStack>
  )
}
