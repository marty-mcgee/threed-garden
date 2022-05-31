<template>
  <div class="card">
    <div class="card-header pb-0">
      <div class="d-flex">
        <p>{{ title }}</p>
        <div :class="isRTL ? 'me-auto' : 'ms-auto'">
          <vsud-badge :color="badge.color">{{ badge.text }}</vsud-badge>
        </div>
      </div>
    </div>
    <div class="card-body pt-0">
      <p class="mb-0">{{ description }}</p>
    </div>
  </div>
</template>

<script>
import VsudBadge from "@/components/VsudBadge.vue";
import { mapState } from "vuex";
export default {
  name: "InfoCard",
  components: {
    VsudBadge,
  },
  props: {
    title: {
      type: String,
      default: "",
    },
    badge: {
      type: Object,
      default: () => ({
        color: "success",
        text: "Moderate",
      }),
      text: String,
      color: String,
    },
    description: {
      type: String,
      default: "",
    },
  },
  computed: {
    ...mapState(["isRTL"]),
  },
};
</script>
