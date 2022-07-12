import { createApp } from "vue"
import App from "./App.vue"
import store from "./store"
import router from "./router"
import UIDashboard from "./ui-dashboard"

console.log("ViteGarden [MM] -- HEY HEY HEY")

const appInstance = createApp(App)
appInstance.use(store)
appInstance.use(router)
appInstance.use(UIDashboard)
appInstance.mount("#app")

console.log("ViteGarden [MM] -- APP MOUNTED")