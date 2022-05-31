<template>
  <div class="mt-8 row">
    <div class="mx-auto text-center col-md-6">
      <h2>{{ title }}</h2>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-html="description"></p>
    </div>
  </div>
  <div class="row">
    <div class="mx-auto col-md-10">
      <div id="accordionRental" class="accordion">
        <slot />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "Accordion",
  props: {
    title: {
      type: String,
      default: "Frequently Asked Questions",
    },
    description: {
      type: String,
      default: "",
    },
  },
};
</script>
