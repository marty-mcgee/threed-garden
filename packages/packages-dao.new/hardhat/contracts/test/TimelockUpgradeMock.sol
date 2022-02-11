// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import { ERC721Timelock } from "../governor/ERC721Timelock.sol";

contract TimelockUpgradeMock is ERC721Timelock {
    function newTimelockFunction() pure external returns (string memory) {
        return "hello from the new timelock";
    }
}