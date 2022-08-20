import { createApp } from "vue"
import App from "./App.vue"
import store from "./store"
import router from "./router"
import "./assets/css/nucleo-icons.css"
import "./assets/css/nucleo-svg.css"
// import VueTilt from "vue-tilt.js"
// import VueSweetalert2 from "vue-sweetalert2"
import UIDashboard from "./ui-dashboard"

console.log("ViteGarden [MM] -- HEY HEY HEY")

const appInstance = createApp(App)
appInstance.use(store)
appInstance.use(router)
// appInstance.use(VueTilt)
// appInstance.use(VueSweetalert2)
appInstance.use(UIDashboard)
appInstance.mount("#app")

console.log("ViteGarden [MM] -- APP MOUNTED")