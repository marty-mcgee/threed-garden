// SPDX-License-Identifier: MIT

/// @title CompositeMintingFilter is a MintingFilter that invokes multiple filters.

pragma solidity ^0.8.6;

import { MintingFilter } from "./MintingFilter.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract CompositeMintingFilter is MintingFilter {
    MintingFilter[] public mintingFilters;

    function initialize(address creator, MintingFilter[] memory mintingFilters_) public initializer {
        __MintingFilter_init(creator);

        mintingFilters = mintingFilters_;
    }

    function meetsRequirements(address buyer) public view override returns (bool) {
        for (uint256 i = 0; i < mintingFilters.length; i++) {
            if (!mintingFilters[i].meetsRequirements(buyer)) {
                return false;
            }
        }
        return true;
    }
}
