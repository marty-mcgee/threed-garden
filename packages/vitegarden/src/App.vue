<template>
  <sidenav 
    v-if="showSidenav"
    :custom_class="cardBackgroundMaskColor"
    :class="[
      sidenavBackgroundClass,
      $store.state.isRTL ? 'fixed-end' : 'fixed-start',
    ]"
  />
  <main 
    id="main" 
    class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
  >
    <h1>HEY HEY HEY</h1>
    <router-view />
  </main>
</template>

<script>
import { mapGetters } from "vuex"
import Sidenav from "@/sections/Sidenav/Sidenav.vue"
import Configurator from "@/sections/Configurator.vue"
import Navbar from "@/sections/Navbars/Navbar.vue"
import AppFooter from "@/sections/Footer.vue"

export default {
  name: "App",
  components: {
    Sidenav,
    Navbar,
    AppFooter,
    Configurator,
  },
  computed: {
    ...mapGetters([
      'darkMode',
      'isLargeScreen',
      "showSidenav",
      "sidenavPinned",
      'sidenavTransparent',
      'showNavBar',
      'cardBackgroundMaskColor', 
    ]),
    sidenavBackgroundClass() {
      const bgClass = this.sidenavTransparent ? 'bg-transparent' : this.darkMode ? '' : 'bg-white'
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
    sidenavPinned(val) {
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
    window.addEventListener("resize", this.handleResize)
  },
  beforeUnmount: function () {
    window.removeEventListener("resize", this.handleResize)
  },
  methods: {
    handleResize() {
      // xs: 0,
      // sm: 576px,
      // md: 768px,
      // lg: 992px,
      // xl: 1200px,
      // xxl: 1400px
      if (window.innerWidth > 768) {
        this.$store.dispatch("setIsLargeScreen", true)
      } else {
        this.$store.dispatch("setIsLargeScreen", false)
      }
    }
  }
}
</script>
