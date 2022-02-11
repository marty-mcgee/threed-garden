import {
  Box,
  Button,
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  VStack,
} from '@chakra-ui/react'
import { formatEther } from 'ethers/lib/utils'
import React, { useState } from 'react'
import {
  useIncrementalMinterMint,
  useMaxMintPerTx,
} from '../../lib/contractWrappers/minter'

export const IncrementalMinterMintForm = ({ tokenPrice }) => {
  const maxMintPerTx = useMaxMintPerTx()
  const [tokensToMint, setTokensToMint] = useState(1)
  const valueToSend = tokenPrice && tokenPrice.mul(tokensToMint)
  const { send: mint, state: mintState } = useIncrementalMinterMint()

  const mintClicked = () => {
    mint(tokensToMint, { value: valueToSend })
  }

  return (
    <VStack>
      <FormControl>
        <FormLabel>Tokens to mint (max {maxMintPerTx}):</FormLabel>
        <NumberInput
          step={1}
          min={0}
          max={maxMintPerTx}
          value={tokensToMint}
          onChange={(_, n) => setTokensToMint(n)}
        >
          <NumberInputField fontSize="30px" textAlign="center" padding={6} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <Box>ETH: {valueToSend && formatEther(valueToSend)}</Box>
      <Button
        w="100%"
        onClick={mintClicked}
        isLoading={mintState.status === 'Mining'}
      >
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
