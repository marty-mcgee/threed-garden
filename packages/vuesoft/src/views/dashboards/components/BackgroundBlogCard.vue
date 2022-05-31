<template>
  <div class="p-3 card">
    <div
      class="overflow-hidden bg-cover position-relative border-radius-lg h-100"
      :style="{
        backgroundImage: `url('${image}')`,
      }"
    >
      <span class="mask" :class="`bg-gradient-${color}`"></span>
      <div class="p-3 card-body position-relative z-index-1 h-100">
        <h6 class="mb-3 text-white font-weight-bolder">{{ title }}</h6>
        <p class="mb-3 text-white">
          {{ description }}
        </p>
        <a class="mb-0 btn btn-round btn-outline-white" :href="action.route">
          {{ action.label }}
          <i class="text-sm fas fa-arrow-right ms-1" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BackgroundBlogCard",
  props: {
    image: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "dark",
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    action: {
      type: Object,
      default: () => {},
      route: String,
      label: String,
    },
  },
};
</script>
