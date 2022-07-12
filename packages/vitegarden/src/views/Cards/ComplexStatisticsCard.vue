<template>
  <div
class="card" :style="{
    backgroundImage:
      `url(${bgImg})`,
  }">
    <span class="mask bg-gradient-dark opacity-9 border-radius-xl"></span>
    <div class="card-body p-3 position-relative">
      <div class="row">
        <div class="col-8 text-start">
          <div class="icon icon-shape bg-white shadow text-center border-radius-md" :class="iconBg">
            <i
              class="text-dark text-gradient text-lg opacity-10"
              :class="classIcon"
              aria-hidden="true"
            ></i>
          </div>
          <h5 class="text-white font-weight-bolder mb-0 mt-3">{{ caption }}</h5>
          <span class="text-white text-sm">{{ activeUsers }}</span>
        </div>
        <div class="col-4">
          <div class="dropdown text-end mb-6">
            <a
              id="dropdownUsers1"
              href="javascript:;"
              class="cursor-pointer"
              :class="{ show: showMenu }"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click="showMenu = !showMenu"
            >
              <i class="fa fa-ellipsis-h text-white" aria-hidden="true"></i>
            </a>
            <ul
              class="dropdown-menu px-2 py-3"
              aria-labelledby="dropdownUsers1"
              :class="{ show: showMenu }"
            >
              <li>
                <a class="dropdown-item border-radius-md" href="javascript:;">Action</a>
              </li>
              <li>
                <a class="dropdown-item border-radius-md" href="javascript:;">Another action</a>
              </li>
              <li>
                <a class="dropdown-item border-radius-md" href="javascript:;">Something else here</a>
              </li>
            </ul>
          </div>
          <p
            class="text-white text-sm text-end font-weight-bolder mt-auto mb-0"
            :class="classPercentage"
          >{{ percentage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bgImg from '@/assets/img/curved-images/white-curved.jpeg'
export default {
  name: "ComplexStatisticsCard",
  props: {
    classIcon: {
      type: String,
      required: true,
    },
    activeUsers: { type: String, default: "" },
    percentage: { type: String, default: "" },
    classPercentage: {
      type: String,
      default: "text-success",
    },
    iconBg: {
      type: String,
      default: "bg-white",
    },
    caption: { type: String, default: "" },
  },
  data() {
    return {
      bgImg,
      showMenu: false,
    };
  },
};
</script>
