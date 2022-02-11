// SPDX-License-Identifier: MIT

/// @title IRoyaltyInfo is used to share the RoyaltyInfo struct among users of ERC-2981.

pragma solidity ^0.8.6;

interface IRoyaltyInfo {
    struct RoyaltyInfo {
        address recipient;
        uint256 bps;
    }
}
