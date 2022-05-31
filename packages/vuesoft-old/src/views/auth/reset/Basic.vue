<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          isBlur="blur blur-rounded my-3 py-2 start-0 end-0 mx-4 shadow"
          btnBackground="bg-gradient-success"
          v-bind:darkMode="true"
        />
      </div>
    </div>
  </div>

  <main class="mt-0 main-content main-content-bg">
    <section class="min-vh-75">
      <div class="container">
        <div class="row">
          <div class="mx-auto col-lg-5 col-md-7">
            <div class="mb-4 card z-index-0 mt-sm-12 mt-9">
              <div class="pt-4 pb-1 text-center card-header">
                <h4 class="mb-1 font-weight-bolder">Reset password</h4>
                <p class="mb-0">
                  You will receive an e-mail in maximum 60 seconds
                </p>
              </div>
              <div class="card-body">
                <form role="form">
                  <div class="mb-3">
                    <vsud-input type="email" placeholder="Email" name="email" />
                  </div>
                  <div class="text-center">
                    <vsud-button
                      class="my-4 mb-2"
                      variant="gradient"
                      color="dark"
                      fullWidth
                      size="lg"
                      >Send
                    </vsud-button>
                  </div>
                </form>
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
import VsudInput from "@/components/VsudInput.vue";
import VsudButton from "@/components/VsudButton.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "reset-basic",
  components: {
    Navbar,
    AppFooter,
    VsudInput,
    VsudButton,
  },
  beforeMount() {
    body.classList.add("bg-gray-200");
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
    body.classList.remove("bg-gray-200");
  },
};
</script>
