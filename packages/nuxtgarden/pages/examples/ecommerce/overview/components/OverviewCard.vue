<template>
  <div class="mt-4 col-sm-4 mt-sm-0">
    <div class="card">
      <div class="p-3 card-body position-relative">
        <div class="row">
          <div class="col-7 text-start">
            <p class="mb-1 text-sm text-capitalize font-weight-bold">{{ overviews.title }}</p>
            <h5 class="mb-0 font-weight-bolder">{{ overviews.value }}</h5>
            <span
              :class="
                overviews.textColor ? overviews.textcolor : 'text-success'
              "
              class="mt-auto mb-0 text-sm text-end font-weight-bolder"
            >
              {{ overviews.percent }}
              <span
                class="font-weight-normal text-secondary"
              >since last month</span>
            </span>
          </div>
          <div class="col-5">
            <div class="dropdown text-end">
              <a
                id="dropdownUsers1"
                href="javascript:;"
                class="cursor-pointer text-secondary"
                :class="{ show: showMenu }"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                @click="showMenu = !showMenu"
              >
                <span class="text-xs text-secondary">6 May - 7 May</span>
              </a>
              <ul
                class="px-2 py-3 dropdown-menu dropdown-menu-end"
                :class="{ show: showMenu }"
                aria-labelledby="dropdownUsers1"
              >
                <li>
                  <a class="dropdown-item border-radius-md" href="javascript:;">Last 7 days</a>
                </li>
                <li>
                  <a class="dropdown-item border-radius-md" href="javascript:;">Last week</a>
                </li>
                <li>
                  <a class="dropdown-item border-radius-md" href="javascript:;">Last 30 days</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "OverviewCard",
  props: {
    overviews: {
      type: Object,
      default: () => {
        return {
          title: "Default Title",
          value: "$230,220",
          percent: "+55%",
        }
      },
    }
  },
  data() {
    return {
      showMenu: false,
    };
  },
};
</script>
