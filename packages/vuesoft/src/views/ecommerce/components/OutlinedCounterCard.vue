<template>
  <div class="col-lg-3 col-6 text-center">
    <div class="border-dashed border-1 border-secondary border-radius-md py-3">
      <h6 class="text-success text-gradient mb-0">{{ title }}</h6>
      <h4 class="font-weight-bolder">
        <span class="small">{{ prefix }}</span>
        {{ "" }}
        <countTo :start-val="0" :end-val="count" :duration="duration"></countTo>
        {{ "" }}
        <span class="small">{{ suffix }}</span>
      </h4>
    </div>
  </div>
</template>
<script>
import countTo from "vue-count-to/src";

export default {
  name: "TransparentInfoCard",
  components: {
    countTo,
  },
  props: {
    title: {
      type: String,
      default: "",
    },
    count: {
      type: Number,
      default: 0,
    },
    prefix: {
      type: String,
      default: "",
    },
    suffix: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 3000,
    },
  },
};
</script>
