<template>
  <Renderer ref="rendererC" antialias :orbit-ctrl="{ enableDamping: true }" resize="window">
    <Camera :position="{ z: 10 }" />
    <Scene>
      <PointLight :position="{ y: 50, z: 50 }" />
      <Box :size="1" ref="meshC" :rotation="{ y: Math.PI / 4, z: Math.PI / 4 }">
        <LambertMaterial />
      </Box>
    </Scene>
  </Renderer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Box, Camera, LambertMaterial, MeshPublicInterface, PointLight, Renderer, RendererPublicInterface, Scene } from 'troisjs'

const rendererC = ref()
const meshC = ref()

onMounted(() => {
  const renderer = rendererC.value as RendererPublicInterface
  const mesh = (meshC.value as MeshPublicInterface).mesh
  renderer.onBeforeRender(() => {
    mesh!.rotation.x += 0.01
  })
})
</script>

<style>
body, html {
  margin: 0;
}
canvas {
  display: block;
}
</style>
