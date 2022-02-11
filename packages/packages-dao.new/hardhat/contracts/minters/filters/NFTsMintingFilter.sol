// SPDX-License-Identifier: MIT

/// @title NFTsMintingFilter is a MintingFilter that enforces requirements of owning or not owning specific NFT tokens.

pragma solidity ^0.8.6;

import { MintingFilter } from "./MintingFilter.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

abstract contract NFTsMintingFilter is MintingFilter {
    struct TokenFilter {
        IERC721 token;
        uint256 minBalance;
    }

    TokenFilter[] public tokenFilters;

    function initialize(
        address creator,
        IERC721[] memory tokens,
        uint256[] memory minBalances
    ) public initializer {
        __MintingFilter_init(creator);
        _setTokenFilters(tokens, minBalances);
    }

    function tokenFiltersCount() external view returns (uint256) {
        return tokenFilters.length;
    }

    function getTokenFilters() external view returns (TokenFilter[] memory) {
        return tokenFilters;
    }

    function setTokenFilters(IERC721[] memory tokens, uint256[] memory minBalances) external onlyOwner {
        _setTokenFilters(tokens, minBalances);
    }

    function _setTokenFilters(IERC721[] memory tokens, uint256[] memory minBalances) private {
        require(tokens.length == minBalances.length, "NFTsMintingFilter: tokens and minBalances arity mismatch");

        delete tokenFilters;

        for (uint256 i = 0; i < tokens.length; i++) {
            tokenFilters.push(TokenFilter(tokens[i], minBalances[i]));
        }
    }
}
