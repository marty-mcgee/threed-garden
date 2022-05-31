<template>
  <div class="mt-4 col-sm-4 mt-sm-0">
    <div class="card">
      <div class="p-3 card-body position-relative">
        <div class="row">
          <div class="col-7 text-start">
            <p class="mb-1 text-sm text-capitalize font-weight-bold">
              {{ title }}
            </p>
            <h5 class="mb-0 font-weight-bolder">{{ count }}</h5>
            <span
              :class="`text-${percentage.color}`"
              class="mt-auto mb-0 text-sm text-end font-weight-bolder"
              >{{ percentage.value }}
              <span class="font-weight-normal text-secondary">
                {{ percentage.label }}</span
              >
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
                <span class="text-xs text-secondary">{{ menu }}</span>
              </a>
              <ul
                class="px-2 py-3 dropdown-menu dropdown-menu-end"
                :class="{ show: showMenu }"
                aria-labelledby="dropdownUsers1"
              >
                <li v-for="(drop, index) in dropdown" :key="index">
                  <a
                    class="dropdown-item border-radius-md"
                    :href="drop.route"
                    >{{ drop.label }}</a
                  >
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
  name: "DefaultStatisticsCard",
  props: {
    title: {
      type: String,
      default: "Default Statistics Card",
    },
    count: {
      type: String,
      default: "",
    },
    menu: {
      type: String,
      default: "",
    },
    percentage: {
      type: Object,
      default: () => {},
      color: String,
      value: String,
      label: String,
    },
    dropdown: {
      type: Array,
      default: () => [],
      label: String,
      route: String,
    },
  },
  data() {
    return {
      showMenu: false,
    };
  },
};
</script>
