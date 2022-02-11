// SPDX-License-Identifier: MIT

/// @title Timelock for ERC721Governor.

pragma solidity ^0.8.6;

import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import { ERC721HolderUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";

contract ERC721Timelock is TimelockControllerUpgradeable, UUPSUpgradeable, ERC721HolderUpgradeable {
    function initialize(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) public initializer {
        __TimelockController_init(minDelay, proposers, executors);

        // __TimelockController_init sets _msgSender as admin as well as the timelock itself.
        // We don't want the clone creating contract to remain the admin of the timelocks it
        // creates.
        revokeRole(TIMELOCK_ADMIN_ROLE, _msgSender());
    }

    function _authorizeUpgrade(address) internal override onlyRole(TIMELOCK_ADMIN_ROLE) {}
}
