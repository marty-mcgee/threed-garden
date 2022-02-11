import {
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  RadioGroup,
  Radio,
} from '@chakra-ui/react'

export const MinterInputs = ({
  minterConfig,
  onMinterConfigChange,
  defaultStartBlock,
}) => {
  function onMinterMaxTokensChange(e) {
    const newValues = Object.assign({}, minterConfig)
    newValues.maxTokens = e
    onMinterConfigChange(newValues)
  }

  function onMinterPriceChange(e) {
    const newValues = Object.assign({}, minterConfig)
    newValues.tokenPrice = e
    onMinterConfigChange(newValues)
  }

  function onMinterMaxMintsChange(e) {
    const newValues = Object.assign({}, minterConfig)
    newValues.maxMintsPerTx = e
    onMinterConfigChange(newValues)
  }

  function onMinterCreatorSharesChange(e) {
    const newValues = Object.assign({}, minterConfig)
    newValues.creatorPercentage = e
    onMinterConfigChange(newValues)
  }

  function onMinterStartBlockChange(e) {
    const newValues = Object.assign({}, minterConfig)
    newValues.startingBlock = e
    onMinterConfigChange(newValues)
  }

  function onMinterTypeChange(e) {
    const newValues = Object.assign({}, minterConfig)
    newValues.implementationIndex = e
    onMinterConfigChange(newValues)
  }

  return (
    <>
      <Heading as="h2" mb={6} mt={6}>
        3. Minter
      </Heading>
      <VStack spacing={6}>
        <FormControl id="minter-totalsupply" isRequired>
          <FormLabel>Total supply</FormLabel>
          <NumberInput
            defaultValue={10000}
            step={100}
            min={1}
            value={minterConfig.maxTokens}
            onChange={onMinterMaxTokensChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            The maximum number of tokens that can be minted, including tokens
            minted by the creator and the project's users.
          </FormHelperText>
        </FormControl>
        <FormControl id="minter-price" isRequired>
          <FormLabel>Price (ETH)</FormLabel>
          <NumberInput
            defaultValue={0.01}
            step={0.01}
            min={0.000001}
            value={minterConfig.tokenPrice.toString()}
            onChange={onMinterPriceChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            The price your users will need to pay in ETH in order to mint a
            token.
          </FormHelperText>
        </FormControl>
        <FormControl id="minter-creatorshares" isRequired>
          <FormLabel>Creator shares %</FormLabel>
          <NumberInput
            defaultValue={5}
            step={1}
            min={0}
            max={100}
            value={minterConfig.creatorPercentage}
            onChange={onMinterCreatorSharesChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            How to split the ETH revenue pie? Enter how much you'd like to
            receive in percents, and the rest will go to the DAO treasury.
          </FormHelperText>
        </FormControl>
        <FormControl id="minter-startblock" isRequired>
          <FormLabel>Sale start block</FormLabel>
          <NumberInput
            defaultValue={defaultStartBlock}
            step={300} // a bit more than an hour
            value={minterConfig.startingBlock.toString()}
            onChange={onMinterStartBlockChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            Each block is roughly 13 seconds. 24 hours is roughly 6646 blocks.
            Remember the final number should be the latest block plus the delay
            you want to add.
          </FormHelperText>
        </FormControl>
        <FormControl id="minter-type" isRequired>
          <FormLabel>Minting strategy</FormLabel>
          <RadioGroup
            defaultValue="0"
            value={minterConfig.implementationIndex.toString()}
            onChange={onMinterTypeChange}
          >
            <HStack spacing={8}>
              <Radio value="0">In sequence</Radio>
              <Radio value="1">By token ID</Radio>
            </HStack>
          </RadioGroup>
          <FormHelperText>
            In sequence means a buyer's only input is how many tokens to mint.
            By token ID, means buyers will mint one-at-a-time, and get to choose
            a specific token ID to mint.
          </FormHelperText>
        </FormControl>
        {minterConfig.implementationIndex == 0 ? (
          <FormControl id="minter-maxmints" isRequired>
            <FormLabel>Max mints per transaction</FormLabel>
            <NumberInput
              defaultValue={10}
              step={1}
              min={1}
              value={minterConfig.maxMintsPerTx}
              onChange={onMinterMaxMintsChange}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>
              This is meant to add some friction against those who would want to
              mint many tokens at once. This friction is helpful in ensuring a
              more diverse set of token owners.
            </FormHelperText>
          </FormControl>
        ) : (
          <></>
        )}
      </VStack>
    </>
  )
}
