import { ChainId, useEthers } from '@usedapp/core'
import { Link } from '@chakra-ui/react'
import { config } from '../config'

export const TallyLink = ({ linkText }) => {
  const { chainId } = useEthers()

  // TODO: support mainnet
  let tallyLink = ''
  if (chainId === ChainId.Rinkeby) {
    tallyLink = `https://alpha.withtally.com/governance/eip155:4:${config.governorAddress}`
  }

  return (
    <Link isExternal href={tallyLink}>
      {linkText}
    </Link>
  )
}
