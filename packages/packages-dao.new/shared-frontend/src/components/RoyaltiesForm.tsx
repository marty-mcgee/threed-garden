import {
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Radio,
  RadioGroup,
  HStack,
  Link,
} from '@chakra-ui/react'
import { useState } from 'react'

export type RoyaltiesParams = {
  royaltiesBPs: number
  isRoyaltiesRecipientOverrideEnabled: boolean
  royaltiesRecipientOverride: string
}

export const RoyaltiesForm = ({ values, onValuesChange }) => {
  const [sharesFormValue, setSharesFormValue] = useState(
    (values.royaltiesBPs ? values.royaltiesBPs / 100 : 0).toString()
  )

  function onTokenRoyaltiesBPsChange(e) {
    setSharesFormValue(e)

    const newValues = Object.assign({}, values)

    const currentValue = e ? parseFloat(e) : 0
    newValues.royaltiesBPs = currentValue * 100

    onValuesChange(newValues)
  }

  function onTokenRoyaltiesRecipientOverrideEnabledChange(e) {
    const newValues = Object.assign({}, values)

    newValues.isRoyaltiesRecipientOverrideEnabled = parseInt(e) === 1

    onValuesChange(newValues)
  }

  function onTokenRoyaltiesRecipientOverrideChange(e) {
    const newValues = Object.assign({}, values)

    newValues.royaltiesRecipientOverride = e.target.value

    onValuesChange(newValues)
  }

  return (
    <VStack>
      <FormControl id="token-royaltypercent">
        <FormLabel>Resell royalties %</FormLabel>
        <NumberInput
          defaultValue={0}
          step={0.1}
          min={0}
          max={100}
          value={sharesFormValue}
          onChange={onTokenRoyaltiesBPsChange}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormHelperText>
          For every resell transaction, what percentage of the transaction value
          should be paid as royalties, in adherence to{' '}
          <Link
            isExternal
            href="https://eips.ethereum.org/EIPS/eip-2981"
            tabIndex={-1}
          >
            EIP-2981
          </Link>
          . Rarible honors this new standard, while OpenSea doesn't (we believe
          it will at some point).{' '}
          <Link
            isExternal
            href="https://support.opensea.io/hc/en-us/articles/1500009575482-How-do-royalties-work-on-OpenSea-"
            tabIndex={-1}
          >
            You may configure royalties on OpenSea in their collection editor
            UI.
          </Link>
        </FormHelperText>
      </FormControl>
      <FormControl id="token-royaltiesoverrideradio" isRequired>
        <FormLabel>Royalties recipient</FormLabel>
        <RadioGroup
          defaultValue="0"
          value={values.isRoyaltiesRecipientOverrideEnabled ? '1' : '0'}
          onChange={onTokenRoyaltiesRecipientOverrideEnabledChange}
        >
          <HStack spacing={8}>
            <Radio value="0">Your DAO (default)</Radio>
            <Radio value="1">Override with a different address</Radio>
          </HStack>
        </RadioGroup>
        <FormHelperText>
          Minting revenue is configured in the section below. This is only about
          where resell royalties should go. By default resell royalties are
          directed to the DAO. If you'd like another address to received
          royalties choose to override and add the recipient's address.
        </FormHelperText>
      </FormControl>
      {values.isRoyaltiesRecipientOverrideEnabled ? (
        <FormControl id="token-royaltiesRecipientOverride" isRequired>
          <FormLabel>Royalties recipient override</FormLabel>
          <Input
            type="text"
            value={values.royaltiesRecipientOverride}
            onChange={onTokenRoyaltiesRecipientOverrideChange}
          />
          <FormHelperText>e.g. your MetaMask address.</FormHelperText>
        </FormControl>
      ) : (
        <></>
      )}
    </VStack>
  )
}
