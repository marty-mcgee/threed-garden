<script setup lang='ts'>
  // This starter template is using Vue 3 <script setup> SFCs
  // Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
  import HelloWorld from './components/HelloWorld.vue'
</script>
<!-- <script lang="ts">
  import './style.css'
</script> -->

<template>
  <div class='App'>
    <div style='text-align: "center"; margin-bottom: 2rem'>
      <a href='https://threedgarden.com/demo' target='_blank'>
        <img src='/media/images/logo-ThreeD-Garden-Circle-Carrot.png' alt='ThreeD Garden logo' width='200' height='200' />
      </a>
      <h1>ThreeD Garden</h1>
      <div>FarmBot + ThreeJS using React Three Fiber, MUI, NextJS, and TypeScript</div>
    </div>
    <hr />
    <a href='https://vitejs.dev' target='_blank'>
      <img src='/media/images/logo-vite.svg' class='logo' alt='Vite logo' />
    </a>
    <a href='https://www.typescriptlang.org/' target='_blank'>
      <img src='/media/images/logo-typescript.svg' className='logo vanilla' alt='TypeScript logo' />
    </a>
    <a href='https://vuejs.org/' target='_blank'>
      <img src='/media/images/logo-vue.svg' class='logo vue' alt='Vue logo' />
    </a>
  </div>
  <HelloWorld msg='Vite + TypeScript + Vue' />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
