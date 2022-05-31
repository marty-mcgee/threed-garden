<template>
  <div class="col-md-4 col-12">
    <div class="card card-plain text-center">
      <div class="card-body">
        <div
          class="icon icon-shape bg-gradient-dark shadow text-center border-radius-md mb-2"
        >
          <i
            class="ni text-lg opacity-10"
            :class="`ni-${icon}`"
            aria-hidden="true"
          ></i>
        </div>
        <p class="text-sm font-weight-bold mb-2">
          {{ description }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <h5 class="font-weight-bolder" v-html="value"></h5>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "TransparentInfoCard",
  props: {
    icon: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    value: {
      type: String,
      default: "",
    },
  },
};
</script>
