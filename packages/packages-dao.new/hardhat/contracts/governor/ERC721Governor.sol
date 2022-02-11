// SPDX-License-Identifier: MIT

/// @title Governor for ERC721DAOToken.

pragma solidity ^0.8.6;

import { ERC721DAOToken } from "../token/ERC721DAOToken.sol";
import { GovernorCountingSimpleUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import { GovernorTimelockControlUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import { GovernorVotesQuorumFractionUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import { GovernorUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { GovernorProposalThresholdUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorProposalThresholdUpgradeable.sol";
import { IGovernorUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/IGovernorUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract ERC721Governor is
    GovernorVotesQuorumFractionUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorTimelockControlUpgradeable,
    GovernorProposalThresholdUpgradeable,
    UUPSUpgradeable
{
    uint256 private _proposalThreshold;
    uint256 private _votingDelay;
    uint256 private _votingPeriod;

    event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);
    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);

    function initialize(
        string memory name_,
        ERC721DAOToken token_,
        TimelockControllerUpgradeable timelock_,
        uint256 proposalThreshold_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 quorumNumerator_
    ) public initializer {
        __Governor_init(name_);
        __GovernorVotes_init(token_);
        __GovernorTimelockControl_init(timelock_);
        __GovernorVotesQuorumFraction_init(quorumNumerator_);

        _proposalThreshold = proposalThreshold_;
        _votingDelay = votingDelay_;
        _votingPeriod = votingPeriod_;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        virtual
        override(GovernorProposalThresholdUpgradeable, GovernorUpgradeable, IGovernorUpgradeable)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view virtual override returns (uint256) {
        return _proposalThreshold;
    }

    function setProposalThreshold(uint256 proposalThreshold_) external onlyGovernance {
        require(
            proposalThreshold_ <= ERC721DAOToken(address(token)).totalSupply(),
            "ERC721Governor::setProposalThreshold: proposalThreshold cannot exceed total token supply"
        );

        emit ProposalThresholdSet(_proposalThreshold, proposalThreshold_);

        _proposalThreshold = proposalThreshold_;
    }

    function votingDelay() public view virtual override returns (uint256) {
        return _votingDelay;
    }

    function setVotingDelay(uint256 votingDelay_) external onlyGovernance {
        emit VotingDelaySet(_votingDelay, votingDelay_);

        _votingDelay = votingDelay_;
    }

    function votingPeriod() public view virtual override returns (uint256) {
        return _votingPeriod;
    }

    function setVotingPeriod(uint256 votingPeriod_) external onlyGovernance {
        emit VotingPeriodSet(_votingPeriod, votingPeriod_);

        _votingPeriod = votingPeriod_;
    }

    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(address) internal override onlyGovernance {}
}
