import { Box } from '@chakra-ui/layout'
import { Select } from '@chakra-ui/select'
import { ConnectWallet } from '@create-nft-dao/shared'
import {
  ArbitrumRinkeby,
  getChainById,
  Mumbai,
  OptimismKovan,
  Rinkeby,
  useEthers,
} from '@usedapp/core'
import React from 'react'
import { chainIdToContracts } from '../config'

export const ChainSelector = () => {
  const { chainId, library, account } = useEthers()

  const getAddChainParams = (chainId: number) => {
    const ETHER = {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    }

    if (chainId == OptimismKovan.chainId) {
      return {
        chainName: OptimismKovan.chainName,
        nativeCurrency: ETHER,
        rpcUrls: ['https://kovan.optimism.io'],
        blockExplorerUrls: ['https://kovan-optimistic.etherscan.io'],
      }
    } else if (chainId == ArbitrumRinkeby.chainId) {
      return {
        chainName: ArbitrumRinkeby.chainName,
        nativeCurrency: ETHER,
        rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io'],
      }
    } else if (chainId == Mumbai.chainId) {
      return {
        chainName: Mumbai.chainName,
        nativeCurrency: {
          name: 'Matic',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
      }
    }
  }

  const handleChangeNetwork = async (chainId) => {
    const desiredChainIdHex = `0x${chainId.toString(16)}`

    library.provider
      .request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: desiredChainIdHex,
          },
        ],
      })
      .catch((error) => {
        if (error.code === 4902) {
          return library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              { ...getAddChainParams(chainId), chainId: desiredChainIdHex },
            ],
          })
        } else {
          throw error
        }
      })
  }

  return (
    <Box>
      {account ? (
        <>
          <Select
            value={chainId}
            onChange={(e) => {
              e.preventDefault()

              const desiredChainId = Number.parseInt(e.target.value)
              handleChangeNetwork(desiredChainId)
            }}
          >
            <option value={Rinkeby.chainId}>Rinkeby</option>
            <option value={OptimismKovan.chainId}>Optimistic Kovan</option>
            <option value={ArbitrumRinkeby.chainId}>Arbitrum Rinkeby</option>
            <option value={Mumbai.chainId}>Mumbai (Polygon testnet)</option>
            <option disabled>Ethereum mainnet (coming soon)</option>
            <option disabled>Optimism (coming soon)</option>
            <option disabled>Arbitrum (coming soon)</option>
            <option disabled>Polygon MATIC (coming soon)</option>
          </Select>

          <Box fontSize={10} mt={4}>
            <Box>Chain: {getChainById(chainId).chainName}</Box>
            <Box>
              Deployer contract: {chainIdToContracts[chainId]?.deployerAddress}
            </Box>
            <Box>
              SVGPlaceholder contract:{' '}
              {chainIdToContracts[chainId]?.svgPlaceholderAddress}
            </Box>
          </Box>
        </>
      ) : (
        <Box>
          <ConnectWallet />
        </Box>
      )}
    </Box>
  )
}
