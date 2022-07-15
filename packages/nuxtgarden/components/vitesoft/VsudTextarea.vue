<template>
  <div class="form-group">
    <label :for="id">
      <slot />
    </label>
    <textarea :id="id" class="form-control" rows="5" :placeholder="placeholder"></textarea>
  </div>
</template>

<script>
export default {
  name: "VsudTextarea",
  props: {
    id: { type: String, default: "" },
    placeholder: { type: String, default: "" },
  },
};
</script>