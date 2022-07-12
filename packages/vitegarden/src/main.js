import { createApp } from "vue"
import App from "./App.vue"
import store from "./store"
import router from "./router"

console.log("ViteGarden [MM] -- HEY HEY HEY")

const appInstance = createApp(App)
appInstance.use(store)
appInstance.use(router)
appInstance.mount("#app")

console.log("ViteGarden [MM] -- APP MOUNTED")