import { ChainId, useEthers } from '@usedapp/core'
import { Link } from '@chakra-ui/react'
import { config } from '../config'

export const RaribleLink = ({ linkText }) => {
  const { chainId } = useEthers()

  let raribleLink = ''
  if (chainId === ChainId.Rinkeby) {
    raribleLink = `https://rinkeby.rarible.com/collection/${config.tokenAddress}`
  } else if (chainId == ChainId.Mainnet) {
    raribleLink = `https://rarible.com/collection/${config.tokenAddress}`
  }

  return (
    <Link isExternal href={raribleLink}>
      {linkText}
    </Link>
  )
}
