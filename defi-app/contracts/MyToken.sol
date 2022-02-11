// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;
pragma solidity >=0.6.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    // public (ignored, use abstract?)
    constructor() ERC20("MyToken", "MTKN"){
        _mint(msg.sender, 1000000000000000000000000);
    }
}
