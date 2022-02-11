import {
  VStack,
  Heading,
  Text,
  HStack,
  NumberInput,
  NumberInputField,
  Button,
} from '@chakra-ui/react'
import { useState } from 'react'
import {
  useFixedPriceSequentialMinterFunction,
  useMaxMintPerTx,
} from '../../lib/contractWrappers/minter'

export const MinterAdminMaxMintsView = () => {
  const maxMintsPerTx = useMaxMintPerTx()
  const [formMaxMintsPerTx, setFormMaxMintsPerTx] = useState('')
  const { send: setMaxMintsPerTx, state: setMaxMintsPerTxState } =
    useFixedPriceSequentialMinterFunction('setMaxMintsPerTx')

  const onMaxMintsPerTxSubmit = (e) => {
    e.preventDefault()
    setMaxMintsPerTx(parseInt(formMaxMintsPerTx))
  }

  return (
    <VStack spacing={4} alignItems="flex-start">
      <Heading as="h3" size="lg">
        Max mints per transaction
      </Heading>
      <HStack>
        <Text>Current: {maxMintsPerTx}</Text>
        <form onSubmit={onMaxMintsPerTxSubmit}>
          <HStack>
            <NumberInput
              min={0}
              value={formMaxMintsPerTx}
              onChange={(s) => setFormMaxMintsPerTx(s)}
            >
              <NumberInputField />
            </NumberInput>
            <Button
              type="submit"
              isLoading={setMaxMintsPerTxState.status === 'Mining'}
            >
              Update
            </Button>
          </HStack>
        </form>
      </HStack>
    </VStack>
  )
}
