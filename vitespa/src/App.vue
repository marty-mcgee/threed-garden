<script setup lang="ts">

console.log('HEY HEY HEY -- App.vue')

// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'ThreeD Garden',
  // meta: [
  //   { charset: 'utf-8' },
  //   { equiv: 'Content-Type', content: 'text/html' },
  //   { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  //   { name: 'description', content: '3D Virtual Homestead' }
  // ]
})
</script>

<template>
  <router-view />
</template>
