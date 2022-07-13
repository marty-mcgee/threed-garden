<template>
  <div class="py-4 h-100 container-fluid">
    <div class="row">
      <div class="text-center col-12">
        <h3 class="mt-5">Build Your Profile</h3>
        <h5 class="text-secondary font-weight-normal">
          This information will let us know more about you.
        </h5>
        <div class="mb-5 multisteps-form">
          <!--progress bar-->
          <div class="row">
            <div class="mx-auto my-5 col-12 col-lg-8">
              <div class="multisteps-form__progress">
                <button
                  class="multisteps-form__progress-btn"
                  type="button"
                  title="User Info"
                  :class="activeStep >= 0 ? activeClass : ''"
                  @click="activeStep = 0"
                >
                  <span>About</span>
                </button>
                <button
                  class="multisteps-form__progress-btn"
                  type="button"
                  title="Address"
                  :class="activeStep >= 1 ? activeClass : ''"
                  @click="activeStep = 1"
                >
                  <span>Account</span>
                </button>
                <button
                  class="multisteps-form__progress-btn"
                  type="button"
                  title="Order Info"
                  :class="activeStep === 2 ? activeClass : ''"
                  @click="activeStep = 2"
                >
                  <span>Address</span>
                </button>
              </div>
            </div>
          </div>
          <!--form panels-->
          <div class="row">
            <div class="m-auto col-12 col-lg-8">
              <form class="multisteps-form__form">
                <!--single form panel-->
                <about v-if="activeStep === 0" />
                <!--single form panel-->
                <account :class="activeStep === 1 ? activeClass : ''" />
                <!--single form panel-->
                <app-address :class="activeStep === 2 ? activeClass : ''" />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import About from "./components/About.vue";
import Account from "./components/Account.vue";
import AppAddress from "./components/Address.vue";
export default {
  name: "Wizard",
  components: { About, Account, AppAddress },
  data() {
    return {
      activeClass: "js-active position-relative",
      activeStep: 0,
      formSteps: 2,
    };
  },
  methods: {
    nextStep() {
      if (this.activeStep < this.formSteps) {
        this.activeStep += 1;
      } else {
        this.activeStep -= 1;
      }
    },
    prevStep() {
      if (this.activeStep > 0) {
        this.activeStep -= 1;
      }
    },
  },
};
</script>
