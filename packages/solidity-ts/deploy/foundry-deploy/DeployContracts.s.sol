// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import { YourContractDeploy } from "./YourContract.deploy.s.sol";
import { ThreeDNFTDeploy } from "./ThreeDNFT.deploy.s.sol";

// import { ThreeDNFT } from "contracts/ThreeDNFT.sol";
// import { YourContract } from "contracts/yourContract.sol";

contract DeployContracts is Script {
  function setUp() public {}

  function run() public {
    YourContractDeploy yourContractDeploy = new YourContractDeploy();
    yourContractDeploy.setUp();
    yourContractDeploy.run();

    ThreeDNFTDeploy ThreeDNFTDeploy = new ThreeDNFTDeploy();
    ThreeDNFTDeploy.setUp();
    ThreeDNFTDeploy.run();
  }
}
