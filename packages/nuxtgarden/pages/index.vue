<template>
  <h1>Welcome to NuxtGarden</h1>
  <!-- <smart-home /> -->
</template>

<script>
// import SmartHome from "@/components/dashboards/SmartHome.vue"

definePageMeta({
  // layout: "default",
  // layout: "custom",
  layout: "dashboard",
  title: "Index",
})

export default {
  name: "Index",
  components: {
    // SmartHome,
  },
}
</script>
