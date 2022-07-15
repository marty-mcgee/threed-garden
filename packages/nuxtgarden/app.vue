<template>
  <div id="APP">
    <!-- <h1>HEY HEY HEY</h1> -->
    <!-- <NuxtWelcome /> -->
    <!-- <Welcome /> -->
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>

<script setup>

// get current (page) route + route.meta.title
const route = useRoute()
// console.log("route", route)
// console.log("route.meta", route.meta)
const title = route.meta.title
console.log("title", route.meta.title)

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