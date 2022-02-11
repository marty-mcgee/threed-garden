// SPDX-License-Identifier: MIT

/// @title Minter for ERC721DAOToken.

pragma solidity ^0.8.6;

import { ERC721DAOToken } from "../token/ERC721DAOToken.sol";
import { MintingFilter } from "./filters/MintingFilter.sol";
import { PaymentSplitterWithFeeUpgradeable } from "./PaymentSplitterWithFeeUpgradeable.sol";
import { AccessControlEnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AddressUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

abstract contract ERC721Minter is
    PaymentSplitterWithFeeUpgradeable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable
{
    using AddressUpgradeable for address;

    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    ERC721DAOToken public token;
    MintingFilter public mintingFilter;
    uint256 public startingBlock;
    bool public isStartingBlockLocked;

    modifier afterStartingBlock() {
        require(block.number >= startingBlock, "ERC721Minter: Sale hasn't started yet!");
        _;
    }

    modifier senderPassesFilter() {
        if (address(mintingFilter) != address(0)) {
            require(mintingFilter.meetsRequirements(_msgSender()), "ERC721Minter: mintingFilter requirements not met");
        }
        _;
    }

    function initialize(
        address creator_,
        ERC721DAOToken token_,
        uint256 startingBlock_,
        address[] memory payees_,
        uint256[] memory shares_,
        MintingFilter mintingFilter_,
        bytes memory extraInitCallData_,
        address payable serviceFeeAddress_,
        uint256 serviceFeeBasisPoints_,
        address deployerOwner
    ) public virtual initializer {
        _setRoleAdmin(CREATOR_ROLE, CREATOR_ROLE);
        _setupRole(CREATOR_ROLE, creator_);
        _setRoleAdmin(DEPLOYER_ROLE, DEPLOYER_ROLE);
        _setupRole(DEPLOYER_ROLE, deployerOwner);

        __PaymentSplitterWithFee_init(payees_, shares_, serviceFeeAddress_, serviceFeeBasisPoints_);

        token = token_;
        startingBlock = startingBlock_;
        mintingFilter = mintingFilter_;
        _pause();

        address(this).functionCall(extraInitCallData_);
    }

    function setServiceFeeBasisPoints(uint256 serviceFeeBasisPoints_) external onlyRole(DEPLOYER_ROLE) {
        _setServiceFeeBasisPoints(serviceFeeBasisPoints_);
    }

    function setServiceFeeAddress(address payable serviceFeeAddress_) external onlyRole(DEPLOYER_ROLE) {
        _setServiceFeeAddress(serviceFeeAddress_);
    }

    function pause() public onlyRole(CREATOR_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(CREATOR_ROLE) {
        _unpause();
    }

    function setStartingBlock(uint256 startingBlock_) external onlyRole(CREATOR_ROLE) {
        require(!isStartingBlockLocked, "ERC721Minter: startingBlock is locked");
        startingBlock = startingBlock_;
    }

    function lockStartingBlock() external onlyRole(CREATOR_ROLE) {
        isStartingBlockLocked = true;
    }

    function setMintingFilter(MintingFilter mintingFilter_) external onlyRole(CREATOR_ROLE) {
        mintingFilter = mintingFilter_;
    }
}
