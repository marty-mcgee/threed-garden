<script setup lang="ts">

console.log('*** HEY HEY HEY -- App.vue 1 (typescript setup)')

import LayoutHeader from './components/LayoutHeader.vue'

// VueUse --
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
// useHead({
//   title: 'ThreeD Garden',
//   // meta: [
//   //   { charset: 'utf-8' },
//   //   { equiv: 'Content-Type', content: 'text/html' },
//   //   { name: 'viewport', content: 'width=device-width, initial-scale=1' },
//   //   { name: 'description', content: '3D Virtual Homestead' }
//   // ]
// })

</script>
<!--
<script lang="ts">

// // vue dapp

// window.global = window
// let global = globalThis

// import process from 'process'
// window.process = process

// import buffer from 'buffer'
// window.Buffer = buffer.Buffer

// import util from 'util'
// window.util = util

// CONNECT TO ETHEREUM NETWORK NODE(S)

// OPTION 1 "web3"

// vue web3
import Web3 from "web3"
import WalletConnectProvider from "@walletconnect/web3-provider"

// Create WalletConnect Provider
const provider4Web3 = new WalletConnectProvider({
  infuraId: "432d743bb1d944268c6e3725f243a7e0" // Required
})

// Enable session (triggers QR Code modal)
//provider.enable()
// (async () => {
// 	await provider.enable()
// })()

// Create Web3
const web3 = new Web3(provider4Web3)

console.log("vue web3 (provider)", web3, provider4Web3)

console.log('*** HEY HEY HEY -- App.vue (web3)')

// OPTION 2 "ethers"

// vue ethers
import { ethers } from "ethers"

// OPTION 2.1 for connecting to "ethers"

// ethers: Connecting to Ethereum: MetaMask
// A Web3Provider wraps a standard Web3 provider, which is
// what MetaMask injects as window.ethereum into each page
const provider4ethers = new ethers.providers.Web3Provider(window.ethereum)

// The MetaMask plugin also allows signing transactions to
// send ether and pay to change state within the blockchain.
// For this, you need the account signer...
const signer4ethers = provider4ethers.getSigner()

// AND/OR
// // OPTION 2.2 for connecting to "ethers"

// // ethers: Connecting to Ethereum: RPC
// // If you don't specify a //url//, Ethers connects to the default 
// // (i.e. ``http:/\/localhost:8545``)
// const provider4ethers = new ethers.providers.JsonRpcProvider();

// // The provider also allows signing transactions to
// // send ether and pay to change state within the blockchain.
// // For this, we need the account signer...
// const signer4ethers = provider4ethers.getSigner()

console.log("ethers (provider, signer)", provider4ethers, signer4ethers)

console.log('*** HEY HEY HEY -- App.vue (ethers)')


/** ------------------------------- */
// Querying the Blockchain
/** ------------------------------- */

// Once you have a Provider, you have a read-only connection to the blockchain, which you can use to query the current state, fetch historic logs, look up deployed code and so on.

// // Basic Queries
// // Look up the current block number
// await provider4ethers.getBlockNumber()
// // 13722573

// // Get the balance of an account (by address or ENS name, if supported by network)
// balance4ethers = await provider4ethers.getBalance("ethers.eth")
// // { BigNumber: "2337132817842795605" }

// // Often you need to format the output to something more user-friendly,
// // such as in ether (instead of wei)
// ethers.utils.formatEther(balance4ethers)
// // '2.337132817842795605'

// // If a user enters a string in an input field, you may need
// // to convert it from ether (as a string) to wei (as a BigNumber)
// ethers.utils.parseEther("0.0") // zero!
// // { BigNumber: "1000000000000000000" }

// /** ------------------------------- */
// // Writing to the Blockchain
// // Sending Ether (real money transactions here, be careful here, forever)
// /** ------------------------------- */

// // Send "1" ether to an ens name.
// const tx = signer4ethers.sendTransaction({
//     to: "ricmoo.firefly.eth", // to???
//     value: ethers.utils.parseEther("0.000000") // zero!
// });

// console.log("ethers tx", tx)

</script>
-->
<script>
import HelloWorld from "./components/HelloWorld.vue";

export default {
  name: "EthereumApp",
  components: {
    HelloWorld,
  },
};
</script>

<template>
	<div id="APP">
		<HelloWorld msg="Welcome to Your Ethereum App" />
		<layout-header />
		<router-view />
		<vdapp-board />
	</div>
</template>