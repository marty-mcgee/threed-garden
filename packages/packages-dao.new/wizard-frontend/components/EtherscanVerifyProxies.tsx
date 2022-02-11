import { VStack } from '@chakra-ui/react'
import { EtherscanVerifyProxy } from './EtherscanVerifyProxy'

export const EtherscanVerifyProxies = ({
  governorAddress,
  timelockAddress,
}) => {
  return (
    <VStack spacing={8} alignItems="flex-start" width="100%">
      <EtherscanVerifyProxy name="Governor" address={governorAddress} />
      <EtherscanVerifyProxy name="Timelock" address={timelockAddress} />
    </VStack>
  )
}
