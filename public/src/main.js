import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"

createApp(App)
	.use(store)
	.use(router)
	.mount("#app")



// import 'bulma/css/bulma.css'
// import Vue from 'vue'
// import App from './App.vue'
// import router from './router'

// Vue.config.productionTip = false

// new Vue({
// 	router,
// 	render: h => h(App)
// }).$mount('#qmanager')