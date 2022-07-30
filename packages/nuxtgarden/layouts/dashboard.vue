<template>
  <div id="MMDASHBOARD">
    <slot name="header">
      <Header class="m-1" />
    </slot>
    <slot name="sidenav">
      <!-- <Sidenav 
        v-if="showSidenav"
        :custom_class="cardBackgroundMaskColor"
        :class="[
          sidenavBackgroundClass,
          $store.state.isRTL ? 'fixed-end' : 'fixed-start',
        ]"
      /> -->
    </slot>
    <slot name="main">
      <main 
        id="main" 
        class="main-content border-radius-lg"
      >
        <!-- <ThreeDGarden /> -->
        <SmartHome />
        <slot />
      </main>
    </slot>
    <slot name="footer">
      <Footer />
    </slot>
  </div>
</template>

<script>
import Header from "@/components/sections/pagelayout/Header.vue"
import Footer from "@/components/sections/pagelayout/Footer2.vue"
import Sidenav from "@/components/sections/sidenav/Sidenav.vue"
// import ThreeDGarden from "@/components/dashboards/ThreeDGarden.vue"
import SmartHome from "@/components/dashboards/SmartHome.vue"
// import Navbar from "@/components/sections/navbars/Navbar.vue"
// import Configurator from "@/components/configs/Configurator.vue"
 
export default {
  name: "LayoutDashboard",
  components: {
    Header,
    Footer,
    Sidenav,
    // ThreeDGarden,
    SmartHome,
    // Navbar,
    // Configurator,
  },
  setup() {
    // setup() returns an object
    return {
      message: "HEY HEY HEY"
    }
  }
} // end export default
</script>