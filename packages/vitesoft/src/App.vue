<template>
  <sidenav
    v-if="showSideBar"
    :custom_class="cardBackgroundMaskColor"
    :class="[
      sideBarBackgroundClass,
      $store.state.isRTL ? 'fixed-end' : 'fixed-start',
    ]"
  />
  <main id="main" class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
    <!-- nav -->
    <navbar
      v-if="showNavBar"
      :class="[navClasses]"
      :text-white="$store.state.isAbsolute ? 'text-white opacity-8' : ''"
    />
    <router-view />
    <app-footer v-show="$store.state.showFooter" />
    <configurator
      :class="[
        $store.state.showConfig ? 'show' : '',
        $store.state.hideConfigButton ? 'd-none' : '',
      ]"
    />
  </main>
</template>
<script>
import { mapGetters } from "vuex";
import Sidenav from "@/examples/Sidenav/index.vue";
import Configurator from "@/examples/Configurator.vue";
import Navbar from "@/examples/Navbars/Navbar.vue";
import AppFooter from "@/examples/Footer.vue";
export default {
  name: "App",
  components: {
    Sidenav,
    Configurator,
    Navbar,
    AppFooter,
  },

  computed: {
    ...mapGetters([
      'showSideBar',
      'showNavBar',
      'darkMode',
      'sidebarTransparent',
      'sidebarPinned',
      'cardBackgroundMaskColor', 'isLargeScreen'
    ]),

    sideBarBackgroundClass() {
      const bgClass = this.sidebarTransparent ? 'bg-transparent' : this.darkMode ? '' : 'bg-white'
      return this.isLargeScreen ? bgClass : this.darkMode ? 'dark' : 'bg-white'
    },
    navClasses() {
      return {
        "position-sticky blur shadow-blur mt-4 left-auto top-1 z-index-sticky": this
          .$store.state.isNavFixed,
        "position-absolute px-4 mx-0 w-100 z-index-2": this.$store.state
          .isAbsolute,
        "px-0 mx-4 mt-4": !this.$store.state.isAbsolute,
      };
    },
  },
  watch: {
    darkMode(val) {
      if (val) {
        document.body.classList.add("dark-version")
      } else {
        document.body.classList.remove("dark-version")
      }
    },
    sidebarPinned(val) {
      const app = document.getElementById('app')
      if (val) {
        app.classList.add('g-sidenav-pinned')
        app.classList.remove('g-sidenav-hidden')
      } else {
        app.classList.add('g-sidenav-hidden')
        app.classList.remove('g-sidenav-pinned')
      }
    }
  },
  mounted: function () {
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount: function () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      if (window.innerWidth > 1200) {
        this.$store.dispatch('setIsLargeScreen', true)
      } else {
        this.$store.dispatch('setIsLargeScreen', false)
      }
      // xs: 0,
      // sm: 576px,
      // md: 768px,
      // lg: 992px,
      // xl: 1200px,
      // xxl: 1400px
    }
  }
};
</script>
