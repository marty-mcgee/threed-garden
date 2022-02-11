import { HStack } from '@chakra-ui/react'
import React from 'react'
import { useSpecificIdMinterMintPrice } from '../../lib/contractWrappers/minter'
import { SpecificIdMinterMintForm } from './SpecificIdMinterMintForm'

export const SpecificIdMinter = () => {
  const tokenPrice = useSpecificIdMinterMintPrice()

  return (
    <HStack spacing="20">
      <SpecificIdMinterMintForm tokenPrice={tokenPrice} />
    </HStack>
  )
}
