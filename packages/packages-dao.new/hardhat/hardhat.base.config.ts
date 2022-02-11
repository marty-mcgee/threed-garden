import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import { task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (_args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10_000,
      },
    },
  },
  paths: {
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
      loggingEnabled: false,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: { mnemonic: process.env.MNEMONIC || "dummy-value" },
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.MNEMONIC || "dummy-value" },
    },
    "optimistic-kovan": {
      url: "https://kovan.optimism.io",
      accounts: { mnemonic: process.env.MNEMONIC || "dummy-value" },
    },
    "arbitrum-rinkeby": {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts: { mnemonic: process.env.MNEMONIC || "dummy-value" },
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: { mnemonic: process.env.MNEMONIC || "dummy-value" },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    // apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  typechain: {
    outDir: "./typechain",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 99,
    coinmarketcap: process.env.COINMARKETCAP_KEY || "",
  },
};

export default config;
