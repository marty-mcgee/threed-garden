// SPDX-License-Identifier: MIT

/// @title ERC2981ContractWideRoyalties implements IERC2981, with one royalties configuration for all tokens.

pragma solidity ^0.8.6;

import { IERC2981 } from "./IERC2981.sol";
import { ERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import { IERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import { IRoyaltyInfo } from "./IRoyaltyInfo.sol";

/// @dev This is a contract used to add ERC2981 support to ERC721 and 1155
/// @dev This implementation has the same royalties for each and every tokens
abstract contract ERC2981ContractWideRoyalties is IERC2981, ERC165Upgradeable {
    IRoyaltyInfo.RoyaltyInfo private _royalties;

    /// @dev Sets token royalties
    /// @param recipient recipient of the royalties
    /// @param bps percentage (using 2 decimals - 10000 = 100, 0 = 0)
    function _setRoyalties(address recipient, uint256 bps) internal {
        require(bps <= 10000, "ERC2981ContractWideRoyalties: Too high");
        _royalties = IRoyaltyInfo.RoyaltyInfo(recipient, bps);
    }

    function royaltyInfo(uint256, uint256 value)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        IRoyaltyInfo.RoyaltyInfo memory royalties = _royalties;
        receiver = royalties.recipient;
        royaltyAmount = (value * royalties.bps) / 10000;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165Upgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
