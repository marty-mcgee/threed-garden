import {
  Box,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  VStack,
} from '@chakra-ui/react'
import { formatEther } from '@ethersproject/units'
import React, { useState } from 'react'
import { useSpecificIdMinterMint } from '../../lib/contractWrappers/minter'

export const SpecificIdMinterMintForm = ({ tokenPrice }) => {
  const [tokenIdToMint, setTokenIdToMint] = useState(1234)
  const valueToSend = tokenPrice

  const { send: mint, state: mintState } = useSpecificIdMinterMint()

  const mintClicked = () => {
    mint(tokenIdToMint, { value: valueToSend })
  }

  return (
    <VStack>
      <FormControl>
        <FormLabel>Token id to mint:</FormLabel>
        <NumberInput
          step={1}
          min={0}
          value={tokenIdToMint}
          onChange={(_, n) => setTokenIdToMint(n)}
        >
          <NumberInputField fontSize="30px" textAlign="center" padding={6} />
        </NumberInput>
      </FormControl>

      <Box>ETH: {valueToSend && formatEther(valueToSend)}</Box>
      <Button w="100%" onClick={mintClicked}>
        MINT
      </Button>

      <Box>
        {mintState.status !== 'None' ? `tx status: ${mintState.status}` : ''}
      </Box>
      <Box>
        {mintState.status === 'Exception' ? mintState.errorMessage : ''}
      </Box>
    </VStack>
  )
}
