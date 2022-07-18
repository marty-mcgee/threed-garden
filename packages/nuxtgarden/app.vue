<template>
  <div id="APP">
    <!-- <h1>HEY HEY HEY</h1> -->
    <!-- <NuxtWelcome /> -->
    <!-- <Welcome /> -->
    <button type="button" @click="counterStore1.currentValue++">
      count is: {{ counterStore1.currentValue }}
    </button>
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// import UIDashboard from "@/assets/js/ui-dashboard"
import { useCounterStore1 } from './stores/counter1'

const counterStore1 = useCounterStore1()

// USENUXTAPP
// function useMyComposable () {
//   const nuxtApp = useNuxtApp()
//   // access runtime nuxt app instance
//   nuxtApp.use(UIDashboard)
// }
// useMyComposable()

const nuxtApp = useNuxtApp()
nuxtApp.provide('hello', (name) => `Hello ${name}!`)
console.log(nuxtApp.$hello('helper')) // Prints "Hello helper!"


// get current (page) route + route.meta.title
const route = useRoute()
// console.log("route", route)
// console.log("route.meta", route.meta)
const title = route.meta.title
// console.log("title", route.meta.title)

// DOM <head>
useHead({
  title: `${title} - NuxtGarden`,
  // or, instead: ?? but why ??
  // titleTemplate: (x) => `${route.meta.title} - NuxtGarden`,
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  charset: 'utf-8',
  meta: [
    { name: 'description', content: 'ThreeD Garden on Nuxt Vue' },
    { name: 'og:title', content: `NuxtGarden - ${title}` }
  ],
  bodyAttrs: {
    class: 'threedgarden'
  }
})

// user authentication
if (route.params.group === 'admins' && !route.params.id) {
  console.log('Warning! Make sure user is authenticated!')
}

</script>
<script>

</script>