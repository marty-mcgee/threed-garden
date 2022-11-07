"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMainnetSdk = exports.getContract = void 0;
const ethers_1 = require("ethers");
const DAI_json_1 = __importDefault(require("../../abis/mainnet/DAI.json"));
function getContract(address, abi, defaultSignerOrProvider) {
    return new ethers_1.Contract(address, abi, defaultSignerOrProvider);
}
exports.getContract = getContract;
function getMainnetSdk(defaultSignerOrProvider) {
    return {
        "DAI": getContract('0x6b175474e89094c44da98b954eedeac495271d0f', DAI_json_1.default, defaultSignerOrProvider),
    };
}
exports.getMainnetSdk = getMainnetSdk;
