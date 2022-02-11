// SPDX-License-Identifier: MIT

/// @title ERC-721 token for DAOs.

pragma solidity ^0.8.6;

import { AccessControlEnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ERC721VotesUpgradeable, ERC721Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/draft-ERC721VotesUpgradeable.sol";
import { ERC2981ContractWideRoyalties } from "./ERC2981ContractWideRoyalties.sol";
import { IRoyaltyInfo } from "./IRoyaltyInfo.sol";
import { IProxyRegistry } from "../lib/IProxyRegistry.sol";
import { ITokenURIDescriptor } from "./ITokenURIDescriptor.sol";

contract ERC721DAOToken is
    ERC721VotesUpgradeable,
    ERC2981ContractWideRoyalties,
    AccessControlEnumerableUpgradeable,
    OwnableUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant MINTER_ADMIN_ROLE = keccak256("MINTER_ADMIN_ROLE");
    bytes32 public constant BASE_URI_ROLE = keccak256("BASE_URI_ROLE");
    bytes32 public constant BASE_URI_ADMIN_ROLE = keccak256("BASE_URI_ADMIN_ROLE");
    bytes32 public constant ROYALTIES_ROLE = keccak256("ROYALTIES_ROLE");
    bytes32 public constant ROYALTIES_ADMIN_ROLE = keccak256("ROYALTIES_ADMIN_ROLE");
    bytes32 public constant PROXY_REGISTRY_ROLE = keccak256("PROXY_REGISTRY_ROLE");
    bytes32 public constant PROXY_REGISTRY_ADMIN_ROLE = keccak256("PROXY_REGISTRY_ADMIN_ROLE");
    bytes32 public constant TRANSFERS_ROLE = keccak256("TRANSFERS_ROLE");
    bytes32 public constant TRANSFERS_ADMIN_ROLE = keccak256("TRANSFERS_ADMIN_ROLE");
    bytes32 public constant ADMINS_ADMIN_ROLE = keccak256("ADMINS_ADMIN_ROLE");

    string public baseURI;
    /**
     * @notice The IPFS URI of the project's metadata.
     */
    string public contractInfoURI;
    bool public baseURIEnabled;
    IProxyRegistry public proxyRegistry;
    bool public proxyRegistryEnabled;
    ITokenURIDescriptor public tokenURIDescriptor;
    bool public transfersDisabled;

    event BaseURIChanged(string newURI);
    event ContractInfoURIChanged(string newContractInfoURI);
    event BaseURIEnabledChanged(bool baseURIEnabled);
    event ProxyRegistryChanged(address newProxyRegistry);
    event ProxyRegistryEnabledChanged(bool proxyRegistryEnabled);
    event TokenURIDescriptorChanged(address newTokenURIDescriptor);
    event MinterChanged(address oldMinter, address newMinter);
    event TransfersDisabledChanged(bool transfersDisabled);

    error RolesAssignmentArityMismatch();
    error TransfersDisabled();

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC2981ContractWideRoyalties, AccessControlEnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        string memory contractInfoURI_,
        bytes32[] memory roles,
        address[] memory rolesAssignees,
        IRoyaltyInfo.RoyaltyInfo memory royaltiesInfo,
        ITokenURIDescriptor tokenURIDescriptor_,
        address creator
    ) public initializer {
        if (roles.length != rolesAssignees.length) {
            revert RolesAssignmentArityMismatch();
        }

        // Owner is needed in order to edit collection details on marketplaces (e.g opensea / rarible)
        __Ownable_init_unchained();
        transferOwnership(creator);

        __ERC721_init(name_, symbol_);
        baseURI = baseURI_;

        contractInfoURI = contractInfoURI_;
        _setRoyalties(royaltiesInfo.recipient, royaltiesInfo.bps);
        proxyRegistryEnabled = false;
        tokenURIDescriptor = tokenURIDescriptor_;
        transfersDisabled = false;

        _setRoleAdmin(ADMINS_ADMIN_ROLE, ADMINS_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ADMIN_ROLE, ADMINS_ADMIN_ROLE);
        _setRoleAdmin(BASE_URI_ADMIN_ROLE, ADMINS_ADMIN_ROLE);
        _setRoleAdmin(ROYALTIES_ADMIN_ROLE, ADMINS_ADMIN_ROLE);
        _setRoleAdmin(PROXY_REGISTRY_ADMIN_ROLE, ADMINS_ADMIN_ROLE);
        _setRoleAdmin(TRANSFERS_ADMIN_ROLE, ADMINS_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, MINTER_ADMIN_ROLE);
        _setRoleAdmin(BASE_URI_ROLE, BASE_URI_ADMIN_ROLE);
        _setRoleAdmin(ROYALTIES_ROLE, ROYALTIES_ADMIN_ROLE);
        _setRoleAdmin(PROXY_REGISTRY_ROLE, PROXY_REGISTRY_ADMIN_ROLE);
        _setRoleAdmin(TRANSFERS_ROLE, TRANSFERS_ADMIN_ROLE);

        // assign roles
        for (uint256 i = 0; i < roles.length; i++) {
            _setupRole(roles[i], rolesAssignees[i]);
        }
    }

    function mint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        // Whitelist OpenSea proxy contract for easy trading.
        if (proxyRegistryEnabled && proxyRegistry.proxies(owner) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    function setProxyRegistryAndEnable(IProxyRegistry proxyRegistry_) public onlyRole(PROXY_REGISTRY_ROLE) {
        setProxyRegistry(proxyRegistry_);
        setProxyRegistryEnabled(true);
    }

    function setProxyRegistry(IProxyRegistry proxyRegistry_) public onlyRole(PROXY_REGISTRY_ROLE) {
        proxyRegistry = proxyRegistry_;
        emit ProxyRegistryChanged(address(proxyRegistry_));
    }

    function setProxyRegistryEnabled(bool proxyRegistryEnabled_) public onlyRole(PROXY_REGISTRY_ROLE) {
        proxyRegistryEnabled = proxyRegistryEnabled_;
        emit ProxyRegistryEnabledChanged(proxyRegistryEnabled_);
    }

    function setTokenURIDescriptor(ITokenURIDescriptor tokenURIDescriptor_) public onlyRole(BASE_URI_ROLE) {
        tokenURIDescriptor = tokenURIDescriptor_;
        emit TokenURIDescriptorChanged(address(tokenURIDescriptor_));
    }

    function setRoyalties(address recipient, uint256 bps) public onlyRole(ROYALTIES_ROLE) {
        _setRoyalties(recipient, bps);
    }

    /**
     * @notice Should be an IPFS link to the project folder, which should contain everything the
     * project needs, including:
     * - the project metadata JSON, e.g. ipfs://QmZi1n79FqWt2tTLwCqiy6nLM6xLGRsEPQ5JmReJQKNNzX
     * - all the asset descriptors and media files
     */
    function setBaseURI(string memory baseURI_) public onlyRole(BASE_URI_ROLE) {
        baseURI = baseURI_;
        emit BaseURIChanged(baseURI_);
    }

    function setBaseURIEnabled(bool baseURIEnabled_) public onlyRole(BASE_URI_ROLE) {
        baseURIEnabled = baseURIEnabled_;
        emit BaseURIEnabledChanged(baseURIEnabled_);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (baseURIEnabled) {
            return super.tokenURI(tokenId);
        } else {
            return tokenURIDescriptor.tokenURI(tokenId, name(), symbol());
        }
    }

    function setContractInfoURI(string memory contractInfoURI_) public onlyRole(BASE_URI_ROLE) {
        contractInfoURI = contractInfoURI_;
        emit ContractInfoURIChanged(contractInfoURI_);
    }

    function contractURI() public view returns (string memory) {
        return contractInfoURI;
    }

    function swapMinter(address newMinter) public onlyRole(MINTER_ADMIN_ROLE) {
        address oldMinter = getRoleMember(MINTER_ROLE, 0);

        revokeRole(MINTER_ROLE, oldMinter);
        grantRole(MINTER_ROLE, newMinter);

        emit MinterChanged(oldMinter, newMinter);
    }

    function setTransfersDisabled(bool transfersDisabled_) public onlyRole(TRANSFERS_ROLE) {
        transfersDisabled = transfersDisabled_;

        emit TransfersDisabledChanged(transfersDisabled_);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        if (!isTransferMintOrBurn(from, to) && transfersDisabled) {
            revert TransfersDisabled();
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }

    function isTransferMintOrBurn(address from, address to) internal pure returns (bool) {
        return from == address(0) || to == address(0);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function totalSupply() public view returns (uint256) {
        return _getTotalSupply();
    }
}
