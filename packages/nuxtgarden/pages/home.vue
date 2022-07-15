<template>
  <default-dashboard />
</template>

<script>
import DefaultDashboard from "@/components/dashboards/Default.vue"

definePageMeta({
  layout: "default",
  // layout: "custom",
  title: "Home",
})

export default {
  name: "Home",
  components: {
    DefaultDashboard,
  },
}
</script>
