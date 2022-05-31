<template>
  <div class="mt-4 mb-3 card mt-lg-0">
    <div class="pb-0 card-body">
      <div class="mb-3 row align-items-center">
        <div class="col-9">
          <h5 class="mb-1 text-gradient text-success">
            <a href="javascript:;">{{ title }}</a>
          </h5>
        </div>
        <div class="col-3 text-end">
          <div class="dropstart">
            <a
              id="teamId"
              href="javascript:;"
              class="text-secondary"
              :class="{ show: showMenu }"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click="showMenu = !showMenu"
            >
              <i class="fas fa-ellipsis-v"></i>
            </a>
            <ul
              class="px-2 py-3 dropdown-menu dropdown-menu-lg-start"
              :class="{ show: showMenu }"
              aria-labelledby="dropdownMarketingCard"
            >
              <li v-for="(menuItem, index) in dropdown" :key="index">
                <a class="dropdown-item border-radius-md" :href="menuItem.route"
                  >{{ menuItem.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p>
        {{ description }}
      </p>
      <ul class="mx-auto list-unstyled">
        <li class="d-flex">
          <p class="mb-0">Industry:</p>
          <span class="badge badge-secondary ms-auto">{{ industry }}</span>
        </li>
        <li>
          <hr class="horizontal dark" />
        </li>
        <li class="d-flex">
          <p class="mb-0">Rating:</p>
          <div class="rating ms-auto">
            <star-rating
              :increment="0.5"
              :max-rating="5"
              active-color="#67748e"
              :star-size="15"
              :rating="rating"
              read-only
              :show-rating="false"
            >
            </star-rating>
          </div>
        </li>
        <li>
          <hr class="horizontal dark" />
        </li>
        <li class="d-flex">
          <p class="mb-0">Members:</p>
          <div class="avatar-group ms-auto">
            <a
              v-for="({ image, name }, index) of members"
              :key="index"
              href="javascript:;"
              class="avatar avatar-lg avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              :title="name"
            >
              <img alt="Image placeholder" :src="image" />
            </a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import starRating from "vue-star-rating";
export default {
  name: "TeamProfileCard",
  components: {
    starRating,
  },
  props: {
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
    },
    members: {
      type: Array,
      image: String,
      name: String,
      default: () => [],
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
