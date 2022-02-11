import { BytesLike } from '@ethersproject/bytes'
import { BigNumberish } from '@ethersproject/bignumber'
import { RoyaltiesParams } from '@create-nft-dao/shared'

export type CloneAddresses = {
  token: string
  timelock: string
  governor: string
  minter: string
}

export type TokenParams = {
  name: string
  symbol: string
  baseURI: string
  contractInfoURI: string
}

export type GovernorParams = {
  name: string
  proposalThreshold: number
  votingDelay: number
  votingPeriod: number
  quorumNumerator: number
  timelockDelay: number
  upgradable: boolean
}

export type MinterParams = {
  implementationIndex: number
  maxTokens: number
  tokenPrice: BigNumberish
  maxMintsPerTx: number
  creatorPercentage: number
  startingBlock: BigNumberish
  extraInitCallData: BytesLike
}

export type MintingFilterToken = {
  address: string
  minBalance: number
}

export type MintingFilterParmas = {
  useMintingFilter: boolean
  tokens: MintingFilterToken[]
}

export type StateType = {
  isLoading: boolean
  tokenConfig: TokenParams
  governorConfig: GovernorParams
  minterConfig: MinterParams
  mintingFilterConfig: MintingFilterParmas
  royaltiesConfig: RoyaltiesParams
  clones: CloneAddresses
}

export type ActionType =
  | {
      type: 'SET_LOADING'
      isLoading: StateType['isLoading']
    }
  | {
      type: 'SET_TOKEN_CONFIG'
      tokenConfig: StateType['tokenConfig']
    }
  | {
      type: 'SET_MINTER_CONFIG'
      minterConfig: StateType['minterConfig']
    }
  | {
      type: 'SET_GOVERNOR_CONFIG'
      governorConfig: StateType['governorConfig']
    }
  | {
      type: 'SET_MINTING_FILTER_CONFIG'
      mintingFilterConfig: StateType['mintingFilterConfig']
    }
  | {
      type: 'SET_ROYALTIES_CONFIG'
      royaltiesConfig: StateType['royaltiesConfig']
    }
  | {
      type: 'SET_CLONES'
      clones: StateType['clones']
    }
