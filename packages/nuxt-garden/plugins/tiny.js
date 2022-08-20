import { defineNuxtPlugin } from "nuxt/app"
import Editor from "@tinymce/tinymce-vue"

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("Editor", Editor)
})
