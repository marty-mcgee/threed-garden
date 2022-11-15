pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
// import "@openzeppelin/contracts/access/Ownable.sol";

contract YourContractName {
  constructor() {
    // 🌱 what should we do on deploy?
    console.log("HEY HEY HEY: YourContractName constructor");
  }
}
