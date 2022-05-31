<template>
  <div class="mt-4 card h-100 mt-md-0">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <h6>Pages</h6>
        <button
          type="button"
          class="mb-0 btn btn-icon-only btn-rounded btn-outline-success ms-2 btn-sm d-flex align-items-center justify-content-center ms-auto"
          data-bs-toggle="tooltip"
          data-bs-placement="bottom"
          title="Data is based from sessions and is 100% accurate"
        >
          <i class="fas fa-check"></i>
        </button>
      </div>
    </div>
    <div class="px-3 pt-0 pb-2 card-body">
      <div class="p-0 table-responsive">
        <table class="table mb-0 align-items-center justify-content-center">
          <thead>
            <tr>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Page
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Page Views
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Avg. Time
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Bounce Rate
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="({ url, views, time, rate }, index) of pages"
              :key="index"
            >
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  {{ index + 1 }}. {{ url }}
                </p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">{{ views }}</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">{{ time }}</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">{{ rate }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PagesCard",
  props: {
    pages: {
      type: Array,
      default: () => [],
      url: String,
      views: [Number, String],
      time: String,
      rate: String,
    },
  },
};
</script>
