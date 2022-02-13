<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          isBlur="blur blur-rounded my-3 py-2 start-0 end-0 mx-4 shadow"
          btnBackground="bg-gradient-primary"
          v-bind:darkMode="true"
        />
      </div>
    </div>
  </div>
  <main class="mt-0 main-content main-content-bg">
    <section>
      <div class="page-header min-vh-75">
        <div class="container">
          <div class="row">
            <div class="mx-auto col-xl-4 col-lg-5 col-md-6 d-flex flex-column">
              <div class="card card-plain">
                <div class="text-center card-body px-lg-5 py-lg-5">
                  <div class="mb-4 text-center text-muted">
                    <h2>2-Step Verification</h2>
                  </div>
                  <div class="row gx-2 gx-sm-3">
                    <div class="col">
                      <div class="form-group">
                        <input
                          type="text"
                          class="form-control form-control-lg"
                          maxlength="1"
                          autocomplete="off"
                          autocapitalize="off"
                        />
                      </div>
                    </div>
                    <div class="col">
                      <div class="form-group">
                        <input
                          type="text"
                          class="form-control form-control-lg"
                          maxlength="1"
                          autocomplete="off"
                          autocapitalize="off"
                        />
                      </div>
                    </div>
                    <div class="col">
                      <div class="form-group">
                        <input
                          type="text"
                          class="form-control form-control-lg"
                          maxlength="1"
                          autocomplete="off"
                          autocapitalize="off"
                        />
                      </div>
                    </div>
                    <div class="col">
                      <div class="form-group">
                        <input
                          type="text"
                          class="form-control form-control-lg"
                          maxlength="1"
                          autocomplete="off"
                          autocapitalize="off"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="text-center">
                    <vsud-button
                      class="mb-3"
                      variant="gradient"
                      color="warning"
                      fullWidth
                      >Send code
                    </vsud-button>
                    <span class="text-sm text-muted"
                      >Haven't received it?<a href="javascript:;">
                        Resend a new code</a
                      >.</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div
                class="top-0 oblique position-absolute h-100 d-md-block d-none me-n8"
              >
                <div
                  class="bg-cover oblique-image position-absolute fixed-top ms-auto h-100 z-index-0 ms-n6"
                  :style="{
                    backgroundImage:
                      'url(' +
                      require('@/assets/img/curved-images/curved9.jpg') +
                      ')',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <app-footer />
</template>

<script>
import Navbar from "@/examples/PageLayout/Navbar.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import VsudButton from "@/components/VsudButton.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "verification-cover",
  components: {
    Navbar,
    VsudButton,
    AppFooter,
  },
  beforeMount() {
    this.$store.state.hideConfigButton = true;
    this.$store.state.showNavbar = false;
    this.$store.state.showSidenav = false;
    this.$store.state.showFooter = false;
    body.classList.remove("bg-gray-100");
  },
  beforeUnmount() {
    this.$store.state.hideConfigButton = false;
    this.$store.state.showNavbar = true;
    this.$store.state.showSidenav = true;
    this.$store.state.showFooter = true;
    body.classList.add("bg-gray-100");
  },
};
</script>
