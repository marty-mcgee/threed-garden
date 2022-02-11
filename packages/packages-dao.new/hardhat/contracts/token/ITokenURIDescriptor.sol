// SPDX-License-Identifier: MIT

/// @title Interface for TokenURIDescriptor

pragma solidity ^0.8.6;

interface ITokenURIDescriptor {
    function tokenURI(
        uint256 tokenId,
        string calldata name,
        string calldata symbol
    ) external view returns (string memory);
}
