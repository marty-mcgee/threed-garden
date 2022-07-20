<template>
  <div id="MMDASHBOARD">
    <header>
      <slot name="header">
        <LogoGarden />
        <!-- *dashboard* layout: header -->
        |<NuxtLink to="/about">
          About
        </NuxtLink>
        |<NuxtLink to="/participate">
          Participate
        </NuxtLink>
        |<NuxtLink to="/pinia">
          Pinia
        </NuxtLink>
      </slot>
    </header>
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
      <!-- LAYOUT -->
      <div
        id="layout"
        class=""
      >
        <!-- meta + context -->
        <!-- <h6>*dashboard* layout: main</h6> -->
      
        <!-- DASHBOARD -->
        <SmartHome />

      </div>

      <!-- NOT SURE YET WHAT slot IS ?? -->
      <slot name="main" />

    </main>
    <footer>
      <slot name="footer">
        *dashboard* layout: footer
      </slot>
    </footer>
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
