<template>
  <div id="MMDASHBOARD">
    <!-- 
    <sidenav 
      v-if="showSidenav"
      :custom_class="cardBackgroundMaskColor"
      :class="[
        sidenavBackgroundClass,
        $store.state.isRTL ? 'fixed-end' : 'fixed-start',
      ]"
    /> 
    -->
    <main 
      id="main" 
      class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
    >
      <!-- HEADER -->
      <div>
        <LogoGarden />

        <NuxtLink to="/about">
          About
        </NuxtLink>
        <NuxtLink to="/participate">
          Participate
        </NuxtLink>
      </div>

      <!-- LAYOUT -->
      <div
        id="layout"
        class=""
      >
        <!-- meta + context -->
        <h6>A *dashboard* layout</h6>
      
        <!-- DASHBOARD -->
        <SmartHome />

      </div>

      <!-- NOT SURE YET WHAT slot IS ?? -->
      <slot />

    </main>
  </div>
</template>

<script>
import SmartHome from "@/components/dashboards/SmartHome.vue"

export default {
  name: "LayoutDashboard",
  components: {
    SmartHome,
  },
}
</script>
