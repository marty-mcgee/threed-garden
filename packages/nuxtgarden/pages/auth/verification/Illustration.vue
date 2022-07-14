<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          is-blur="blur blur-rounded my-3 py-2 start-0 end-0 mx-4 shadow"
          btn-background="bg-gradient-primary"
          :dark-mode="true"
        />
      </div>
    </div>
  </div>
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">
            <div
              class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0"
            >
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
                      class="mt-0 mb-3"
                      variant="gradient"
                      color="warning"
                      full-width
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
            <div
              class="top-0 my-auto text-center col-6 d-lg-flex d-none h-100 pe-0 position-absolute end-0 justify-content-center flex-column"
            >
              <div
                class="m-3 position-relative bg-gradient-warning h-100 px-7 border-radius-lg d-flex flex-column justify-content-center"
              >
                <img
                  src="../../../assets/img/shapes/pattern-lines.svg"
                  alt="pattern-lines"
                  class="position-absolute opacity-4 start-0"
                />
                <div class="position-relative">
                  <img
                    class="max-width-500 w-100 position-relative z-index-2"
                    src="../../../assets/img/illustrations/danger-chat-ill.png"
                    alt="chart-ill"
                  />
                </div>
                <h4 class="mt-5 text-white font-weight-bolder">
                  "Attention is the new currency"
                </h4>
                <p class="text-white">
                  The more effortless the writing looks, the more effort the
                  writer actually put into the process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import Navbar from "@/examples/PageLayout/Navbar.vue";
import VsudButton from "@/components/VsudButton.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "VerificationIllustration",
  components: {
    Navbar,
    VsudButton,
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
