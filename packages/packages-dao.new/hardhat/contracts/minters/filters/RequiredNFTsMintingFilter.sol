// SPDX-License-Identifier: MIT

/// @title RequiredNFTsMintingFilter is a MintingFilter that enforces requirements of owning specific NFT tokens with minimal balances.

pragma solidity ^0.8.6;

import { NFTsMintingFilter } from "./NFTsMintingFilter.sol";

contract RequiredNFTsMintingFilter is NFTsMintingFilter {
    function meetsRequirements(address buyer) public view override returns (bool) {
        for (uint256 i = 0; i < tokenFilters.length; i++) {
            TokenFilter storage filter = tokenFilters[i];
            if (filter.token.balanceOf(buyer) < filter.minBalance) {
                return false;
            }
        }
        return true;
    }
}
