import { defineNuxtPlugin } from "nuxt/app"
import "@/assets/js/nav-pills.js"
import "@/assets/scss/soft-ui-dashboard.scss"

export default defineNuxtPlugin((nuxtApp) => {
  // install() // original way from vitesoft
  // new way with nuxt
  return {
    provide: {
      uiDashboard: () => nuxtApp // return whole nuxtApp (yep)
    }
  }
})