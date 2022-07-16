<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          is-blur="blur blur-rounded my-3 py-2 start-0 end-0 mx-4 shadow"
          btn-background="bg-gradient-success"
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
              class="col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0 mx-auto"
            >
              <div class="card card-plain">
                <div class="card-header pb-0 text-left">
                  <h4 class="font-weight-bolder">Sign Up</h4>
                  <p class="mb-0">Enter your email and password to register</p>
                </div>
                <div class="card-body pb-3">
                  <form role="form">
                    <label>Name</label>
                    <vsud-input
                      type="text"
                      placeholder="Name"
                      aria-label="Name"
                    />
                    <label>Email</label>
                    <vsud-input
                      type="email"
                      placeholder="Email"
                      aria-label="Email"
                    />
                    <label>Password</label>
                    <vsud-input
                      type="password"
                      placeholder="Password"
                      aria-label="Password"
                    />
                    <vsud-checkbox id="flexCheckDefault" checked>
                      I agree the
                      <a
                        href="../../../pages/privacy.html"
                        class="text-dark font-weight-bolder"
                        >Terms and Conditions</a
                      >
                    </vsud-checkbox>
                    <div class="text-center">
                      <vsud-button
                        color="success"
                        variant="gradient"
                        full-width
                        class="w-100 mt-4 mb-0"
                        >Sign up</vsud-button
                      >
                    </div>
                  </form>
                </div>
                <div class="card-footer text-center pt-0 px-sm-4 px-1">
                  <p class="mb-4 mx-auto">
                    Already have an account?
                    <a
                      href="../../../pages/sign-in/sign-in-cover.html"
                      class="text-success text-gradient font-weight-bold"
                      >Sign in</a
                    >
                  </p>
                </div>
              </div>
            </div>
            <div
              class="col-6 d-lg-flex d-none h-100 my-auto pe-0 position-absolute top-0 end-0 text-center justify-content-center flex-column"
            >
              <div
                class="position-relative bg-gradient-success h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center"
              >
                <img
                  src="@/assets/img/shapes/pattern-lines.svg"
                  alt="pattern-lines"
                  class="position-absolute opacity-4 start-0"
                />
                <div class="position-relative">
                  <img
                    class="max-width-500 w-100 position-relative z-index-2"
                    src="@/assets/img/illustrations/rocket-white.png"
                    alt="rocket"
                  />
                </div>
                <h4 class="mt-5 text-white font-weight-bolder">
                  Your journey starts here
                </h4>
                <p class="text-white">
                  >Just as it takes a company to sustain a product, it takes a
                  community to sustain a protocol.
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
import Navbar from "@/components/sections/PageLayout/Navbar.vue";
import VsudInput from "@/components/vitesoft/VsudInput.vue";
import VsudCheckbox from "@/components/vitesoft/VsudCheckbox.vue";
import VsudButton from "@/components/vitesoft/VsudButton.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "SigninIllustration",
  components: {
    Navbar,
    VsudInput,
    VsudCheckbox,
    VsudButton,
  },
  created() {
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
