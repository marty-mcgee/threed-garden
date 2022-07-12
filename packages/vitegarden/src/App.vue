<template>
  <sidenav 
    v-if="showSidenav"
    :custom_class="cardBackgroundMaskColor"
    :class="[
      sideBarBackgroundClass,
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
import Sidenav from "@/views/Sidenav/Sidenav.vue"

export default {
  name: "App",
  components: {
    Sidenav
  },
  computed: {
    ...mapGetters([
      'showSidenav',
    ])
  },
  watch: {

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
        // this.$store.dispatch('setIsLargeScreen', true)
      } else {
        // this.$store.dispatch('setIsLargeScreen', false)
      }
      // xs: 0,
      // sm: 576px,
      // md: 768px,
      // lg: 992px,
      // xl: 1200px,
      // xxl: 1400px
    }
  }
}
</script>
