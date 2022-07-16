<template>
  <div id="MMDEFAULT">
    <!-- 
    <sidenav /> 
    -->
    <main 
      id="main" 
      class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
    >
      <LogoGarden />
      <div>
        A *default* layout
      </div>
      <slot />
    </main>
  </div>
</template>

<script>
// [MM] you don't have to do this with NUXT 3 -- use auto-imports
// import LogoGarden from "@/components/LogoGarden.vue"

// [MM] you don't have to do this with VUE 3 -- .vue auto exports
// export default {
//   name: "Default",
//   components: {
//     LogoGarden,
//   },
// }
</script>
