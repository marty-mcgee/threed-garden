// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// A library is like a contract with reusable code, which can be called by other contracts.
// Deploying common code can reduce gas costs.
library ConvertLib {
  function convert(uint256 amount, uint256 conversionRate) public pure returns (uint256 convertedAmount) {
    return amount * conversionRate;
  }
}
