<template>
  <div class="card">
    <div class="p-3 pb-0 card-header">
      <div class="row">
        <div class="col-8 d-flex">
          <div>
            <img
              :src="by.image"
              class="avatar avatar-sm me-2"
              alt="avatar image"
            />
          </div>
          <div class="d-flex flex-column justify-content-center">
            <h6 class="mb-0 text-sm">{{ by.name }}</h6>
            <p class="text-xs">{{ by.date }}</p>
          </div>
        </div>
        <div class="col-4">
          <span
            class="badge ms-auto float-end"
            :class="`bg-gradient-${badge.color}`"
            >{{ badge.label }}</span
          >
        </div>
      </div>
    </div>
    <div class="p-3 pt-1 card-body">
      <h6>{{ title }}</h6>
      <p class="text-sm">
        {{ description }}
      </p>
      <div class="p-3 bg-gray-100 d-flex border-radius-lg">
        <h4 class="my-auto">
          <span class="text-sm text-secondary me-1">{{ value.currency }}</span
          >{{ value.amount }}
          <span class="text-sm text-secondary ms-1">/ {{ value.method }} </span>
        </h4>
        <a :href="action.route" class="mb-0 btn btn-outline-dark ms-auto">
          {{ action.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AnnouncementCard",
  props: {
    by: {
      type: Object,
      default: () => {},
      image: String,
      name: String,
      date: String,
    },
    badge: {
      type: Object,
      default: () => {},
      color: String,
      label: String,
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    value: {
      type: Object,
      currency: String,
      amount: String,
      method: String,
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
