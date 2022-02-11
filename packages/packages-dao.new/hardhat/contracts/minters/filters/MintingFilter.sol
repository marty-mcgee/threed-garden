// SPDX-License-Identifier: MIT

/// @title MintingFilter helps minter contracts make sure minting users meet certain criteria, like holding a certain NFT.

pragma solidity ^0.8.6;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract MintingFilter is OwnableUpgradeable {
    function __MintingFilter_init(address creator) internal onlyInitializing {
        __Ownable_init();
        transferOwnership(creator);
    }

    function meetsRequirements(address buyer) public view virtual returns (bool);
}
