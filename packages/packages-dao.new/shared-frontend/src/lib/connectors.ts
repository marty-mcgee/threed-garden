import { ChainId } from '@usedapp/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

const POLLING_INTERVAL = 12000
const RPC_URLS: { [chainId: number]: string } = {
  [ChainId.Rinkeby]: process.env.NEXT_PUBLIC_RINKEBY_JSON_RPC,
  [ChainId.Mainnet]: process.env.NEXT_PUBLIC_MAINNET_JSON_RPC,
  [ChainId.OptimismKovan]: 'https://kovan.optimism.io',
}
export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  qrcode: true,
  pollingInterval: POLLING_INTERVAL,
})
