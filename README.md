# 🥕 ThreeD Garden

🌱 on Scaffold-Eth TypeScript

🦁 Next.js 13 + React + MUI + Ant + Apollo + Zustand + GraphQL + WordPress + WooCommerce

## 🌱 Features

This is the typescript repo of scaffold-eth. Use scaffold-eth-typescript with:

- A react frontend running with `threed` or `nextjs` or `vite`.
- Solidity toolkit of `hardhat` or `foundry` (or `truffle` beta)
- It has the a command line system that allows you to choose a **react frontend** or **solidity toolkit**

## 🌱 Quick Start

### Fork or Clone the Repo

- You can use the use the template link: [threedgarden-eth-typescript template](https://github.com/marty-mcgee/threed-garden/generate)
- You can clone the repo with git
  ```bash
  git clone https://github.com/marty-mcgee/threed-garden.git
  ```

### Starting the App

Running the app requires 3 separate executable processes/threads (so open 3 terminals)

1. install your dependencies, `open a new command prompt`

   ```bash
   yarn install
   ```

2. Create a default `scaffold.config.json` configuration file

   ```bash
   yarn create-config
   ```

3. start a local hardhat node (chain)

   ```bash
   yarn chain
   ```

4. Run the app, `open a new command prompt terminal`

   ```bash
   # in a new terminal
   # compile your contracts (yarn contracts:build)
   yarn compile
   # deploy your hardhat contracts
   yarn deploy
   # start the react app (vite)
   yarn start
   ```

5. Open https://localhost:3333 to see your front end

## 🌱 Configuration

Scaffold uses `scaffold.config.json` as a configuration file located in `/packages/common/scaffold.config.json`. You can create the config file by running the command `yarn create-config`.

### Command Line Help

```bash
use `-h` with any command for help.  e.g. yarn set-react -h
```

### Configure React and Solidity toolkit

You can change the configuration file to pick different frontends and solidity toolkits.

```bash
yarn set-react 'threed' or 'nextjs' or 'vite'
yarn set-solidity 'hardhat' or 'foundry'
```

### Target Network

Set your `targetNetwork` in the config. This is the network the solidity toolkit is deploying against.

Set your `availableNetworks` in the config. This is the networks the frontend is available in.

You can configure it from the **config file** or from **command line**.

```bash
yarn set-network -h
yarn set-network 'localhost' 'localhost, mainnet'
```

### More Commands

You can see all the other commands by using `yarn scaffold`

## 🌱 Solidity Tookits Details

### Hardhat

Everything will be installed with `yarn install`.

You can use hardhat with right context using

```bash
yarn hardhat
```

### Foundry

Make sure you install foundry

1. Make sure you install foundry first. Use `curl -L https://foundry.paradigm.xyz | bash` to install foundryup

   > You can see more details here. https://book.getfoundry.sh/getting-started/installation

2. Run `yarn install:foundry` to install or update foundry in the right folder. It will also run _forge install_ automatically with the right context.

You can use foundry commands with the right context

```bash
yarn forge
yarn anvil
yarn cast
```

## 🌱 Directories

The directories that you'll use are:

```bash
packages/solidity-ts/

And one of either:
packages/vite-app-ts/
packages/next-app-ts/
```

### More Info

Other commands

```bash
# rebuild all contracts, incase of inconsistent state
yarn contracts:clean
yarn contracts:build
# run hardhat commands for the workspace, or see all tasks
yarn hardhat 'xxx'
# run forge, anvil or
yarn forge
yarn anvil
yarn cast
```

Other folders

```bash
# for subgraph checkout README.md in following directories
packages/subgraph/
packages/services/
```

## 🌱 Guides

Everything you need to build on Ethereum! 🚀 Quickly experiment with Solidity using a frontend that adapts to your smart contract:

![image](https://user-images.githubusercontent.com/2653167/124158108-c14ca380-da56-11eb-967e-69cde37ca8eb.png)

- 🔏 Edit your smart contract `YourContract.sol` in `packages/solidity-ts/contracts`
- 📝 Edit your frontend `MainPage.tsx` in `packages/vite-app-ts/src`
- 💼 Edit your deployment scripts in `packages/solidity-ts/deploy/hardhat-deploy`
- 📱 Open http://localhost:3000 to see the app
- 👷🏽‍♂️ run `yarn hardhat` to get a list of all the tasks. Run `yarn hardhat taskname` to run the task.

---

# 🌱 Documentation

Check out [eth-hooks docs](https://scaffold-eth.github.io/eth-ui) for example of how to use hooks

## 🌱 Video Tutorials

Tutorial using the CLI

- [Scaffold-eth-typescript Tutorial: Foundry, NextJS, CLI](https://www.youtube.com/watch?v=bEd6wV2H28g)

Eth-hooks v4 & scaffold-eth-typescript overview

- [Getting Started with eth-hooks and scaffold-eth-typescript](https://www.youtube.com/watch?v=a7W9nTX8qLk&t=3s)
- [eth-hooks v4](https://www.youtube.com/watch?v=STxAdE8wQwY&t=86s)

## 🌱 Speedrun Ethereum 🏃💨

Register as a builder [here](https://speedrunethereum.com) and start on some of the challenges and build a portfolio.

> 🏁 Make sure to click on the typescript tab!

---

# 🌱 Extra!

## 💬 Support Chat

Join the telegram [support chat 💬](https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA) to ask questions and find others building with 🏗 scaffold-eth!

## 🛠 Buidl

Check out

- [Typescript challenges](https://github.com/scaffold-eth/scaffold-eth-typescript-challenges)
- [Typescript examples](https://github.com/scaffold-eth/scaffold-eth-typescript-examples)
- [Vanilla JS active branches](https://github.com/scaffold-eth/scaffold-eth/branches/active)
- Join/fund the 🏰 [BuidlGuidl](https://BuidlGuidl.com)!

## 🙏🏽 Support us!

Please check out our [Gitcoin grant](https://gitcoin.co/grants/2851/scaffold-eth) too!

======================================================================================
🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱

# 🌱 ThreeD Garden

![ThreeD Demo Screenshot](https://threedpublic.s3.amazonaws.com/demo/marty-mcgee-portfolio-gardenuniversity-threedgarden-v002-600x338.png 'ThreeD Garden React Three Fiber -- Demo Screenshot')

====

## 🌱 Project Description

ThreeD Garden is an app written in JavaScript (TypeScript) for intense ThreeJS WebGL 3D rendering, using the React/Next (or Vue/Nuxt, or Vanilla/Vite) frameworks, using @react-three libraries. ThreeD Garden is exportable as a standalone CommonJS app, and as a WordPress plugin. 'threed-garden' is a functioning, low-dependency app, a package supporting a monorepo of workspaces that utilize/depend on 'ThreeJS, WebGL, Vite React, Vue, TypeScript, React-Three-Fiber, GraphQL', in active development.

====

## 🌱 Live Demo

[ThreeD Garden](https://threedgarden.com/demo/)

====

## 🌱 ThreeDs = Nouns + Actions = Interactions

**1 ThreeD = 1 Noun + (Infinite Object Collection \* Actions) = 1 Interaction = 1 ThreeD Token**

- Characters (Objects, Animated)
- Environments (Worlds, Scenes)
- Collisions (Interactions, Interfaces)
- Results (Instant, Reporting)

> "A Real Garden + Homestead Management Solution, using Virtual Interfaces, based on ThreeD JS object structure."

====

## 🌱 Project Options

ThreeD Garden can connect to a real-life "FarmBot Genesis XL 1.6" robotic gardening system via the FarmBot JS/TS APIs.

====

## 🌱 Project Contributors

@marty-mcgee, @companyjuice, @garden.university, @farmbot

## 🌱 Project Slogan

Let's get growing!!

====

## 🌱 Demos

Future Landing Pages: workin on it..

- threed/DEMO: https://garden.university/scene/mcgee-home-garden
- threed/GARDEN: https://garden.university/scene/mcgee-home-garden/#/participate

====

## 🌱 For Developers

1. install: `pnpm i`
2. run: `pnpm dev`
3. build: `pnpm build`
4. deploy: `pnpm deploy`

====

## 🌱 Documentation

workin on it.. in vitepress (or nuxtpress, or nextpress, or whateverpress)

> a part of the 🌱 threed.ai code family

======================================================================================
🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱
