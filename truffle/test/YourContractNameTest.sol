// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../contracts/YourContractName.sol";
// These files are dynamically created at test time
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

contract YourContractNameTest {

  function testTrue() public {
    // YourContractName yourContractName = YourContractName(DeployedAddresses.YourContractName());

    // Assert.equal(yourContractName.read(), 0, "Contract should have 0 stored");
    // yourContractName.write(1);
    // Assert.equal(yourContractName.read(), 1, "Contract should have 1 stored");
    // yourContractName.write(2);
    // Assert.equal(yourContractName.read(), 2, "Contract should have 2 stored");
  }
}
