// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ClonesUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import { AddressUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import { ERC721DAOToken } from "./token/ERC721DAOToken.sol";
import { ERC721Timelock } from "./governor/ERC721Timelock.sol";
import { ERC721Governor } from "./governor/ERC721Governor.sol";
import { ERC721Minter } from "./minters/ERC721Minter.sol";
import { MintingFilter } from "./minters/filters/MintingFilter.sol";
import { IRoyaltyInfo } from "./token/IRoyaltyInfo.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { ITokenURIDescriptor } from "./token/ITokenURIDescriptor.sol";

contract ERC721DAODeployer is OwnableUpgradeable {
    using ClonesUpgradeable for address;
    using AddressUpgradeable for address;

    struct TokenParams {
        string name;
        string symbol;
        string baseURI;
        string contractInfoURI;
        uint256 royaltiesBPs;
        address royaltiesRecipientOverride;
        ITokenURIDescriptor tokenURIDescriptor;
    }

    struct GovernorParams {
        string name;
        uint256 proposalThreshold;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 quorumNumerator;
        uint256 timelockDelay;
        bool upgradable;
    }

    struct MinterParams {
        uint256 implementationIndex;
        uint256 startingBlock;
        uint256 creatorShares;
        uint256 daoShares;
        bytes extraInitCallData;
    }

    struct MintingFilterParams {
        bool useMintingFilter;
        uint256 implementationIndex;
        bytes initCallData;
    }

    ERC721DAOToken public token;
    ERC721Timelock public timelock;
    ERC721Governor public governor;
    ERC721Minter[] public minters;
    MintingFilter[] public mintingFilters;

    // a % of minting fees will go to this address as payment for using the contracts
    address payable public serviceFeeAddress;

    // fee in basis points, e.g 250 = 2.5%
    uint256 public serviceFeeBasisPoints;

    event ImplementationsSet(
        address token,
        address timelock,
        address governor,
        address[] minters,
        address[] mintingFilters
    );
    event NewClone(address token, address timelock, address governor, address minter, address mintingFilter);
    event NewMintingFilterClone(address mintingFilter);
    event NewSingleClone(address clone);
    event ServiceFeeAddressUpdated(address serviceFeeAddress);
    event ServiceFeeBasisPointsUpdated(uint256 serviceFeeBasisPoints);

    function initialize(
        ERC721DAOToken token_,
        ERC721Timelock timelock_,
        ERC721Governor governor_,
        ERC721Minter[] calldata minters_,
        MintingFilter[] calldata mintingFilters_,
        address payable serviceFeeAddress_
    ) public initializer {
        __Ownable_init();

        _setImplementations(token_, timelock_, governor_, minters_, mintingFilters_);
        serviceFeeAddress = serviceFeeAddress_;
        serviceFeeBasisPoints = 250;
    }

    function clone(
        address creatorAddress,
        TokenParams calldata tokenParams,
        GovernorParams calldata governorParams,
        MinterParams calldata minterParams,
        MintingFilterParams calldata mintingFilterParams
    ) external {
        require(
            minterParams.implementationIndex < minters.length,
            "ERC721DAODeployer: minter implementationIndex out of bounds"
        );

        ERC721DAOToken tokenClone = ERC721DAOToken(address(token).clone());
        ERC721Timelock timelockClone = createTimelockInstance(governorParams);
        ERC721Governor governorClone = createGovernorInstance(governorParams);
        ERC721Minter minterClone = ERC721Minter(payable(address(minters[minterParams.implementationIndex]).clone()));

        // This block is necessary to avoid the "stack too deep" compilation error
        {
            IRoyaltyInfo.RoyaltyInfo memory royaltyInfo = IRoyaltyInfo.RoyaltyInfo(
                address(timelockClone),
                tokenParams.royaltiesBPs
            );
            if (tokenParams.royaltiesRecipientOverride != address(0)) {
                royaltyInfo.recipient = tokenParams.royaltiesRecipientOverride;
            }

            initToken(tokenClone, minterClone, creatorAddress, tokenParams, royaltyInfo);
        }

        initTimelock(timelockClone, governorClone, governorParams.timelockDelay);
        governorClone.initialize(
            governorParams.name,
            tokenClone,
            timelockClone,
            governorParams.proposalThreshold,
            governorParams.votingDelay,
            governorParams.votingPeriod,
            governorParams.quorumNumerator
        );

        MintingFilter mintingFilter = _cloneAndInitMintingFilter(mintingFilterParams);
        initMinter(minterClone, timelockClone, tokenClone, minterParams, creatorAddress, mintingFilter);

        emit NewClone(
            address(tokenClone),
            address(timelockClone),
            address(governorClone),
            address(minterClone),
            address(mintingFilter)
        );
    }

    function initToken(
        ERC721DAOToken tokenClone,
        ERC721Minter minterClone,
        address creatorAddress,
        TokenParams memory tokenParams,
        IRoyaltyInfo.RoyaltyInfo memory royaltyInfo
    ) private {
        (bytes32[] memory roles, address[] memory rolesAssignees) = generateTokenRolesAndAssignees(
            tokenClone,
            creatorAddress,
            minterClone
        );

        tokenClone.initialize(
            tokenParams.name,
            tokenParams.symbol,
            tokenParams.baseURI,
            tokenParams.contractInfoURI,
            roles,
            rolesAssignees,
            royaltyInfo,
            tokenParams.tokenURIDescriptor,
            creatorAddress
        );
    }

    function initTimelock(
        ERC721Timelock timelockClone,
        ERC721Governor governorClone,
        uint256 timelockDelay
    ) private {
        address[] memory proposers = new address[](1);
        proposers[0] = address(governorClone);
        address[] memory executors = new address[](1);
        executors[0] = address(0);

        timelockClone.initialize(timelockDelay, proposers, executors);
    }

    function initMinter(
        ERC721Minter minterClone,
        ERC721Timelock timelockClone,
        ERC721DAOToken tokenClone,
        MinterParams calldata minterParams,
        address creatorAddress,
        MintingFilter mintingFilter
    ) private {
        address[] memory payees = new address[](2);
        payees[0] = creatorAddress;
        payees[1] = address(timelockClone);

        uint256[] memory shares = new uint256[](2);
        shares[0] = minterParams.creatorShares;
        shares[1] = minterParams.daoShares;

        minterClone.initialize(
            creatorAddress,
            tokenClone,
            minterParams.startingBlock,
            payees,
            shares,
            mintingFilter,
            minterParams.extraInitCallData,
            serviceFeeAddress,
            serviceFeeBasisPoints,
            owner()
        );
    }

    function cloneAndInitMintingFilter(MintingFilterParams calldata mintingFilterParams)
        public
        returns (MintingFilter)
    {
        MintingFilter mintingFilter = _cloneAndInitMintingFilter(mintingFilterParams);
        emit NewMintingFilterClone(address(mintingFilter));
        return mintingFilter;
    }

    function _cloneAndInitMintingFilter(MintingFilterParams calldata mintingFilterParams)
        private
        returns (MintingFilter)
    {
        if (!mintingFilterParams.useMintingFilter) {
            return MintingFilter(address(0));
        }
        require(
            mintingFilterParams.implementationIndex < mintingFilters.length,
            "ERC721DAODeployer: mintingFilter implementationIndex out of bounds"
        );

        address newClone = address(mintingFilters[mintingFilterParams.implementationIndex]).clone();
        newClone.functionCall(mintingFilterParams.initCallData);

        return MintingFilter(newClone);
    }

    function setImplementations(
        ERC721DAOToken token_,
        ERC721Timelock timelock_,
        ERC721Governor governor_,
        ERC721Minter[] calldata minters_,
        MintingFilter[] calldata mintingFilters_
    ) external onlyOwner {
        _setImplementations(token_, timelock_, governor_, minters_, mintingFilters_);
    }

    function setServiceFeeAddress(address payable newAddress) external onlyOwner {
        serviceFeeAddress = newAddress;
        emit ServiceFeeAddressUpdated(serviceFeeAddress);
    }

    function setServiceFeeBasisPoints(uint256 serviceFeeBasisPoints_) external onlyOwner {
        serviceFeeBasisPoints = serviceFeeBasisPoints_;
        emit ServiceFeeBasisPointsUpdated(serviceFeeBasisPoints);
    }

    function _setImplementations(
        ERC721DAOToken token_,
        ERC721Timelock timelock_,
        ERC721Governor governor_,
        ERC721Minter[] calldata minters_,
        MintingFilter[] calldata mintingFilters_
    ) internal {
        token = token_;
        timelock = timelock_;
        governor = governor_;
        minters = minters_;
        mintingFilters = mintingFilters_;

        emit ImplementationsSet(
            address(token_),
            address(timelock_),
            address(governor_),
            mintersToAddresses(minters_),
            mintingFiltersToAddresses(mintingFilters_)
        );
    }

    /**
     * @dev Generic cloning function: just clones an implementation with initializing it. Serves as a basic building block for less common flows, e.g.
     * if someone just wants to deploy a token with a minter, they can clone using this function, and complete the initialization sequence in client code.
     *
     * Emits a {NewSingleClone} event.
     */
    function cloneContract(address impl) external returns (address) {
        address newClone = impl.clone();
        emit NewSingleClone(newClone);
        return newClone;
    }

    /**
     * @dev Generic cloning function: clones and initializes a contract. Serves as a basic building block for less common flows, e.g.
     * it can be used to deploy a new minter to swap minters on the same token.
     *
     * Emits a {NewSingleClone} event.
     */
    function cloneAndInitContract(address impl, bytes calldata initCallData) external returns (address) {
        address newClone = impl.clone();
        newClone.functionCall(initCallData);

        emit NewSingleClone(newClone);

        return newClone;
    }

    function createTimelockInstance(GovernorParams calldata governorParams) private returns (ERC721Timelock) {
        if (governorParams.upgradable) {
            return ERC721Timelock(payable(new ERC1967Proxy(address(timelock), "")));
        }
        return ERC721Timelock(payable(address(timelock).clone()));
    }

    function createGovernorInstance(GovernorParams calldata governorParams) private returns (ERC721Governor) {
        if (governorParams.upgradable) {
            return ERC721Governor(payable(new ERC1967Proxy(address(governor), "")));
        }
        return ERC721Governor(payable(address(governor).clone()));
    }

    function mintersToAddresses(ERC721Minter[] calldata minters_) private pure returns (address[] memory) {
        address[] memory addrs = new address[](minters_.length);
        for (uint256 i = 0; i < minters_.length; i++) {
            addrs[i] = address(minters_[i]);
        }
        return addrs;
    }

    function mintingFiltersToAddresses(MintingFilter[] calldata mintingFilters_)
        private
        pure
        returns (address[] memory)
    {
        address[] memory addrs = new address[](mintingFilters_.length);
        for (uint256 i = 0; i < mintingFilters_.length; i++) {
            addrs[i] = address(mintingFilters_[i]);
        }
        return addrs;
    }

    function generateTokenRolesAndAssignees(
        ERC721DAOToken token_,
        address creatorAddress,
        ERC721Minter minterClone
    ) private view returns (bytes32[] memory, address[] memory) {
        bytes32[] memory roles = new bytes32[](11);
        roles[0] = token_.ADMINS_ADMIN_ROLE();
        roles[1] = token_.MINTER_ADMIN_ROLE();
        roles[2] = token_.BASE_URI_ADMIN_ROLE();
        roles[3] = token_.ROYALTIES_ADMIN_ROLE();
        roles[4] = token_.BASE_URI_ROLE();
        roles[5] = token_.MINTER_ROLE();
        roles[6] = token_.ROYALTIES_ROLE();
        roles[7] = token_.PROXY_REGISTRY_ROLE();
        roles[8] = token_.PROXY_REGISTRY_ADMIN_ROLE();
        roles[9] = token_.TRANSFERS_ROLE();
        roles[10] = token_.TRANSFERS_ADMIN_ROLE();

        address[] memory rolesAssignees = new address[](11);
        rolesAssignees[0] = creatorAddress;
        rolesAssignees[1] = creatorAddress;
        rolesAssignees[2] = creatorAddress;
        rolesAssignees[3] = creatorAddress;
        rolesAssignees[4] = creatorAddress;
        rolesAssignees[5] = address(minterClone);
        rolesAssignees[6] = creatorAddress;
        rolesAssignees[7] = creatorAddress;
        rolesAssignees[8] = creatorAddress;
        rolesAssignees[9] = creatorAddress;
        rolesAssignees[10] = creatorAddress;

        return (roles, rolesAssignees);
    }
}
