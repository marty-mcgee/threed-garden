import { Table, Thead, Tbody, Tr, Td, Th, Text } from '@chakra-ui/react'
import { useGetTokenFilters } from '../lib/contractWrappers/mintingFilter'

export const MintingFilterNFTsTable = ({ mintingFilterAddress }) => {
  const tokenFilters = useGetTokenFilters(mintingFilterAddress)

  const tokensTableRows = tokenFilters
    ? tokenFilters.map((tokenAndBalance, index) => {
        return (
          <Tr key={index}>
            <Td>{tokenAndBalance[0]}</Td>
            <Td>{tokenAndBalance[1].toString()}</Td>
          </Tr>
        )
      })
    : undefined

  return tokensTableRows === undefined || tokensTableRows.length === 0 ? (
    <Text>None</Text>
  ) : (
    <Table variant="unstyled">
      <Thead>
        <Tr>
          <Th>NFT contract address</Th>
          <Th>Minimal balance required</Th>
        </Tr>
      </Thead>
      <Tbody>{tokensTableRows}</Tbody>
    </Table>
  )
}
