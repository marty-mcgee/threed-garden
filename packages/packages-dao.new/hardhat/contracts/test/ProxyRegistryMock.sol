// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import { IProxyRegistry } from "../lib/IProxyRegistry.sol";

contract ProxyRegistryMock is IProxyRegistry {
    mapping(address => address) public _proxies;

    function proxies(address owner) external view override returns (address) {
        return _proxies[owner];
    }

    function setReturnValueForOwner(address owner, address returnValue) public {
        _proxies[owner] = returnValue;
    }
}
