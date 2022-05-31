<template>
  <div class="card">
    <div class="text-center card-body">
      <h1 class="text-gradient" :class="`text-${color}`">
        <span class="text-lg ms-n2">{{ prefix }}</span>
        {{ "" }}
        <countTo :start-val="0" :end-val="count" :duration="6000"></countTo>
        {{ "" }}
        <span class="text-lg ms-n2">{{ suffix }}</span>
      </h1>
      <h6 class="mb-0 font-weight-bolder">{{ title }}</h6>
      <p class="mb-0 text-sm opacity-8">{{ description }}</p>
    </div>
  </div>
</template>

<script>
import countTo from "vue-count-to/src";

export default {
  name: "DefaultCounterCard",
  components: {
    countTo,
  },
  props: {
    count: {
      type: [String, Number],
      required: true,
    },
    prefix: {
      type: String,
      default: "",
    },
    suffix: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "success",
    },
  },
};
</script>
