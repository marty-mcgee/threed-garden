import "@/assets/js/nav-pills.js"
import "@/assets/scss/soft-ui-dashboard.scss"

export default defineNuxtPlugin((/* nuxtApp */) => {
    provide: {
      uiDashboard: () => install()
    }
})