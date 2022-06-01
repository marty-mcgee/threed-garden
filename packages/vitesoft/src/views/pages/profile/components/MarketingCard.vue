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
              id="dropdownMarketingCard"
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
              <li>
                <a class="dropdown-item border-radius-md" href="javascript:;">Edit Team</a>
              </li>
              <li>
                <a class="dropdown-item border-radius-md" href="javascript:;">Add Member</a>
              </li>
              <li>
                <a class="dropdown-item border-radius-md" href="javascript:;">See Details</a>
              </li>
              <li>
                <hr class="dropdown-divider" />
              </li>
              <li>
                <a
                  class="dropdown-item border-radius-md text-danger"
                  href="javascript:;"
                >Remove Team</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p>{{ description }}</p>
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
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <slot />
          </div>
        </li>
        <li>
          <hr class="horizontal dark" />
        </li>
        <li class="d-flex">
          <p class="mb-0">Members:</p>
          <div class="avatar-group ms-auto">
            <a
              href="javascript:;"
              class="avatar avatar-lg avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              :title="img1Title"
            >
              <img alt="Image placeholder" :src="img1" />
            </a>
            <a
              href="javascript:;"
              class="avatar avatar-lg avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              :title="img2Title"
            >
              <img alt="Image placeholder" :src="img2" />
            </a>
            <a
              href="javascript:;"
              class="avatar avatar-lg avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              :title="img3Title"
            >
              <img alt="Image placeholder" :src="img3" />
            </a>
            <a
              href="javascript:;"
              class="avatar avatar-lg avatar-xs rounded-circle"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              :title="img4Title"
            >
              <img alt="Image placeholder" :src="img4" />
            </a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "MarketingCard",
  props: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    industry: { type: String, default: "" },
    img1: { type: String, default: "" },
    img2: { type: String, default: "" },
    img3: { type: String, default: "" },
    img4: { type: String, default: "" },
    img1Title: { type: String, default: "" },
    img2Title: { type: String, default: "" },
    img3Title: { type: String, default: "" },
    img4Title: { type: String, default: "" },
  },
  data() {
    return {
      showMenu: false,
    };
  },
};
</script>
