<template>
  <div class="card h-100">
    <div class="card-header pb-0 p-3">
      <h6 class="mb-0">{{ title }}</h6>
    </div>
    <div class="card-body pb-0 p-3">
      <ul class="list-group">
        <li
          v-for="({ title: reviewTitle, value, color }, index) of reviews"
          :key="index"
          class="list-group-item border-0 d-flex align-items-center px-0 mb-0"
        >
          <div class="w-100">
            <div class="d-flex mb-2">
              <span class="me-2 text-sm font-weight-bold text-capitalize">
                {{ reviewTitle }}
              </span>
              <span class="ms-auto text-sm font-weight-bold">{{ value }}%</span>
            </div>
            <div>
              <vsud-progress
                :color="color"
                variant="gradient"
                :percentage="value"
              />
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="card-footer pt-0 p-3 d-flex align-items-center">
      <div class="w-60">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="text-sm" v-html="description"></p>
      </div>
      <div class="w-40 text-end">
        <a
          class="btn mb-0 text-end"
          :class="`bg-gradient-${action.color}`"
          :href="action.route"
        >
          {{ action.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import VsudProgress from "@/components/VsudProgress.vue";

export default {
  name: "ReviewCard",
  components: {
    VsudProgress,
  },
  props: {
    title: {
      type: String,
      default: "Reviews",
    },
    description: {
      type: String,
      default: "",
    },
    reviews: {
      type: Array,
      title: String,
      value: Number,
      color: String,
      default: () => [],
    },
    action: {
      type: Object,
      route: String,
      color: String,
      label: String,
      default: () => ({
        route: "javascript:;",
        color: "dark",
        label: "View all reviews",
      }),
    },
  },
};
</script>
