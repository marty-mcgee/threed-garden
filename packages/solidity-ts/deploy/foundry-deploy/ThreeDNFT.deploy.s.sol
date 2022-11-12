// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import { ThreeDNFT } from "contracts/ThreeDNFT.sol";

contract ThreeDNFTDeploy is Script {
  function setUp() public {}

  function run() public {
    vm.startBroadcast();
    new ThreeDNFT();
    vm.stopBroadcast();
  }
}
