import { useContractCall, useContractFunction } from '@usedapp/core'
import { utils, Contract } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { ERC721DAOTokenABI } from '@create-nft-dao/hardhat'
import { config } from '../../config'

const tokenAbi: Interface = new utils.Interface(ERC721DAOTokenABI.abi)

export const useNFTName = () => {
  const [nftName] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'name',
      args: [],
    }) || []
  return nftName
}

export const useTotalSupply = () => {
  const [totalSupply] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'totalSupply',
      args: [],
    }) || []
  return totalSupply
}

export const useBaseURIEnabled = () => {
  const [baseURIEnabled] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'baseURIEnabled',
      args: [],
    }) || []
  return baseURIEnabled
}

export const useBaseURI = () => {
  const [baseURI] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'baseURI',
      args: [],
    }) || []
  return baseURI
}

export const useSetBaseURIEnabled = () => {
  const contract = new Contract(config.tokenAddress, tokenAbi)
  return useContractFunction(contract, 'setBaseURIEnabled')
}

export const useSetBaseURI = () => {
  const contract = new Contract(config.tokenAddress, tokenAbi)
  return useContractFunction(contract, 'setBaseURI')
}

export const useContractInfoURI = () => {
  const [contractInfoURI] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'contractInfoURI',
      args: [],
    }) || []
  return contractInfoURI
}

export const useSetContractInfoURI = () => {
  const contract = new Contract(config.tokenAddress, tokenAbi)
  return useContractFunction(contract, 'setContractInfoURI')
}

export const useRoyaltyInfo = () => {
  const [royaltiesRecipient, royaltiesBPs] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'royaltyInfo',
      args: [0, 10000],
    }) || []
  return { royaltiesRecipient, royaltiesBPs }
}

export const useSetRoyalties = () => {
  const contract = new Contract(config.tokenAddress, tokenAbi)
  return useContractFunction(contract, 'setRoyalties')
}

export const useProxyRegistryEnabled = () => {
  const [proxyRegistryEnabled] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'proxyRegistryEnabled',
      args: [],
    }) || []
  return proxyRegistryEnabled
}

export const useSetProxyRegistryEnabled = () => {
  const contract = new Contract(config.tokenAddress, tokenAbi)
  return useContractFunction(contract, 'setProxyRegistryEnabled')
}

export const useProxyRegistry = () => {
  const [proxyRegistry] =
    useContractCall({
      abi: tokenAbi,
      address: config.tokenAddress,
      method: 'proxyRegistry',
      args: [],
    }) || []
  return proxyRegistry
}

export const useSetProxyRegistryAndEnable = () => {
  const contract = new Contract(config.tokenAddress, tokenAbi)
  return useContractFunction(contract, 'setProxyRegistryAndEnable')
}
