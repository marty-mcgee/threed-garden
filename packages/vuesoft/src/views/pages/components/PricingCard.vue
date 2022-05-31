<template>
  <div class="mb-4 col-lg-4 mb-lg-0">
    <div class="card">
      <div class="pt-4 pb-3 text-center card-header">
        <span class="badge rounded-pill bg-light text-dark">
          {{ badge.label }}
        </span>
        <h1 class="mt-2 font-weight-bold">
          <small>{{ price.currency }}</small
          >{{ price.value }}
        </h1>
      </div>
      <div class="pt-0 text-center card-body text-lg-start">
        <div
          v-for="({ label, includes }, index) of specifications"
          :key="index"
          class="p-2 d-flex justify-content-lg-start justify-content-center"
        >
          <div
            class="text-center shadow icon icon-shape icon-xs rounded-circle bg-gradient-success"
          >
            <i
              class="fas"
              :class="includes ? 'fa-check opacity-10' : 'fa-minus'"
            ></i>
          </div>
          <div>
            <span class="ps-3">{{ label }}</span>
          </div>
        </div>
        <a
          :href="action.route"
          class="mt-3 mb-0 btn btn-icon d-lg-block"
          :class="`bg-gradient-${action.color}`"
        >
          {{ action.label }}
          <i class="fas fa-arrow-right ms-1"></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PricingCard",
  props: {
    badge: {
      type: Object,
      color: String,
      label: String,
      default: () => {},
    },
    price: {
      type: Object,
      currency: String,
      value: [Number, String],
      default: () => {},
    },
    specifications: {
      type: Array,
      label: String,
      includes: Boolean,
      default: () => [],
    },
    action: {
      type: Object,
      route: String,
      label: String,
      color: String,
      default: () => ({
        route: "/",
        label: "Join",
        color: "success",
      }),
    },
  },
};
</script>
