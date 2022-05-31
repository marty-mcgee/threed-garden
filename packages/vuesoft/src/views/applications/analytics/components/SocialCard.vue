<template>
  <div class="card h-100">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <h6 class="mb-0">{{ title }}</h6>
        <button
          type="button"
          class="mb-0 btn btn-icon-only btn-rounded btn-outline-secondary ms-2 btn-sm d-flex align-items-center justify-content-center ms-auto"
          data-bs-toggle="tooltip"
          data-bs-placement="bottom"
          :title="tooltip"
        >
          <i class="fas fa-info"></i>
        </button>
      </div>
    </div>
    <div class="p-3 card-body">
      <ul class="list-group">
        <li
          v-for="({ label, icon, progress }, index) of items"
          :key="index"
          class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
        >
          <div class="w-100">
            <div class="mb-2 d-flex align-items-center">
              <a
                class="p-0 mb-0 btn btn-simple"
                :class="`btn-${icon}`"
                href="javascript:;"
              >
                <i class="fab fa-lg" :class="`fa-${icon}`"></i>
              </a>
              <span
                class="text-sm me-2 font-weight-bold text-capitalize ms-2"
                >{{ label }}</span
              >
              <span class="text-sm ms-auto font-weight-bold"
                >{{ progress }}%</span
              >
            </div>
            <div>
              <div class="progress progress-md">
                <div
                  class="progress-bar bg-gradient-dark"
                  :class="`w-${progress}`"
                  role="progressbar"
                  :aria-valuenow="progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "SocialCard",
  props: {
    title: {
      type: String,
      default: "Social",
    },
    tooltip: {
      type: String,
      default: "See how much traffic do you get from social media",
    },
    items: {
      type: Array,
      default: () => [],
      label: String,
      icon: String,
      progress: Number,
    },
  },
};
</script>
