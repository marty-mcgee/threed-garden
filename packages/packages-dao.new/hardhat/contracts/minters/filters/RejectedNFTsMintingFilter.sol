// SPDX-License-Identifier: MIT

/// @title RejectedNFTsMintingFilter is a MintingFilter that enforces requirements of NOT owning specific NFT tokens over a minimal balances.

pragma solidity ^0.8.6;

import { NFTsMintingFilter } from "./NFTsMintingFilter.sol";

contract RejectedNFTsMintingFilter is NFTsMintingFilter {
    function meetsRequirements(address buyer) public view override returns (bool) {
        for (uint256 i = 0; i < tokenFilters.length; i++) {
            TokenFilter storage filter = tokenFilters[i];
            if (filter.token.balanceOf(buyer) >= filter.minBalance) {
                return false;
            }
        }
        return true;
    }
}
