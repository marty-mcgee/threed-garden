import { DeployFunction } from 'hardhat-deploy/types'
import { THardhatRuntimeEnvironmentExtended } from 'helpers/types/THardhatRuntimeEnvironmentExtended'
// import { ccm0, ccm1, ccm2 } from 'lib/console-colors'

const func: DeployFunction = async (hre: THardhatRuntimeEnvironmentExtended) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  // [MM] debug
  console.debug(`\nhre:\n`, await getNamedAccounts())
  console.debug(`\nDeploy: func: getNamedAccounts(): deployer: ${deployer}\n`)

  await deploy('YourContract', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    log: true,
    from: deployer,
    // [MM] custom
    gasLimit: 4000000,
    // args: ['Hello'],
  })

  // Getting a previously deployed contract
  // const YourContract = await ethers.getContract("YourContract", deployer)
  // await YourContract.setPurpose("Hello")

  // if you want to instantiate a version of a contract at a specific address!
  // const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A")
}
export default func
func.tags = ['YourContract']

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
})
*/
