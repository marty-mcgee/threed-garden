import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'virtual:windi.css'
import './index.css'
import { VueDapp } from 'vue-dapp'

const app = createApp(App)

app.use(router)
app.use(VueDapp, {
  infuraId: '',
})

app.mount('#app')
