import { VStack, Heading, Text } from '@chakra-ui/react'
import { Table, Thead, Tbody, Tr, Td, Th } from '@chakra-ui/react'
import { useEthers } from '@usedapp/core'
import { ConnectToTally } from './ConnectToTally'
import { EtherscanVerifyProxies } from './EtherscanVerifyProxies'

export const ClonesView = ({
  clones,
  clonesBlockNumber,
  governorName,
  needsVerification,
}) => {
  const { chainId } = useEthers()

  const tallyHeadingIndex = needsVerification ? '3' : '2'
  return (
    <VStack
      alignItems="flex-start"
      spacing={6}
      maxWidth="container.sm"
      p={4}
      ms={4}
      mt={8}
      bg="gray.100"
    >
      <Heading as="h2" size="lg" mb={4}>
        Your NFT DAO is deployed!
      </Heading>
      <VStack spacing={2} alignItems="flex-start">
        <Heading as="h3" size="md">
          1. Save your contract addresses
        </Heading>
        <Text color="gray.600" fontSize="sm">
          So you can easily find contracts later. You can always find them again
          on Etherscan, in the transaction you just sent.
        </Text>
        <Table variant="unstyled" mt={8}>
          <Thead>
            <Tr>
              <Th>Contract</Th>
              <Th>Address</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>NFT</Td>
              <Td>{clones.token}</Td>
            </Tr>
            <Tr>
              <Td>Minter</Td>
              <Td>{clones.minter}</Td>
            </Tr>
            <Tr>
              <Td>Governor</Td>
              <Td>{clones.governor}</Td>
            </Tr>
            <Tr>
              <Td>Timelock</Td>
              <Td>{clones.timelock}</Td>
            </Tr>
          </Tbody>
        </Table>
      </VStack>
      {needsVerification ? (
        <VStack spacing={4} alignItems="flex-start" width="100%">
          <Heading as="h3" size="md">
            2. Verify your contracts on Etherscan
          </Heading>
          <EtherscanVerifyProxies
            governorAddress={clones.governor}
            timelockAddress={clones.timelock}
          />
        </VStack>
      ) : (
        <></>
      )}
      <VStack spacing={4} alignItems="flex-start">
        <Heading as="h3" size="md">
          {tallyHeadingIndex}. Manage your DAO on Tally
        </Heading>
        <ConnectToTally
          orgName={governorName}
          tokenAddress={clones.token}
          chainId={chainId}
          startBlock={clonesBlockNumber}
          governanceAddress={clones.governor}
        />
      </VStack>
    </VStack>
  )
}
