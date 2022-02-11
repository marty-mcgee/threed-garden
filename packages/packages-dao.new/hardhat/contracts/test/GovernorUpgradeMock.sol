// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import { ERC721Governor } from "../governor/ERC721Governor.sol";

contract GovernorUpgradeMock is ERC721Governor {
    function newGovFunction() pure external returns (string memory) {
        return "hello from the new gov";
    }
}