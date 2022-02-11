# Admin & Minting pages for your create-nft-dao

This package contains implementation of 2 pages useful for interacting with your NFT DAO clone.

1. `/admin` - admin page

   Used to manage your contracts, e.g enable minting, change mint price, release funds, etc. Only the creator of the NFT DAO can perform these operations.

2. `/` - minting page

   A page where users can mint tokens

These pages are meant as an example. Feel free to fork & extend.

## Running locally

1. Clone the repo (or fork & clone)

   `$ git clone git@github.com:daocity/create-nft-dao.git`

2. Install dependencies

   `$ yarn`

3. Update config file

   Open `packages/contracts-frontend/config.ts` for editing.

   3.1 Set `CHAIN_ID` to the chain you are working on (e.g `ChainId.Rinkeby` or `ChainId.Mainnet`)

   3.2 Update contracts address for the chain you are working on. You need to update `tokenAddress`, `minterAddress`, `governorAddress` & `timelockAddress`.

   3.3 Update `minterType` to the type of minter you have chosed. Options are: `MinterType.FixedPriceSequentialMinter` or `MinterType.FixedPriceSpecificIDMinter`

4. Create `packages/contracts-frontend/.env` file similar to the `.env.example` file in the same folder.
   The JSON RPC urls should look something like: `https://eth-rinkeby.alchemyapi.io/v2/dkgAjugSdf`. You can get an Alchemy api key by [signing up](https://www.alchemy.com/).

5. Run the webapp in development mode

   From the repo root folder run:

   ```
   $ yarn prebuild
   $ cd packages/contracts-frontend/
   $ yarn dev
   ```

6. Open browser at http://localhost:3000

## Deploying to Vercel

After successfully running it locally, you may want to deploy it. These are instructions on how to deploy to Vercel.
This is assuming you followed the steps to run locally and successfully ran in development mode.

1. Have a fork of this repository with the config changes listed above in step 3

2. Create an account on [Vercel](https://vercel.com/) and import the forked repo

3. Under "Framework Preset" choose "Next.js"

4. Edit the root directory to be `packages/contracts-frontend`

5. Change the build command to: `./build.sh`

6. Set environment variables: `NEXT_PUBLIC_ALCHEMY_API_KEY` with your alchemy api key

7. Deploy 🚀
