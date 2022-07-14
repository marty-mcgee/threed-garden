<template>
  <div class="card">
    <div class="card-header p-3 pb-0">
      <h6 class="mb-0">{{ title }}</h6>
      <p class="text-sm mb-0 text-capitalize font-weight-bold">
        {{ subTitle }}
      </p>
    </div>
    <div class="card-body border-radius-lg p-3">
      <div class="d-flex">
        <div>
          <div
            class="icon icon-shape bg-info-soft shadow text-center border-radius-md shadow-none"
          >
            <i
              class="ni ni-money-coins text-lg text-info text-gradient opacity-10"
              aria-hidden="true"
            ></i>
          </div>
        </div>
        <div :class="$store.state.isRTL ? 'me-3' : 'ms-3'">
          <div class="numbers">
            <h6 class="mb-1 text-dark text-sm">{{ eventTitle }}</h6>
            <span class="text-sm">{{ eventDate }}</span>
          </div>
        </div>
      </div>
      <div class="d-flex mt-4">
        <div>
          <div
            class="icon icon-shape bg-success-soft shadow text-center border-radius-md shadow-none"
          >
            <i
              class="ni ni-bell-55 text-lg text-success text-gradient opacity-10"
              aria-hidden="true"
            ></i>
          </div>
        </div>
        <div :class="$store.state.isRTL ? 'me-3' : 'ms-3'">
          <div class="numbers">
            <h6 class="mb-1 text-dark text-sm">{{ eventTitle2 }}</h6>
            <span class="text-sm">{{ eventDate2 }}</span>
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
    title: {
      type: String,
      default: "Upcoming events",
    },
    subTitle: {
      type: String,
      default: "Joined",
    },
    eventTitle: {
      type: String,
      default: "Cyber Week",
    },
    eventDate: {
      type: String,
      default: "27 March 2020, at 12:30 PM",
    },
    eventTitle2: {
      type: String,
      default: "Meeting with Marry",
    },
    eventDate2: {
      type: String,
      default: "24 March 2020, at 10:00 PM",
    },
  },
};
</script>
