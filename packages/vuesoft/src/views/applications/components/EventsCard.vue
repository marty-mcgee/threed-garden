<template>
  <div class="card">
    <div class="p-3 pb-0 card-header">
      <h6 class="mb-0">Next events</h6>
    </div>
    <div class="p-3 card-body border-radius-lg">
      <div
        v-for="({ icon, color, event, date }, index) of events"
        :key="index"
        class="d-flex"
        :class="index !== 0 ? 'mt-4' : ''"
      >
        <div>
          <div
            class="text-center shadow shadow-none icon icon-shape border-radius-md"
            :class="`bg-${color}-soft`"
          >
            <i
              class="text-lg text-gradient opacity-10"
              :class="`ni ni-${icon} text-${color}`"
              aria-hidden="true"
            ></i>
          </div>
        </div>
        <div class="ms-3">
          <div class="numbers">
            <h6 class="mb-1 text-sm text-dark">{{ event }}</h6>
            <span class="text-sm">{{ date }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EventsCard",
  props: {
    events: {
      type: Array,
      default: () => [],
      icon: String,
      color: String,
      event: String,
      date: String,
    },
  },
};
</script>
