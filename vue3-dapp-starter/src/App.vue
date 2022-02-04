<script setup lang="ts">
import LayoutHeader from './components/LayoutHeader.vue'
</script>

<template>
  <layout-header />

  <router-view></router-view>

  <vdapp-board />
</template>
