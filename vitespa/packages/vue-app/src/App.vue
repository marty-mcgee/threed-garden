<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/ethereumLogo.png" width="205px" height="342px" />
    <HelloWorld msg="Ethereum Vue dApp" />
  </div>
</template>

<script type="ts" setup>
import HelloWorld from "./components/HelloWorld.vue"

export default {
  name: "EthereumApp",
  components: {
    HelloWorld,
  },
}
</script>

<style>
#app {
  font-family: Times New Roman, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>