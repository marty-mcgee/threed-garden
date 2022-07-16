<template>
  <default-dashboard />
</template>

<script>
import DefaultDashboard from "@/components/dashboards/Default.vue"

definePageMeta({
  layout: "default",
  // layout: "custom",
  title: "Participate",
})

export default {
  name: "Participate",
  components: {
    DefaultDashboard,
  },
}
</script>
