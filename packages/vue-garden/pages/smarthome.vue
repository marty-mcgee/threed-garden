<template>
  <SmartHome />
</template>
<script>
import SmartHome from "@/components/dashboards/SmartHome.vue"

definePageMeta({
  // layout: "default",
  // layout: "custom",
  layout: "dashboard",
  title: "Smart Home",
})

export default {
  name: "Route: SmartHome",
  components: {
    SmartHome,
  }
}
</script>