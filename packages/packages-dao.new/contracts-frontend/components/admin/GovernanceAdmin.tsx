import { VStack } from '@chakra-ui/layout'
import { Heading, Text } from '@chakra-ui/react'
import { config } from '../../config'
import { useTimelockETHBalance } from '../../lib/contractWrappers/timelock'
import { showEther } from '@create-nft-dao/shared'
import { EtherscanLink } from '../EtherscanLink'
import { TallyLink } from '../TallyLink'

export const GovernanceAdmin = () => {
  const timelockETHBalance = useTimelockETHBalance()

  return (
    <VStack spacing={16} alignItems="flex-start">
      <VStack spacing={4} alignItems="flex-start">
        <Heading as="h3" size="lg">
          Governor
        </Heading>
        <Text>
          Contract address:{' '}
          <EtherscanLink
            address={config.governorAddress}
            linkText={config.governorAddress}
          />
        </Text>
        <Text>
          <TallyLink linkText="See your Governor on Tally" />
        </Text>
      </VStack>
      <VStack spacing={4} alignItems="flex-start">
        <Heading as="h3" size="lg">
          Timelock
        </Heading>
        <Text color="gray.400" fontSize="sm">
          The treasury and executor of Governor.
        </Text>
        <Text>
          Contract address:{' '}
          <EtherscanLink
            address={config.timelockAddress}
            linkText={config.timelockAddress}
          />
        </Text>
        <Text>Balance: {showEther(timelockETHBalance)}</Text>
      </VStack>
    </VStack>
  )
}
