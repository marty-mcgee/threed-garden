<template>
  <default-dashboard />
</template>

<script>
import DefaultDashboard from "@/components/dashboards/Default.vue"

definePageMeta({
  layout: "default", // default | dashboard | threed | custom
  title: "About",
})

export default {
  name: "About",
  components: {
    DefaultDashboard,
  },
}
</script>
