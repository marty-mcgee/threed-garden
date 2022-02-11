import { ChainId } from '@usedapp/core'

export enum MinterType {
  FixedPriceSequentialMinter,
  FixedPriceSpecificIDMinter,
}
interface ContractsConfig {
  deployerAddress: string
  minterAddress: string
  tokenAddress: string
  timelockAddress: string
  governorAddress: string
  minterType: MinterType
}

type SupportedChains =
  | ChainId.Rinkeby
  | ChainId.Localhost
  | ChainId.OptimismKovan
  | ChainId.ArbitrumRinkeby
  | ChainId.Mumbai

export const CHAIN_ID: SupportedChains = ChainId.Rinkeby

const allConfigs: Record<SupportedChains, ContractsConfig> = {
  [ChainId.Localhost]: {
    deployerAddress: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    tokenAddress: '0x6F1216D1BFe15c98520CA1434FC1d9D57AC95321',
    minterAddress: '0x40a87c555319e8bD334b209CA3fA22615b9c619e',
    governorAddress: '0xCBd5431cC04031d089c90E7c83288183A6Fe545d',
    timelockAddress: '0xdAD42D43ecE0f6e8da8c2BCbC6A25FF6b3922C58',
    minterType: MinterType.FixedPriceSequentialMinter,
  },
  [ChainId.Rinkeby]: {
    deployerAddress: '0x02CB117254a82E2401B8c341CE668eDfF2f268FD',
    tokenAddress: '0xaa507B6082C753d962f6A9f01c575Ba8D1739b82',
    minterAddress: '0x2C57c1530df4807804395f5A8D53fc98A3F880D2',
    governorAddress: '0x34E804E07CB973A689dc8Da5B098e0711aCA2374',
    timelockAddress: '0x69059161a9030096ad3245a854687D05e8ffEE52',
    minterType: MinterType.FixedPriceSequentialMinter,
  },
  [ChainId.OptimismKovan]: {
    deployerAddress: '0x8c49f49B3e5A2a469A09f4d8D11546Bc928c08Aa',
    tokenAddress: '0xf2fc15153d69688cb4Ce4869Afc49bcCcB9AFd3E',
    minterAddress: '0x9A179CC9cB50265cf7655eE11DEba68caC91FAa2',
    governorAddress: '0x35509a349A4871A574D67f148AfC5C7ed9350bAC',
    timelockAddress: '0x25d29e95c62aD053D293eeC14E29abA882B1ee94',
    minterType: MinterType.FixedPriceSequentialMinter,
  },
  [ChainId.ArbitrumRinkeby]: {
    deployerAddress: '0x660fC5AbA193Ed6eE7ECD73E8A120F5e1a0B036F',
    tokenAddress: '0x28d760ddC22bf1723d5eba1da192a20d1D90d908',
    minterAddress: '0x661cDc7f0bDE537e917a09C916EF8BA83f56950d',
    governorAddress: '0xE10cEC99859c93EdAdE86c1e01f99518720ad322',
    timelockAddress: '0x15ffE8d137a7Dc7a94FC6C48209ede092B7400Ea',
    minterType: MinterType.FixedPriceSequentialMinter,
  },
  [ChainId.Mumbai]: {
    deployerAddress: '0x34ceC65033aA345Ee2BAbe13529a5648cA7B3F4C',
    tokenAddress: '0x19790Fa212C0eB0dD1A2B96e08d979c51a0C4Df1',
    minterAddress: '0x65be2516FfA8CbbBB3433ef7404Aed1BC9cf6DB6',
    governorAddress: '0x1E154a139ba1C8343ecEB3BAFcEdf3b97B9d9631',
    timelockAddress: '0xc33f195848174C5FfC0Ba0A063fd1CfDd508B760',
    minterType: MinterType.FixedPriceSequentialMinter,
  },
}

export const secrets = {
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
}
export const config = allConfigs[CHAIN_ID]

// Multicall needs to be configured only for Localhost
export const multicallOnLocalhost = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
