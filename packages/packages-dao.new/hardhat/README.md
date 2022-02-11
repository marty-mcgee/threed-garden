## Deploying contracts

1. Make sure you ran `yarn` in the project top level to install all dependencies.

2. Run `yarn build` in the contracts package folder.

3. Use the `yarn deploy` command to deploy contracts:

   Use `--network` to specify which network to deploy to (e.g mainnet, rinkeby, ...).
   Check `hardhat.base.config.ts` to see supported networks and to configure which private key you want to use when deploying.

   Run `yarn deploy --help` to see the additional parameters it expects:

   a. `--network`: default: local. Which network do you want to deploy to? Check `hardhat.base.config.ts` to see supported network and configure which private key you want to use for deployment.

   b. `--service-fee-address`: required - that it the address to which a % of all minting revenue will be sent

   c. `--timelock-contract-address`: optional - an address of an already deployed instance of the timelock contract. This is in order to save some gas on deployment.

   Example:

   `yarn deploy --network rinkeby --service-fee-address 0x4cce31b5E734934c62f0F411BaF53c2b3e14c3f4 --timelock-contract-address 0xDfC8B87B3B417Ec78eE5aA9B8F5a5750f950e894`
