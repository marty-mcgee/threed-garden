<template>
  <!-- Navbar -->
  <div>
    <navbar
      :min-nav="navbarMinimize"
      :toggle="toggleConfigurator"
      :class="
        $store.state.isNavFixed ? $store.state.navbarFixed_class : ''
      "
    />
  </div>
  <!-- End Navbar -->
  <div
    class="mx-3 mt-3 border-radius-xl position-relative"
    :style="{
      backgroundImage: `url(${bgImg})`,
      backgroundSize: 'cover',
    }"
  >
    <sidenav :custom_class="cardBackgroundMaskColor" :class="isTransparent" class="fixed-start" />

    <main class="mt-1 main-content border-radius-lg">
      <div class="section min-vh-85 position-relative transform-scale-0 transform-scale-md-6">
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
                        >General Statistics</h2>
                        <div class="d-flex align-items-center">
                          <h6 class="mb-0 font-weight-bolder fadeIn4 fadeInBottom">All users</h6>
                          <a
                            class="mt-1 mb-0 text-sm text-primary font-weight-bold icon-move-right ms-4 fadeIn4 fadeInBottom"
                            href="javascript:;"
                          >
                            Read More
                            <i class="text-sm fas fa-arrow-right ms-1" aria-hidden="true"></i>
                          </a>
                        </div>
                        <h1 class="mb-0 font-weight-bolder fadeIn4 fadeInBottom">1,600,000</h1>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-lg-4 col-md-6 col-12">
                  <card
                    class="fadeIn1 fadeInBottom"
                    title="Today's Money"
                    value="$53,000"
                    percentage="+55%"
                    icon-class="ni ni-money-coins"
                    content-class="ms-0"
                    icon-background="bg-gradient-primary"
                    direction-reverse
                  />

                  <card
                    class="fadeIn2 fadeInBottom"
                    title="Today's Users"
                    value="2,300"
                    percentage="+3%"
                    icon-class="ni ni-world"
                    content-class="ms-0"
                    icon-background="bg-gradient-primary"
                    direction-reverse
                  />
                </div>
                <div class="mt-4 col-lg-4 col-md-6 col-12 mt-md-0">
                  <card
                    class="fadeIn3 fadeInBottom"
                    title="New Clients"
                    value="+3,462"
                    percentage="-2%"
                    icon-class="ni ni-paper-diploma"
                    content-class="ms-0"
                    percentage-color="text-danger"
                    icon-background="bg-gradient-primary"
                    direction-reverse
                  />

                  <card
                    class="fadeIn4 fadeInBottom"
                    title="Sales"
                    value="$103,430"
                    percentage="+5%"
                    icon-class="ni ni-cart"
                    content-class="ms-0"
                    icon-background="bg-gradient-primary"
                    direction-reverse
                  />
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <div class="card fadeIn3 fadeInBottom">
                    <div class="p-3 pb-0 card-header">
                      <div class="d-flex justify-content-between">
                        <h6 class="mb-2">Sales by Country</h6>
                      </div>
                    </div>
                    <div class="table-responsive">
                      <table class="table align-items-center">
                        <tbody>
                          <tr v-for="(sale, index) in sales" :key="index">
                            <td class="w-30">
                              <div class="px-2 py-1 d-flex align-items-center">
                                <div>
                                  <img :src="sale.flag" alt="Country flag" />
                                </div>
                                <div class="ms-4">
                                  <p class="mb-0 text-xs font-weight-bold">Country:</p>
                                  <h6 class="mb-0 text-sm">{{ sale.country }}</h6>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div class="text-center">
                                <p class="mb-0 text-xs font-weight-bold">Sales:</p>
                                <h6 class="mb-0 text-sm">{{ sale.sales }}</h6>
                              </div>
                            </td>
                            <td>
                              <div class="text-center">
                                <p class="mb-0 text-xs font-weight-bold">Value:</p>
                                <h6 class="mb-0 text-sm">{{ sale.value }}</h6>
                              </div>
                            </td>
                            <td class="text-sm align-middle">
                              <div class="text-center col">
                                <p class="mb-0 text-xs font-weight-bold">Bounce:</p>
                                <h6 class="mb-0 text-sm">{{ sale.bounce }}</h6>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
import { mapGetters } from "vuex";
import Sidenav from "@/components/sections/Sidenav/index.vue";
import AppFooter from "@/components/sections/Footer.vue";
import Navbar from "@/components/sections/Navbars/Navbar.vue";
import Card from "@/components/sections/Cards/Card.vue";

import bgImg from '@/assets/img/vr-bg.jpg';
import US from "@/assets/img/icons/flags/US.png";
import DE from "@/assets/img/icons/flags/DE.png";
import GB from "@/assets/img/icons/flags/GB.png";
import BR from "@/assets/img/icons/flags/BR.png";

import Globe from "@/components/sections/animations/Globe.vue";
const body = document.getElementsByTagName("body")[0];

// need PINIA at this point
import { mapMutations } from "vuex";

export default {
  name: "VRDefault",
  components: {
    AppFooter,
    Sidenav,
    Navbar,
    Card,
    Globe,
  },
  data() {
    return {
      bgImg,
      sales: {
        us: {
          country: "United States",
          sales: 2500,
          value: "$230,900",
          bounce: "29.9%",
          flag: US,
        },
        germany: {
          country: "Germany",
          sales: "3.900",
          value: "$440,000",
          bounce: "40.22%",
          flag: DE,
        },
        britain: {
          country: "Great Britain",
          sales: "1.400",
          value: "$190,700",
          bounce: "23.44%",
          flag: GB,
        },
        brasil: {
          country: "Brasil",
          sales: "562",
          value: "$143,960",
          bounce: "32.14%",
          flag: BR,
        },
      },
    };
  },

  computed: {
    // need PINIA at this point
    ...mapGetters(['cardBackgroundMaskColor']),
    isTransparent() {
      return this.$store.state.isTransparent;
    },
  },

  beforeMount() {
    this.$store.state.showNavbar = false;
    this.$store.state.showSidenav = false;
    this.$store.state.showFooter = false;
    body.classList.add("virtual-reality");
    this.$root.isTransparent = "bg-white";
  },

  beforeUnmount() {
    this.$store.state.showNavbar = true;
    this.$store.state.showSidenav = true;
    this.$store.state.showFooter = true;
    body.classList.remove("virtual-reality");

    if (this.$store.state.isPinned === false) {
      const sidenav_show = document.querySelector(".g-sidenav-show");
      sidenav_show.classList.remove("g-sidenav-hidden");
      sidenav_show.classList.add("g-sidenav-pinned");
      this.$store.state.isPinned = true;
    }
    this.$store.state.isTransparent = "bg-transparent";
  },

  methods: {
    // need PINIA at this point
    ...mapMutations(["navbarMinimize", "toggleConfigurator"]),
  }
};
</script>
