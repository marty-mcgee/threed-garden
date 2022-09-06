<template>
  <div class="card">
    <div class="card-header pb-0">
      <div class="d-flex">
        <p>{{ title }}</p>
        <div :class="$store.state.isRTL ? 'me-auto' : 'ms-auto'">
          <vsud-badge color="success">{{ badgeText }}</vsud-badge>
        </div>
      </div>
    </div>
    <div class="card-body pt-0">
      <p class="mb-0">{{ description }}</p>
    </div>
  </div>
</template>

<script>
import VsudBadge from "@/components/vitesoft/VsudBadge.vue";

export default {
  name: "FullBodyCard",
  components: {
    VsudBadge,
  },
  props: {
    title: {
      type: String,
      default: "Full Body",
    },
    badgeText: {
      type: String,
      default: "Moderate",
    },
    description: {
      type: String,
      default:
        "What matters is the people who are sparked by it. And the people who are liked.",
    },
  },
};
</script>
