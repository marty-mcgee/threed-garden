import {
  useContractCall,
  useContractFunction,
  useEtherBalance,
} from '@usedapp/core'
import { Contract, utils } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import {
  ERC721MinterABI,
  FixedPriceSequentialMinterABI,
  FixedPriceSpecificIDMinterABI,
  FixedPriceFixedSupplyMinterABI,
} from '@create-nft-dao/hardhat'

import { config } from '../../config'

const ERC721MinterAbi: Interface = new utils.Interface(ERC721MinterABI.abi)
const FixedPriceSequentialMinterAbi: Interface = new utils.Interface(
  FixedPriceSequentialMinterABI.abi
)
const FixedPriceSpecificIDMinterAbi: Interface = new utils.Interface(
  FixedPriceSpecificIDMinterABI.abi
)

const FixedPriceFixedSupplyMinterAbi: Interface = new utils.Interface(
  FixedPriceFixedSupplyMinterABI.abi
)

export const useIsSaleActive = () => {
  const [paused] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'paused',
      args: [],
    }) || []
  return !paused
}

export const useIncrementalMinterMintPrice = () => {
  return useMintPrice(FixedPriceSequentialMinterAbi)
}

export const useSpecificIdMinterMintPrice = () => {
  return useMintPrice(FixedPriceSpecificIDMinterAbi)
}

function useMintPrice(abi: utils.Interface) {
  const [tokenPrice] =
    useContractCall({
      abi: abi,
      address: config.minterAddress,
      method: 'tokenPrice',
      args: [],
    }) || []
  return tokenPrice
}

export const useIncrementalMinterIsTokenPriceLocked = () => {
  return useIsTokenPriceLocked(FixedPriceSequentialMinterAbi)
}

function useIsTokenPriceLocked(abi: utils.Interface) {
  const [isTokenPriceLocked] =
    useContractCall({
      abi: abi,
      address: config.minterAddress,
      method: 'isTokenPriceLocked',
      args: [],
    }) || []
  return isTokenPriceLocked
}

export const useIncrementalMinterMaxTokens = () => {
  return useMaxTokens(FixedPriceSequentialMinterAbi)
}

function useMaxTokens(abi: utils.Interface) {
  const [maxTokens] =
    useContractCall({
      abi: abi,
      address: config.minterAddress,
      method: 'maxTokens',
      args: [],
    }) || []
  return maxTokens
}

export const useIncrementalMinterIsMaxTokensLocked = () => {
  return useIsMaxTokensLocked(FixedPriceSequentialMinterAbi)
}

function useIsMaxTokensLocked(abi: utils.Interface) {
  const [isMaxTokensLocked] =
    useContractCall({
      abi: abi,
      address: config.minterAddress,
      method: 'isMaxTokensLocked',
      args: [],
    }) || []
  return isMaxTokensLocked
}

export const useMaxMintPerTx = () => {
  const [maxMintPerTx] =
    useContractCall({
      abi: FixedPriceSequentialMinterAbi,
      address: config.minterAddress,
      method: 'maxMintsPerTx',
      args: [],
    }) || []
  return maxMintPerTx && maxMintPerTx.toNumber()
}

export const useIncrementalMinterMint = () => {
  const contract = new Contract(
    config.minterAddress,
    FixedPriceSequentialMinterAbi
  )
  return useContractFunction(contract, 'mint')
}

export const useSpecificIdMinterMint = () => {
  const contract = new Contract(
    config.minterAddress,
    FixedPriceSpecificIDMinterAbi
  )
  return useContractFunction(contract, 'mint')
}

export const usePauseSale = () => {
  const contract = new Contract(config.minterAddress, ERC721MinterAbi)
  return useContractFunction(contract, 'pause')
}

export const useUnpauseSale = () => {
  const contract = new Contract(config.minterAddress, ERC721MinterAbi)
  return useContractFunction(contract, 'unpause')
}

export const useStartingBlock = () => {
  const [startBlock] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'startingBlock',
      args: [],
    }) || []
  return startBlock && startBlock.toNumber()
}

export const useIsStartingBlockLocked = () => {
  const [isStartingBlockLocked] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'isStartingBlockLocked',
      args: [],
    }) || []
  return isStartingBlockLocked
}

export const useFixedPriceSupplyMinterFunction = (functionName: string) => {
  const contract = new Contract(
    config.minterAddress,
    FixedPriceFixedSupplyMinterAbi
  )
  return useContractFunction(contract, functionName)
}

export const useFixedPriceSequentialMinterFunction = (functionName: string) => {
  const contract = new Contract(
    config.minterAddress,
    FixedPriceSequentialMinterAbi
  )
  return useContractFunction(contract, functionName)
}

export const useFixedPriceSpecificIDMinterFunction = (functionName: string) => {
  const contract = new Contract(
    config.minterAddress,
    FixedPriceSpecificIDMinterAbi
  )
  return useContractFunction(contract, functionName)
}

export const useIsOwnerMintLocked = () => {
  const [isOwnerMintLocked] =
    useContractCall({
      abi: FixedPriceFixedSupplyMinterAbi,
      address: config.minterAddress,
      method: 'isOwnerMintLocked',
      args: [],
    }) || []
  return isOwnerMintLocked
}

export const useMintingFilter = () => {
  const [mintingFilter] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'mintingFilter',
      args: [],
    }) || []
  return mintingFilter
}

export const useMinterETHBalance = () => {
  return useEtherBalance(config.minterAddress)
}

export const usePayeeGetter = (index: number) => {
  const [address] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'payee',
      args: [index],
    }) || []
  return address
}

export const useSharesGetter = (address: string) => {
  const [shares] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'shares',
      args: [address],
    }) || []
  return shares && shares.toNumber()
}

export const useTotalShares = () => {
  const [totalShares] =
    useContractCall({
      abi: ERC721MinterAbi,
      address: config.minterAddress,
      method: 'totalShares',
      args: [],
    }) || []
  return totalShares && totalShares.toNumber()
}

export const useSetMintingFilter = () => {
  const contract = new Contract(config.minterAddress, ERC721MinterAbi)
  return useContractFunction(contract, 'setMintingFilter')
}
