<template>
  <div
    v-tilt="{ speed: 300, perspective: 1000 }"
    class="card card-background h-100 tilt"
    :class="`card-background-mask-${color}`"
    data-tilt=""
  >
    <div
      class="full-background"
      style="
        background-image: url('../../../assets/img/curved-images/white-curved.jpeg');
      "
    ></div>
    <div class="pt-4 text-center card-body">
      <h2 class="mt-2 mb-0 text-white up">{{ title }}</h2>
      <h1 class="mb-0 text-white up">{{ count }}</h1>
      <span
        class="mb-2 badge badge-lg d-block bg-gradient-dark up"
        :class="`bg-gradient-${percentage.color}`"
      >
        {{ percentage.label }}
      </span>
      <a :href="action.route" class="px-5 mb-2 btn btn-outline-white up">
        {{ action.label }}</a
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "AnimatedStatisticsCard",
  props: {
    color: {
      type: String,
      default: "success",
    },
    title: {
      type: String,
      default: "Animated Statistics Card",
    },
    count: {
      type: [Number, String],
      default: "",
    },
    percentage: {
      type: Object,
      color: String,
      label: String,
      default: () => {},
    },
    action: {
      type: Object,
      route: String,
      label: String,
      default: () => {},
    },
  },
};
</script>
