<template>
  <div class="mt-4 card">
    <div class="p-3 pb-0 card-header">
      <h6 class="mb-0">{{ title }}</h6>
    </div>
    <div class="p-3 card-body">
      <ul class="list-group" :class="isRTL ? 'pe-0' : ''">
        <li
          v-for="(
            { icon: { component, background }, title: itemTitle, description },
            index
          ) of items"
          :key="index"
          class="mb-2 border-0 list-group-item d-flex justify-content-between border-radius-lg"
          :class="isRTL ? 'pe-0' : 'ps-0'"
        >
          <div class="d-flex align-items-center">
            <div
              class="text-center shadow icon icon-shape icon-sm"
              :class="[isRTL ? 'ms-3' : 'me-3', `bg-gradient-${background}`]"
            >
              <font-awesome-icon
                class="mt-2 fa-sm"
                :icon="component"
                :style="{ color: 'white' }"
              />
            </div>
            <div class="d-flex flex-column">
              <h6 class="mb-1 text-sm text-dark">{{ itemTitle }}</h6>
              <!-- eslint-disable vue/no-v-html -->
              <span class="text-xs" v-html="description" />
            </div>
          </div>
          <div class="d-flex">
            <button
              class="my-auto btn btn-link btn-icon-only btn-rounded btn-sm text-dark icon-move-right"
            >
              <i
                class="ni"
                :class="isRTL ? 'ni-bold-left' : 'ni-bold-right'"
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "CategoriesCard",
  components: {
    FontAwesomeIcon,
  },
  props: {
    title: {
      type: String,
      default: "Categories",
    },
    items: {
      type: Array,
      default: () => {},
      icon: {
        component: String,
        background: String,
      },
      title: String,
      description: String,
    },
  },
  computed: {
    ...mapState(["isRTL"]),
  },
};
</script>
