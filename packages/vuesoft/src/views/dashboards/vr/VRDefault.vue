<template>
  <!-- Navbar -->
  <div>
    <navbar
      :min-nav="navbarMinimize"
      :toggle="toggleConfigurator"
      :class="isNavFixed ? navbarFixed : ''"
    />
  </div>
  <!-- End Navbar -->
  <div
    class="mx-3 mt-3 border-radius-xl position-relative"
    :style="{
      backgroundImage: 'url(' + require('../../../assets/img/vr-bg.jpg') + ')',
      backgroundSize: 'cover',
    }"
  >
    <sidenav
      :custom_class="mcolor"
      :class="isTransparent"
      class="fixed-start"
    />

    <main class="mt-1 main-content border-radius-lg">
      <div
        class="section min-vh-85 position-relative transform-scale-0 transform-scale-md-6"
      >
        <div class="container ms-n0 ms-md-n5">
          <div class="row">
            <div class="mb-4 col-lg-7 mb-lg-0 position-relative z-index-2">
              <div class="mb-4 card card-plain">
                <div class="p-3 card-body">
                  <div class="row">
                    <div class="col-lg-6">
                      <div class="d-flex flex-column h-100">
                        <h2
                          class="font-weight-bolder mb-0mt-4 fadeIn1 fadeInBottom"
                        >
                          General Statistics
                        </h2>
                        <div class="d-flex align-items-center">
                          <h6
                            class="mb-0 font-weight-bolder fadeIn4 fadeInBottom"
                          >
                            All users
                          </h6>
                          <a
                            class="mt-1 mb-0 text-sm text-success font-weight-bold icon-move-right ms-4 fadeIn4 fadeInBottom"
                            href="javascript:;"
                          >
                            Read More
                            <i
                              class="text-sm fas fa-arrow-right ms-1"
                              aria-hidden="true"
                            ></i>
                          </a>
                        </div>
                        <h1
                          class="mb-0 font-weight-bolder fadeIn4 fadeInBottom"
                        >
                          1,600,000
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-lg-4 col-md-6 col-12">
                  <mini-statistics-card
                    class="fadeIn1 fadeInBottom"
                    title="Today's Money"
                    value="$53,000"
                    :percentage="{
                      value: '+55%',
                      color: 'text-success',
                    }"
                    :icon="{
                      component: 'ni ni-money-coins',
                      background: 'bg-gradient-success',
                    }"
                    direction-reverse
                  />
                  <mini-statistics-card
                    class="fadeIn2 fadeInBottom"
                    title="Today's Users"
                    value="2,300"
                    :percentage="{
                      value: '+3%',
                      color: 'text-success',
                    }"
                    :icon="{
                      component: 'ni ni-world',
                      background: 'bg-gradient-success',
                    }"
                    direction-reverse
                  />
                </div>
                <div class="mt-4 col-lg-4 col-md-6 col-12 mt-md-0">
                  <mini-statistics-card
                    class="fadeIn3 fadeInBottom"
                    title="New Clients"
                    value="+3,462"
                    :percentage="{
                      value: '-2%',
                      color: 'text-danger',
                    }"
                    :icon="{
                      component: 'ni ni-paper-diploma',
                      background: 'bg-gradient-success',
                    }"
                    direction-reverse
                  />
                  <mini-statistics-card
                    class="fadeIn4 fadeInBottom"
                    title="Sales"
                    value="$103,430"
                    :percentage="{
                      value: '+5%',
                      color: 'text-success',
                    }"
                    :icon="{
                      component: 'ni ni-cart',
                      background: 'bg-gradient-success',
                    }"
                    direction-reverse
                  />
                </div>
              </div>
              <div class="row">
                <sales-table
                  title="Sales by Country"
                  :rows="[
                    {
                      country: [US, 'United States'],
                      sales: 2500,
                      value: '$230,900',
                      bounce: '29.9%',
                    },
                    {
                      country: [DE, 'Germany'],
                      sales: '3.900',
                      value: '$440,000',
                      bounce: '40.22%',
                    },
                    {
                      country: [GB, 'Great Britain'],
                      sales: '1.400',
                      value: '$190,700',
                      bounce: '23.44%',
                    },
                    {
                      country: [BR, 'Brasil'],
                      sales: 562,
                      value: '$143,960',
                      bounce: '32.14%',
                    },
                  ]"
                />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12">
              <globe
                class="mt-3 me-n8 me-lg-10 fadeIn4 fadeInBottom d-none d-md-block"
                width="1000"
                height="1000"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  <app-footer class="py-3 bg-white border-radius-lg" />
</template>

<script>
import Sidenav from "@/examples/Sidenav";
import AppFooter from "@/examples/Footer.vue";
import Navbar from "@/examples/Navbars/Navbar.vue";
import MiniStatisticsCard from "@/examples/Cards/MiniStatisticsCard.vue";
import SalesTable from "../components/SalesTable.vue";
import US from "@/assets/img/icons/flags/US.png";
import DE from "@/assets/img/icons/flags/DE.png";
import GB from "@/assets/img/icons/flags/GB.png";
import BR from "@/assets/img/icons/flags/BR.png";

import Globe from "@/examples/Globe.vue";
const body = document.getElementsByTagName("body")[0];

import { mapMutations, mapState } from "vuex";
export default {
  name: "VrDefault",
  components: {
    AppFooter,
    Sidenav,
    Navbar,
    MiniStatisticsCard,
    SalesTable,
    Globe,
  },
  data() {
    return {
      US,
      DE,
      GB,
      BR,
    };
  },

  computed: {
    ...mapState(["isTransparent", "isNavFixed", "navbarFixed", "mcolor"]),
  },
  beforeMount() {
    this.toggleEveryDisplay();
    body.classList.add("virtual-reality");
    this.sidebarType("bg-white");
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    body.classList.remove("virtual-reality");

    if (this.$store.state.isPinned === false) {
      const sidenav_show = document.querySelector(".g-sidenav-show");
      sidenav_show.classList.remove("g-sidenav-hidden");
      sidenav_show.classList.add("g-sidenav-pinned");
      this.$store.state.isPinned = true;
    }
    this.sidebarType("bg-transparent");
  },
  methods: {
    ...mapMutations([
      "navbarMinimize",
      "toggleConfigurator",
      "toggleEveryDisplay",
      "sidebarType",
    ]),
  },
};
</script>
