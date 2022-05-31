<template>
  <div class="card">
    <div class="card-body">
      <p>{{ title }}</p>
      <h3>{{ count }}</h3>
      <vsud-badge :color="badge.color">{{ badge.label }}</vsud-badge>
    </div>
  </div>
</template>

<script>
import VsudBadge from "@/components/VsudBadge.vue";

export default {
  name: "StepsCard",
  components: {
    VsudBadge,
  },
  props: {
    title: {
      type: String,
      default: "Steps",
    },
    count: {
      type: String,
      default: "11.4K",
    },
    badge: {
      type: Object,
      label: String,
      color: String,
      default: () => ({
        color: "success",
      }),
    },
  },
};
</script>
