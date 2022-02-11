// SPDX-License-Identifier: MIT

/// @title Placeholder SVG for NFTs without a baseURI

pragma solidity ^0.8.6;

import { Base64 } from "base64-sol/base64.sol";
import { ITokenURIDescriptor } from "./ITokenURIDescriptor.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract SVGPlaceholder is ITokenURIDescriptor {
    using StringsUpgradeable for uint256;

    function tokenURI(
        uint256 tokenId,
        string calldata name,
        string calldata symbol
    ) external pure override returns (string memory) {
        string memory text = string(abi.encodePacked(symbol, ":#", tokenId.toString()));
        string memory description = string(abi.encodePacked(name, " ", text));
        string[7] memory parts;
        parts[0] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 350">'
        '<g transform="translate(30, 30)"><path d="M285.938,70.313c-7.753,0-14.063-6.309-14.063-14.063v-4.688H18.75v4.688c0,7.753-6.309,14.063-14.063,14.063H0v150'
        "h4.688c7.753,0,14.063,6.309,14.063,14.063v4.688h253.125v-4.688c0-7.753,6.309-14.063,14.063-14.063h4.688v-150H285.938z"
        "M281.246,84.375h-9.375v9.375h9.375v9.375h-9.375v9.375h9.375v9.375h-9.375v9.375h9.375v9.375h-9.375V150h9.375v9.375h-9.375"
        "v9.375h9.375v9.375h-9.375v9.375h9.375v9.375h-9.375v9.375h9.375v5.161c-9.165,1.866-16.407,9.108-18.273,18.277H27.652"
        "c-1.866-9.169-9.108-16.411-18.277-18.277v-5.161h9.375v-9.375H9.375V187.5h9.375v-9.375H9.375v-9.375h9.375v-9.375H9.375V150"
        "h9.375v-9.375H9.375v-9.375h9.375v-9.375H9.375V112.5h9.375v-9.375H9.375V93.75h9.375v-9.375H9.375v-5.161"
        'c9.169-1.866,16.411-9.108,18.277-18.277h235.317c1.866,9.169,9.108,16.411,18.277,18.277V84.375z" stroke="white"/>'
        '<g transform="translate(40, 120)" style="font: bold 2em monospace;" stroke="white" stroke-width="3" paint-order="stroke"><text>';
        parts[1] = name;
        parts[2] = '</text><text y="50">';
        parts[3] = string(abi.encodePacked(symbol, ":"));
        parts[4] = '</text><text y="80">';
        parts[5] = string(abi.encodePacked("#", tokenId.toString()));
        parts[6] = "</text></g></g></svg>";
        string memory svg = string(
            abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6])
        );
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        text,
                        '", "description": "',
                        description,
                        '", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );
        string memory output = string(abi.encodePacked("data:application/json;base64,", json));
        return output;
    }
}
