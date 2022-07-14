<template>
  <div id="MM">
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
      <LogoNuxt />
      <div>
        A *default* layout
      </div>
      <slot />
    </main>
  </div>
</template>
