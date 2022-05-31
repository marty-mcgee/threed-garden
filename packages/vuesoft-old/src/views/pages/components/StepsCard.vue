<template>
  <div class="card">
    <div class="card-body">
      <p>{{ title }}</p>
      <h3>{{ steps }}</h3>
      <vsud-badge color="success">+4.3%</vsud-badge>
    </div>
  </div>
</template>

<script>
import VsudBadge from "@/components/VsudBadge.vue";

export default {
  name: "steps-card",
  props: {
    title: {
      type: String,
      default: "Steps",
    },
    steps: {
      type: String,
      default: "11.4K",
    },
  },
  components: {
    VsudBadge,
  },
};
</script>
