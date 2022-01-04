<script setup lang="ts">
//console.log('HEY HEY HEY -- App.vue')

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

<template>
	<div id="APP">
		<div id="nav">
			<!-- 
			<router-link to="/">Home</router-link> |
			<router-link to="about">About</router-link> |
			<router-link to="participate">Participate</router-link>
			-->
			<router-link :to="{ name: 'index', params: { userId: 123 }}">Home</router-link> |
			<router-link :to="{ name: 'about', params: { userId: 123 }}">About</router-link> |
			<router-link :to="{ name: 'participate', params: { userId: 123 }}">Participate</router-link>
		</div>
		<router-view />
	</div>
</template>
