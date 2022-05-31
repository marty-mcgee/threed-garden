<template>
  <navbar class="my-3 mt-2" />
  <div
    class="page-header align-items-start min-vh-50 pt-5 pb-11 m-3 border-radius-lg"
    :style="{
      backgroundImage:
        'url(' + require('@/assets/img/curved-images/curved8.jpg') + ')',
    }"
  >
    <span class="mask bg-gradient-dark opacity-6"></span>
  </div>
  <div class="container">
    <div class="row mt-lg-n10 mt-md-n11 mt-n10 justify-content-center">
      <div class="col-xl-4 col-lg-5 col-md-7 mx-auto">
        <div class="card py-lg-3">
          <div class="card-body text-center">
            <div class="info mb-4">
              <img
                class="avatar avatar-xxl"
                alt="Image placeholder"
                src="../../../assets/img/team-4.jpg"
              />
            </div>
            <h4 class="mb-0 font-weight-bolder">Mike Priesler</h4>
            <p class="mb-4">Enter password to unlock your account.</p>
            <form role="form">
              <div class="mb-3">
                <vsud-input
                  type="password"
                  placeholder="Password"
                  name="password"
                />
              </div>
              <div class="text-center">
                <vsud-button
                  class="mt-3 mb-0"
                  variant="gradient"
                  color="dark"
                  size="lg"
                  >Unlock
                </vsud-button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  <app-footer />
</template>

<script>
import Navbar from "@/examples/PageLayout/Navbar.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import VsudInput from "@/components/VsudInput.vue";
import VsudButton from "@/components/VsudButton.vue";

import { mapMutations } from "vuex";

export default {
  name: "LockBasic",
  components: {
    Navbar,
    AppFooter,
    VsudButton,
    VsudInput,
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
