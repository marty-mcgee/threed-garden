<template>
  <div class="card">
    <div class="p-3 card-body">
      <div class="d-flex">
        <div class="p-2 avatar avatar-xl bg-gradient-dark border-radius-md">
          <img :src="logo" :alt="title" />
        </div>
        <div class="my-auto ms-3">
          <h6>{{ title }}</h6>
          <div class="avatar-group">
            <a
              v-if="img1"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title="Jessica Rowland"
            >
              <img alt="Image placeholder" :src="img1" class="" />
            </a>
            <a
              v-if="img2"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title=""
            >
              <img alt="Image placeholder" :src="img2" class="rounded-circle" />
            </a>
            <a
              v-if="img3"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title=""
            >
              <img alt="Image placeholder" :src="img3" class="rounded-circle" />
            </a>
            <a
              v-if="img4"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title=""
            >
              <img alt="Image placeholder" :src="img4" class="" />
            </a>
            <a
              v-if="img5"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title=""
            >
              <img alt="Image placeholder" :src="img5" class="rounded-circle" />
            </a>
            <a
              v-if="img6"
              href="#"
              class="avatar avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-original-title=""
            >
              <img alt="Image placeholder" :src="img6" class="rounded-circle" />
            </a>
          </div>
        </div>
        <div class="ms-auto">
          <div class="dropdown">
            <button
              class="btn btn-link text-secondary ps-0 pe-2"
              :class="{ show: showMenu }"
              id="navbarDropdownMenuLink"
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
              <a class="dropdown-item" href="javascript:;">Action</a>
              <a class="dropdown-item" href="javascript:;">Another action</a>
              <a class="dropdown-item" href="javascript:;"
                >Something else here</a
              >
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
          <h6 class="mb-0 text-sm">{{ numberOfParticipants }}</h6>
          <p class="mb-0 text-sm text-secondary font-weight-bold">
            Participants
          </p>
        </div>
        <div class="col-6 text-end">
          <h6 class="mb-0 text-sm">{{ date }}</h6>
          <p class="mb-0 text-sm text-secondary font-weight-bold">Due date</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "project-card",
  data() {
    return {
      showMenu: false,
    };
  },
  props: {
    logo: String,
    title: String,
    description: String,
    numberOfParticipants: String,
    date: String,
    img1: String,
    img2: String,
    img3: String,
    img4: String,
    img5: String,
    img6: String,
  },
};
</script>
