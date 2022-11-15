/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  createConnectorForExternalAbi,
  createConnectorForExternalContract,
  createConnectorForFoundryContract,
  createConnectorForHardhatContract,
} from 'eth-hooks/context'
import { invariant } from 'ts-invariant'

import { externalContractsAddressMap } from './externalContracts.config'

import * as toolkitContracts from '~common/generated/contract-types/'
import * as externalContracts from '~common/generated/external-contracts/esm/types'
import foundryDeployedContractsJson from '~common/generated/foundry_contracts.json'
import hardhatDeployedContractsJson from '~common/generated/hardhat_contracts.json'
import { scaffoldConfig } from '~common/scaffold.config'

/**
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * ### Instructions
 * 1. edit externalContracts.config.ts to add your external contract addresses.
 * 2. edit `appContractsConfig` function below and add them to the list
 * 3. run `yarn contracts:build` to generate types for contracts
 * 4. run `yarn deploy` to generate hardhat_contracts.json
 *
 * ### Summary
 * - called  by useAppContracts
 * @returns
 */
export const appContractsConfig = () => {
  try {
    const result = {
      // --------------------------------------------------
      // 🙋🏽‍♂️ Contracts examples either using hardhat or foundry
      // --------------------------------------------------
      YourContract:
        scaffoldConfig.build.solidityToolkit === 'hardhat'
          ? createConnectorForHardhatContract(
              'YourContract',
              toolkitContracts.YourContract__factory,
              hardhatDeployedContractsJson
            )
          : createConnectorForFoundryContract(
              'YourContract',
              toolkitContracts.YourContract__factory,
              foundryDeployedContractsJson
            ),

      ThreeDNFT:
        scaffoldConfig.build.solidityToolkit === 'hardhat'
          ? createConnectorForHardhatContract(
              'ThreeDNFT',
              toolkitContracts.ThreeDNFT__factory,
              hardhatDeployedContractsJson
            )
          : createConnectorForFoundryContract(
              'ThreeDNFT',
              toolkitContracts.ThreeDNFT__factory,
              foundryDeployedContractsJson
            ),

      YourNFT:
        scaffoldConfig.build.solidityToolkit === 'hardhat'
          ? createConnectorForHardhatContract(
              'YourNFT',
              toolkitContracts.YourNFT__factory,
              hardhatDeployedContractsJson
            )
          : createConnectorForFoundryContract(
              'YourNFT',
              toolkitContracts.YourNFT__factory,
              foundryDeployedContractsJson
            ),

      // --------------------------------------------------
      // 🙋🏽‍♂️ Add your external contracts here, make sure to define the address in `externalContractsConfig.ts`Í
      // --------------------------------------------------
      DAI: createConnectorForExternalContract('DAI', externalContracts.DAI__factory, externalContractsAddressMap),

      // --------------------------------------------------
      // 🙋🏽‍♂️ Add your external abi here (unverified contracts)`
      // --------------------------------------------------
      YourContractFromAbi: createConnectorForExternalAbi(
        'YourContract',
        {
          [1235]: {
            address: 'xxx',
          },
        },
        toolkitContracts.YourContract__factory.abi
        // optional if you have a connect function:  externalContracts.YourContract__factory.connect
      ),
    } as const

    return result
  } catch (e) {
    invariant.error(
      '❌ appContractsConfig: ERROR with loading contracts please run `yarn contracts:build or yarn contracts:rebuild`.  Then run `yarn deploy`!'
    )
    invariant.error(e)
    throw e
  }
}
