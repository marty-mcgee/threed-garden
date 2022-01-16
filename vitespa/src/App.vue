<script setup lang="ts">

console.log('HEY HEY HEY -- App.vue 1')
import LayoutHeader from './components/LayoutHeader.vue'

</script>
<script lang="ts">

console.log('HEY HEY HEY -- App.vue 2')

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

// // vue dapp

// window.global = window
// let global = globalThis

// import process from 'process'
// window.process = process

// import buffer from 'buffer'
// window.Buffer = buffer.Buffer

// import util from 'util'
// window.util = util

</script>

<template>
	<div id="APP">
		<layout-header />
		<router-view />
		<vdapp-board />
	</div>
</template>