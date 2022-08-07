<template>
  <div class="text-center col-lg-1 col-md-2 col-sm-3 col-4">
    <a
      href="javascript:;"
      class="border avatar avatar-lg rounded-circle border-primary"
    >
      <img alt="Image placeholder" class="p-1" :src="img" />
    </a>
    <p class="mb-0 text-sm">{{ name }}</p>
  </div>
</template>

<script>
export default {
  name: "story-avatar",
  props: {
    img: String,
    name: String,
  },
};
</script>
