import {
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { IconButton } from '@chakra-ui/button'

export const MintingFilterNFTsInputs = ({ values, onValuesChange }) => {
  const onAddClick = (e) => {
    const newValues = values.slice()

    newValues.push({
      address: '',
      minBalance: 1,
    })

    onValuesChange(newValues)
  }

  const onContractAddressChange = (e) => {
    const newValues = values.slice()

    const index = parseInt(e.target.id.split('-')[1])
    newValues[index].address = e.target.value

    onValuesChange(newValues)
  }

  const onMinBalanceChange = (index: number, v: string) => {
    const newValues = values.slice()

    newValues[index].minBalance = parseInt(v)

    onValuesChange(newValues)
  }

  const onDeleteToken = (index: number) => {
    const newValues = values.slice()

    newValues.splice(index, 1)

    onValuesChange(newValues)
  }

  const tokenInputs = values.map((t, index) => (
    <HStack key={index} alignItems="flex-end">
      <FormControl id={`address-${index}`} isRequired>
        <FormLabel>NFT contract address</FormLabel>
        <Input
          name={`address-${index}`}
          type="text"
          value={t.address}
          onChange={onContractAddressChange}
        />
      </FormControl>
      <FormControl id={`minbalance-${index}`} isRequired>
        <FormLabel>Minimal balance</FormLabel>
        <NumberInput
          name={`minbalance-${index}`}
          defaultValue={1}
          step={1}
          min={0}
          value={t.minBalance}
          onChange={(v) => onMinBalanceChange(index, v)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      <IconButton
        aria-label=""
        variant="ghost"
        icon={<DeleteIcon />}
        onClick={() => onDeleteToken(index)}
      />
    </HStack>
  ))

  return (
    <VStack spacing={4} alignItems="flex-start">
      <Button leftIcon={<AddIcon />} onClick={onAddClick}>
        Add NFT
      </Button>
      <VStack spacing={2} alignItems="flex-start">
        {tokenInputs}
      </VStack>
    </VStack>
  )
}
