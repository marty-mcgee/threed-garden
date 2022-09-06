import { defineNuxtPlugin } from "nuxt/app"

export default defineNuxtPlugin((/* nuxtApp */) => {
  return {
    provide: {
      myPlugin: () => 'String generated from my auto-imported plugin!'
    }
  }
})
