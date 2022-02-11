// SPDX-License-Identifier: MIT
// pragma solidity ^0.6.2;
pragma solidity >=0.6.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FarmToken is ERC20 {
  
  using Address for address;
  // using SafeMath for uint256; // As of Solidity v0.8.0, mathematical operations can be done safely without the need for SafeMath
  using SafeERC20 for IERC20;

  IERC20 public token;

  // public (ignored, use abstract?)
  constructor(address _token) ERC20("FarmToken", "FRM") {
    token = IERC20(_token);
  }

  function balance() public view returns (uint256) {
    return token.balanceOf(address(this));
  }

  function deposit(uint256 _amount) public {
    // Amount must be greater than zero
    require(_amount > 0, "amount cannot be 0");

    // Transfer MyToken to smart contract
    token.safeTransferFrom(msg.sender, address(this), _amount);

    // Mint FarmToken to msg sender
    _mint(msg.sender, _amount);
  }

  function withdraw(uint256 _amount) public {
    // Burn FarmTokens from msg sender
    _burn(msg.sender, _amount);

    // Transfer MyTokens from this smart contract to msg sender
    token.safeTransfer(msg.sender, _amount);
  }


}