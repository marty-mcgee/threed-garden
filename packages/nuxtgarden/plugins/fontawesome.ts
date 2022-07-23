import { defineNuxtPlugin } from "nuxt/app"
import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faBars, faCalendarDay, faLocationDot } from '@fortawesome/free-solid-svg-icons'

// This is important, we are going to let Nuxt.js worry about the CSS
config.autoAddCss = false

// You can add your icons directly in this plugin. See other examples for how you
// can add other styles or just individual icons.
library.add(faCalendarDay, faLocationDot, faBars)

// Register the component globally
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})