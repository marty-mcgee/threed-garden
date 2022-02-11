import { ChainId, useEthers } from '@usedapp/core'
import { Link } from '@chakra-ui/react'

export const EtherscanLink = ({ address, linkText }) => {
  const { chainId } = useEthers()

  let etherscanLink = ''
  if (chainId === ChainId.Rinkeby) {
    etherscanLink = `https://rinkeby.etherscan.io/address/${address}`
  } else if (chainId == ChainId.Mainnet) {
    etherscanLink = `https://etherscan.io/address/${address}`
  }

  return (
    <Link isExternal href={etherscanLink}>
      {linkText}
    </Link>
  )
}
