import { ethers } from 'ethers'

const keccak256 = ethers.utils.keccak256
const toUtf8Bytes = ethers.utils.toUtf8Bytes
export const hashString = (str: string) => {
  return keccak256(toUtf8Bytes(str))
}

export const DEFAULT_TOKEN_SUPPLY = 10000
export const DEFAULT_TOKEN_PRICE = 0.01
export const DEFAULT_MAX_MINTS = 10
export const DEFAULT_SALE_START_DELAY = 46523 // 604800 seconds in a week divided by 13 seconds per block
export const TOTAL_SHARES = 10000
export const DEFAULT_CREATOR_PERCENTAGE = 5
export const DEFAULT_TIMELOCK_DELAY = 172_800 // 2 days
export const DEFAULT_PROP_THRESHOLD = 1
export const DEFAULT_VOTING_DELAY = 1 // 1 block
export const DEFAULT_VOTING_PERIOD = 5_760 // About 24 hours with 15s blocks
export const DEFAULT_QUORUM_NUMERATOR = 1 // 1%

export function getSharesByCreatorPercentage(creatorPercentage: number) {
  const totalShares = 10000
  const creatorShares = (creatorPercentage / 100) * totalShares
  const daoShares = totalShares - creatorShares
  return { creatorShares, daoShares }
}
