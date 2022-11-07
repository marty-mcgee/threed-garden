import { Contract } from 'ethers';
import mainnet_DAI_abi from '../../abis/mainnet/DAI.json';
export function getContract(address, abi, defaultSignerOrProvider) {
    return new Contract(address, abi, defaultSignerOrProvider);
}
export function getMainnetSdk(defaultSignerOrProvider) {
    return {
        "DAI": getContract('0x6b175474e89094c44da98b954eedeac495271d0f', mainnet_DAI_abi, defaultSignerOrProvider),
    };
}
