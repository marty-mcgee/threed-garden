<template>
  <GardenDashboard />
  <!-- <div @click="handleNavigate">click</div> -->
</template>

<script>
// import { useNuxtApp } from "nuxt/app"
import GardenDashboard from "@/components/dashboards/Automotive.vue"

definePageMeta({
  layout: "custom", // default | dashboard | threed | custom
  title: "Participate",
})

export default {
  name: "Participate",
  components: {
    GardenDashboard,
  },
  // setup() {

  //   const nuxtApp = useNuxtApp()

  //   definePageMeta({
  //     layout: "threed", // default | dashboard | threed | custom
  //     title: "Participate",
  //   })

  //   return {}

  // },
  // methods: {
  //   handleNavigate = () => {
  //     console.log('nuxtApp', nuxtApp)
  //   }
  // }
}
</script>
