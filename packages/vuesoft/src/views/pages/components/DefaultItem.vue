<template>
  <div class="d-flex mt-2">
    <div
      class="icon icon-shape shadow text-center border-radius-md shadow-none"
      :class="`bg-${icon.color}-soft`"
    >
      <i
        class="ni text-lg text-gradient opacity-10"
        :class="`ni-${icon.component} text-${icon.color}`"
        aria-hidden="true"
      ></i>
    </div>
    <div :class="isRTL ? 'me-3' : 'ms-3'">
      <div class="numbers">
        <h6 class="mb-1 text-dark text-sm">{{ title }}</h6>
        <span class="text-sm">{{ description }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "DefaultItem",
  props: {
    icon: {
      type: Object,
      default: () => {},
      component: String,
      color: String,
    },
    title: {
      type: String,
      default: "Upcoming events",
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
