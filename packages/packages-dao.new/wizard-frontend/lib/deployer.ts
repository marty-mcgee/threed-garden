import {
  ERC721DAODeployer__factory,
  FixedPriceSequentialMinter__factory,
  FixedPriceSpecificIDMinter__factory,
  RequiredNFTsMintingFilter__factory,
} from '@create-nft-dao/hardhat'
import { ethers } from 'ethers'
import { getSharesByCreatorPercentage } from '../lib/contractUtils'
import { StateType } from './wizardTypes'
import { chainIdToContracts } from '../config'
import { ChainId } from '@usedapp/core'

export async function clone(
  account: string,
  library: ethers.providers.Web3Provider,
  state: StateType,
  chainId: ChainId
) {
  const signer = library.getSigner()
  const deployer = new ERC721DAODeployer__factory(signer).attach(
    chainIdToContracts[chainId].deployerAddress
  )

  let extraInitCallData
  if (state.minterConfig.implementationIndex == 0) {
    extraInitCallData =
      FixedPriceSequentialMinter__factory.createInterface().encodeFunctionData(
        'init',
        [
          state.minterConfig.maxTokens,
          ethers.utils.parseEther(state.minterConfig.tokenPrice.toString()),
          state.minterConfig.maxMintsPerTx,
        ]
      )
  } else {
    extraInitCallData =
      FixedPriceSpecificIDMinter__factory.createInterface().encodeFunctionData(
        'init',
        [
          state.minterConfig.maxTokens,
          ethers.utils.parseEther(state.minterConfig.tokenPrice.toString()),
        ]
      )
  }

  // Until we add form validations, filtering out anything shorter than an ETH address
  const cleanTokens = state.mintingFilterConfig.tokens.filter(
    (t) => t.address.length === 42
  )

  const mintingFilterParams = {
    useMintingFilter: state.mintingFilterConfig.useMintingFilter,
    implementationIndex: 0,
    initCallData:
      RequiredNFTsMintingFilter__factory.createInterface().encodeFunctionData(
        'initialize',
        [
          account,
          cleanTokens.map((t) => t.address),
          cleanTokens.map((t) => t.minBalance),
        ]
      ),
  }

  let royaltiesRecipientOverride = ethers.constants.AddressZero
  if (
    state.royaltiesConfig.isRoyaltiesRecipientOverrideEnabled &&
    state.royaltiesConfig.royaltiesRecipientOverride
  ) {
    royaltiesRecipientOverride =
      state.royaltiesConfig.royaltiesRecipientOverride
  }

  const tx = await deployer.clone(
    account,
    {
      ...state.tokenConfig,
      ...state.royaltiesConfig,
      royaltiesRecipientOverride: royaltiesRecipientOverride,
      tokenURIDescriptor: chainIdToContracts[chainId].svgPlaceholderAddress,
    },
    state.governorConfig,
    {
      ...state.minterConfig,
      extraInitCallData: extraInitCallData,
      ...getSharesByCreatorPercentage(state.minterConfig.creatorPercentage),
    },
    mintingFilterParams
  )

  const receipt = await tx.wait()
  const event = receipt.events?.find((e) => e.event == 'NewClone')

  return {
    clones: {
      token: event?.args?.token,
      timelock: event?.args?.timelock,
      governor: event?.args?.governor,
      minter: event?.args?.minter,
    },
    clonesBlockNumber: receipt.blockNumber,
  }
}
