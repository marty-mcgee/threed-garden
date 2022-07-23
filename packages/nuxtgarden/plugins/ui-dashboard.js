import "@/assets/js/nav-pills.js"
import "@/assets/scss/soft-ui-dashboard.scss"

export default defineNuxtPlugin((/* nuxtApp */) => {
  return {
    provide: {
      uiDashboard: () => install()
    }
  }
})