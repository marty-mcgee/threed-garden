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
  <main class="mt-0 main-content main-content-bg">
    <section>
      <div class="page-header min-vh-75">
        <div class="container">
          <div class="row">
            <div class="mx-auto col-xl-4 col-lg-5 col-md-6 d-flex flex-column">
              <div class="mt-5 card card-plain">
                <div class="card-header pb-0 text-left">
                  <h3 class="font-weight-bolder text-success text-gradient">Join us today</h3>
                  <p class="mb-0">Enter your email and password to register</p>
                </div>
                <div class="card-body pb-3">
                  <form role="form">
                    <label>Name</label>
                    <vsud-input type="text" placeholder="Name" aria-label="Name" />
                    <label>Email</label>
                    <vsud-input type="email" placeholder="Email" aria-label="Email" />
                    <label>Password</label>
                    <vsud-input type="password" placeholder="Password" aria-label="Password" />
                    <vsud-checkbox id="flexCheckDefault" class="font-weight-light" checked>
                      I agree the
                      <a
                        href="../../../pages/privacy.html"
                        class="text-dark font-weight-bolder"
                      >Terms and Conditions</a>
                    </vsud-checkbox>
                    <div class="text-center">
                      <vsud-button
                        color="success"
                        variant="gradient"
                        full-width
                        class="mt-4 mb-0"
                      >Sign up</vsud-button>
                    </div>
                  </form>
                </div>
                <div class="card-footer text-center pt-0 px-sm-4 px-1">
                  <p class="mb-4 mx-auto">
                    Already have an account?
                    <a
                      href="../../../pages/sign-in/sign-in-cover.html"
                      class="text-success text-gradient font-weight-bold"
                    >Sign in</a>
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="top-0 oblique position-absolute h-100 d-md-block d-none me-n8">
                <div
                  class="bg-cover oblique-image position-absolute fixed-top ms-auto h-100 z-index-0 ms-n6"
                  :style="{
                    backgroundImage:
                      `url(${bgImg})`,
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
import bgImg from '@/assets/img/curved-images/curved11.jpg';
import Navbar from "@/examples/PageLayout/Navbar.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import VsudInput from "@/components/VsudInput.vue";
import VsudCheckbox from "@/components/VsudCheckbox.vue";
import VsudButton from "@/components/VsudButton.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "SigninCover",
  components: {
    Navbar,
    AppFooter,
    VsudInput,
    VsudCheckbox,
    VsudButton,
  },
  data() {
    return { bgImg }
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
