<template>
  <div class="card">
    <div class="p-3 card-body">
      <div class="d-flex">
        <div class="p-2 avatar avatar-xl bg-gradient-dark border-radius-md">
          <img :src="image" :alt="title" />
        </div>
        <div class="my-auto ms-3">
          <h6>{{ title }}</h6>
          <div class="avatar-group">
            <a
              v-for="(member, index) of members"
              :key="index"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title=""
            >
              <img alt="Image placeholder" :src="member" />
            </a>
          </div>
        </div>
        <div class="ms-auto">
          <div class="dropdown">
            <button
              id="navbarDropdownMenuLink"
              class="btn btn-link text-secondary ps-0 pe-2"
              :class="{ show: showMenu }"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              @click="showMenu = !showMenu"
            >
              <i class="text-lg fa fa-ellipsis-v"></i>
            </button>
            <div
              class="dropdown-menu dropdown-menu-end me-sm-n4 me-n3"
              :class="{ show: showMenu }"
              aria-labelledby="navbarDropdownMenuLink"
            >
              <a
                v-for="(drop, index) in dropdown"
                :key="index"
                class="dropdown-item border-radius-md"
                :href="drop.route"
                >{{ drop.label }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <p class="mt-3 text-sm">
        {{ description }}
      </p>
      <hr class="horizontal dark" />
      <div class="row">
        <div class="col-6">
          <h6 class="mb-0 text-sm">{{ members.length }}</h6>
          <p class="mb-0 text-sm text-secondary font-weight-bold">
            Participants
          </p>
        </div>
        <div class="col-6 text-end">
          <h6 class="mb-0 text-sm">{{ dateTime }}</h6>
          <p class="mb-0 text-sm text-secondary font-weight-bold">Due date</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ComplexProjectCard",
  props: {
    image: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    dateTime: {
      type: String,
      default: "",
    },
    members: {
      type: Array,
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
