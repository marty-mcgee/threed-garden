<template>
  <div class="col-12 col-md-10">
    <div class="card" :class="$attrs.class">
      <div class="p-3 pb-0 card-header">
        <div class="d-flex justify-content-between">
          <h6 class="mb-2">{{ title }}</h6>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table align-items-center">
          <tbody>
            <tr
              v-for="({ country, sales, value, bounce }, index) of rows"
              :key="index"
            >
              <td class="w-30">
                <div class="px-2 py-1 d-flex align-items-center">
                  <div>
                    <img :src="country[0]" alt="Country flag" />
                  </div>
                  <div class="ms-4">
                    <p class="mb-0 text-xs font-weight-bold">Country:</p>
                    <h6 class="mb-0 text-sm">{{ country[1] }}</h6>
                  </div>
                </div>
              </td>
              <td>
                <div class="text-center">
                  <p class="mb-0 text-xs font-weight-bold">Sales:</p>
                  <h6 class="mb-0 text-sm">{{ sales }}</h6>
                </div>
              </td>
              <td>
                <div class="text-center">
                  <p class="mb-0 text-xs font-weight-bold">Value:</p>
                  <h6 class="mb-0 text-sm">{{ value }}</h6>
                </div>
              </td>
              <td class="text-sm align-middle">
                <div class="text-center col">
                  <p class="mb-0 text-xs font-weight-bold">Bounce:</p>
                  <h6 class="mb-0 text-sm">{{ bounce }}</h6>
                </div>
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
  name: "SalesTable",
  props: {
    title: {
      type: String,
      default: "",
    },
    rows: {
      type: Array,
      required: true,
      sales: [Number, String],
      value: String,
      bounce: String,
      country: {
        type: Array,
      },
    },
  },
};
</script>
