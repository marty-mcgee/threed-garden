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
  <main class="main-content main-content-bg mt-0">
    <section>
      <div class="page-header min-vh-75">
        <div class="container">
          <div class="row">
            <div class="col-xl-4 col-lg-5 col-md-6 d-flex flex-column mx-auto">
              <div class="card card-plain py-lg-3">
                <div class="card-body text-center">
                  <h4 class="mb-0 font-weight-bolder">Mike Priesler</h4>
                  <p class="mb-4">Enter password to unlock your account.</p>
                  <form role="form">
                    <div class="mb-3">
                      <vsud-input type="password" placeholder="Password" name="password" />
                    </div>
                    <div class="text-center">
                      <vsud-button variant="gradient" color="dark" size="lg" full-width>Unlock</vsud-button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="oblique position-absolute top-0 h-100 d-md-block d-none me-n8">
                <div
                  class="oblique-image bg-cover position-absolute fixed-top ms-auto h-100 z-index-0 ms-n6"
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
import bgImg from '@/assets/img/curved-images/curved7.jpg';
import Navbar from "@/components/sections/PageLayout/Navbar.vue";
import AppFooter from "@/components/sections/PageLayout/Footer.vue";
import VsudInput from "@/components/vitesoft/VsudInput.vue";
import VsudButton from "@/components/vitesoft/VsudButton.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "LockCover",
  components: {
    Navbar,
    AppFooter,
    VsudInput,
    VsudButton,
  },
  data() {
    return { bgImg }
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
