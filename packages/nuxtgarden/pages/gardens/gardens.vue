<template>
  <default-dashboard />
</template>

<script>
import DefaultDashboard from "@/components/dashboards/Default.vue"

definePageMeta({
  layout: "default",
  // layout: "custom",
  // layout: "dashboard",
  title: "Gardens",
})

export default {
  name: "Gardens",
  components: {
    DefaultDashboard,
  },
}
</script>
