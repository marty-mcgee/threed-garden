// SPDX-License-Identifier: MIT

/// @title Minter for ERC721DAOToken, selling tokens at a fixed price, allowing minters to choose specific IDs.

pragma solidity ^0.8.6;

import { FixedPriceFixedSupplyMinter } from "./FixedPriceFixedSupplyMinter.sol";

contract FixedPriceSpecificIDMinter is FixedPriceFixedSupplyMinter {
    // this is expected to be called as part of ERC721Minter's initialize function extraInitCallData_
    function init(uint256 maxTokens_, uint256 tokenPrice_) public onlyInitializing {
        __FixedPriceFixedSupplyMinter_init(maxTokens_, tokenPrice_);
    }

    function mint(uint256 tokenId) external payable whenNotPaused afterStartingBlock senderPassesFilter {
        require(msg.value >= tokenPrice, "FixedPriceSpecificIDMinter: not enough ether sent!");

        _mint(_msgSender(), tokenId);
    }

    function ownerMint(address to, uint256 tokenId) external onlyRole(CREATOR_ROLE) {
        require(!isOwnerMintLocked, "FixedPriceSpecificIDMinter: ownerMint is locked");
        _mint(to, tokenId);
    }
}
