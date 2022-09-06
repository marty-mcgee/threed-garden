<template>
  <div class="fixed-plugin">
    <a class="px-3 py-2 fixed-plugin-button text-dark position-fixed" @click="show = true">
      <i class="py-2 fa fa-cog"></i>
    </a>
    <div class="shadow-lg card" :class="darkMode ? '' : 'blur'">
      <div class="pt-3 pb-0 bg-transparent card-header">
        <div class="float-start">
          <h5 class="mt-3 mb-0">Soft UI Configurator</h5>
          <p>See our dashboard options.</p>
        </div>
        <div class="mt-4 float-end">
          <button
            class="p-0 btn btn-link text-dark fixed-plugin-close-button"
            @click="show = false"
          >
            <i class="fa fa-close"></i>
          </button>
        </div>
        <!-- End Toggle Button -->
      </div>
      <hr class="my-1 horizontal" :class="!darkMode ? 'dark' : 'light'" />
      <div class="pt-0 card-body pt-sm-3">
        <!-- Sidenav Backgrounds -->
        <div>
          <h6 class="mb-0">Sidenav Colors</h6>
        </div>
        <a href="#" class="switch-trigger background-color">
          <div class="my-2 badge-colors" :class="$store.state.isRTL ? 'text-end' : ' text-start'">
            <span
              class="badge filter bg-gradient-primary active"
              data-color="primary"
              @click="$store.dispatch('setSidenavColor', 'primary')"
            ></span>
            <span
              class="badge filter bg-gradient-dark"
              data-color="dark"
              @click="$store.dispatch('setSidenavColor', 'dark')"
            ></span>
            <span
              class="badge filter bg-gradient-info"
              data-color="info"
              @click="$store.dispatch('setSidenavColor', 'info')"
            ></span>
            <span
              class="badge filter bg-gradient-success"
              data-color="success"
              @click="$store.dispatch('setSidenavColor', 'success')"
            ></span>
            <span
              class="badge filter bg-gradient-warning"
              data-color="warning"
              @click="$store.dispatch('setSidenavColor', 'warning')"
            ></span>
            <span
              class="badge filter bg-gradient-danger"
              data-color="danger"
              @click="$store.dispatch('setSidenavColor', 'danger')"
            ></span>
          </div>
        </a>
        <!-- Sidenav Type -->
        <div class="mt-3">
          <h6 class="mb-0">Sidenav Type</h6>
          <p class="text-sm">Choose between 2 different sidenav types.</p>
        </div>
        <div class="d-flex">
          <button
            id="btn-transparent"
            class="btn bg-gradient-primary w-100 px-3 mb-2"
            :class="sidenavTransparent ? 'active' : ''"
            :disabled="!isLargeScreen"
            @click="$store.dispatch('setSidenavTransparent', true)"
          >Transparent</button>
          <button
            id="btn-white"
            class="btn bg-gradient-primary w-100 px-3 mb-2 ms-2"
            :class="sidenavTransparent ? '' : 'active'"
            :disabled="!isLargeScreen"
            @click="$store.dispatch('setSidenavTransparent', false)"
          >White</button>
        </div>
        <p
          class="mt-2 text-sm d-xl-none d-block"
        >You can change the sidenav type just on desktop view.</p>
        <!-- Navbar Fixed -->
        <div class="d-flex align-items-centerd-flex align-items-center mt-3 justify-content-between">
          <div class="mt-3">
            <h6 class="mb-0">Navbar Fixed</h6>
          </div>
          <div class="form-check form-switch ps-0">
            <input
              id="navbarFixed"
              v-model="isNavbarFixed"
              class="mt-1 form-check-input"
              :class="$store.state.isRTL ? 'float-end  me-auto' : ' ms-auto'"
              type="checkbox"
            />
          </div>
        </div>
        <hr class="mb-1 horizontal" :class="!darkMode ? 'dark' : 'light'" />
        <div class="d-flex align-items-centerd-flex align-items-center mt-3 justify-content-between">
          <div class="mt-2">
            <h6 class="mb-0">Sidenav Mini</h6>
          </div>
          <div class="form-check form-switch ps-0">
            <input
              id="navbarMinimize"
              v-model="isSidenavPinned"
              class="mt-1 form-check-input"
              :class="$store.state.isRTL ? 'float-end  me-auto' : ' ms-auto'"
              type="checkbox"
            />
          </div>  
        </div>
        
        <hr class="mb-1 horizontal" :class="!darkMode ? 'dark' : 'light'" />
        <div class="d-flex align-items-centerd-flex align-items-center mt-3 justify-content-between">
          <div class="mt-2">
            <h6 class="mb-0">Dark Version</h6>
          </div>
          <div class="form-check form-switch ps-0">
            <input
              id="toggleDarkMode"
              v-model="isDarkMode"
              class="mt-1 form-check-input"
              :class="$store.state.isRTL ? 'float-end  me-auto' : ' ms-auto'"
              type="checkbox"
            />
          </div>
        </div>
        <hr class="horizontal my-sm-4" :class="!darkMode ? 'dark' : 'light'" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "Configurator",
  computed: {
    ...mapGetters([
      "sidenavTransparent",
      "darkMode",
      "navbarFixed",
      "showConfigurator",
      "sidenavPinned",
      "isLargeScreen"
    ]),
    isDarkMode: {
      get() { return this.darkMode },
      set(val) { this.$store.dispatch('setDarkMode', val) }
    },
    isNavbarFixed: {
      get() { return this.navbarFixed },
      set(val) { this.$store.dispatch('setNavbarFixed', val) }
    },
    isSidenavPinned: {
      get() { return !this.sidenavPinned },
      set(val) { this.$store.dispatch('setSidenavPinned', !val) }
    },
    show: {
      get() { return this.showConfigurator },
      set(val) { this.$store.dispatch('setShowConfigurator', val) }
    },
  },
};
</script>
