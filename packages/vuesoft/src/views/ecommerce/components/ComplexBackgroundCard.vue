<template>
  <div class="col-lg-4 col-md-6 col-12">
    <div class="card text-center">
      <div
        class="overflow-hidden position-relative border-radius-lg bg-cover p-3"
        :style="{ backgroundImage: `url(${image})` }"
      >
        <span class="mask bg-gradient-dark opacity-6"></span>
        <div
          class="card-body position-relative z-index-1 d-flex flex-column mt-5"
        >
          <p class="text-white font-weight-bolder">
            {{ description }}
          </p>
          <a
            class="text-white text-sm font-weight-bold mb-0 icon-move-right mt-4"
            :href="action.route"
          >
            {{ action.label }}
            <i class="fas fa-arrow-right text-sm ms-1" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "ComplexBackgroundCard",
  props: {
    image: {
      type: String,
      default:
        "'https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/window-desk.jpg'",
    },
    description: {
      type: String,
      default: "",
    },
    action: {
      type: Object,
      route: String,
      label: String,
      default: () => ({ route: "javascript:;", label: "read more" }),
    },
  },
};
</script>
