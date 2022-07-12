import { createApp } from "vue"
import App from "./App.vue"
import store from "./store"

console.log("ViteGarden [MM] -- HEY HEY HEY")

const appInstance = createApp(App)
appInstance.use(store)
appInstance.mount("#app")

console.log("ViteGarden [MM] -- APP LOADED")