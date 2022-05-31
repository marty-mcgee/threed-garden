<template>
  <div class="mt-4 card">
    <div class="p-3 card-body">
      <div class="row">
        <div class="col-4">
          <img
            :src="typeof image === 'string' ? image : image.url"
            :alt="image.alt"
            class="shadow border-radius-lg w-100"
          />
        </div>
        <div class="my-auto col-8">
          <p class="text-sm text-muted font-weight-bold">
            {{ message }}
          </p>
          <a
            :href="action.route"
            class="mb-0 btn btn-sm"
            :class="`bg-gradient-${action.color}`"
          >
            {{ action.label }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MessageCard",
  props: {
    image: {
      type: [String, Object],
      default: "",
      url: {
        type: String,
      },
      alt: String,
    },
    message: {
      type: String,
      required: true,
    },
    action: {
      type: Object,
      default: () => {},
      color: {
        type: String,
        default: "dark",
      },
      route: String,
      label: String,
    },
  },
};
</script>
