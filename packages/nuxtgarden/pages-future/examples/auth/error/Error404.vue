<template>
  <navbar btn-background="bg-gradient-dark" :dark-mode="true" />
  <main class="main-content mt-0 ps">
    <section class="my-10">
      <div class="container">
        <div class="row">
          <div class="col-lg-6 my-auto">
            <h1 class="display-1 text-bolder text-gradient text-danger">
              Error 404
            </h1>
            <h2>Erm. Page not found</h2>
            <p class="lead">
              We suggest you to go to the homepage while we solve this issue.
            </p>
            <vsud-button color="dark" variant="gradient" class="mt-4"
              >Go to Homepage</vsud-button
            >
          </div>
          <div class="col-lg-6 my-auto position-relative">
            <img
              class="w-100 position-relative"
              src="@/assets/img/illustrations/error-404.png"
              alt="404-error"
            />
          </div>
        </div>
      </div>
    </section>
  </main>
  <app-footer />
</template>

<script>
import Navbar from "@/components/sections/PageLayout/Navbar.vue";
import AppFooter from "@/components/sections/PageLayout/Footer.vue";
import VsudButton from "@/components/vitesoft/VsudButton.vue";

export default {
  name: "SignupBasic",
  components: {
    Navbar,
    AppFooter,
    VsudButton,
  },
  created() {
    this.$store.state.hideConfigButton = true;
    this.$store.state.showNavbar = false;
    this.$store.state.showSidenav = false;
    this.$store.state.showFooter = false;
  },
  beforeUnmount() {
    this.$store.state.hideConfigButton = false;
    this.$store.state.showNavbar = true;
    this.$store.state.showSidenav = true;
    this.$store.state.showFooter = true;
  },
};
</script>
