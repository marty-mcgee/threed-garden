<template>
  <navbar btn-background="bg-gradient-dark" :dark-mode="true" />
  <main class="main-content mt-0 ps">
    <div>
      <section class="min-vh-100 d-flex align-items-center">
        <div class="container">
          <div class="row mt-lg-0 mt-8">
            <div class="col-lg-5 my-auto">
              <h1
                class="display-1 text-bolder text-gradient text-warning fadeIn1 fadeInBottom mt-5"
              >
                Error 500
              </h1>
              <h2 class="fadeIn3 fadeInBottom opacity-8">
                Something went wrong
              </h2>
              <p class="lead opacity-6 fadeIn2 fadeInBottom">
                We suggest you to go to the homepage while we solve this issue.
              </p>
              <vsud-button
                color="warning"
                variant="gradient"
                class="mt-4 fadeIn2 fadeInBottom"
                >Go to Homepage</vsud-button
              >
            </div>
            <div class="col-lg-7 my-auto">
              <img
                class="w-100 fadeIn1 fadeInBottom"
                src="../../../assets/img/illustrations/error-500.png"
                alt="500-error"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
    <div class="ps__rail-x" style="left: 0px; bottom: 0px">
      <div class="ps__thumb-x" tabindex="0" style="left: 0px; width: 0px"></div>
    </div>
    <div class="ps__rail-y" style="top: 0px; right: 0px">
      <div class="ps__thumb-y" tabindex="0" style="top: 0px; height: 0px"></div>
    </div>
  </main>
  <app-footer />
</template>
<script>
import Navbar from "@/examples/PageLayout/Navbar.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import VsudButton from "@/components/VsudButton.vue";

import { mapMutations } from "vuex";
export default {
  name: "SignupBasic",
  components: {
    Navbar,
    AppFooter,
    VsudButton,
  },
  created() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  methods: {
    ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),
  },
};
</script>
