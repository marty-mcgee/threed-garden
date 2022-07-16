import { defineNuxtConfig } from "nuxt"

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    // [MM] EXAMPLES..
    // Using package name
    // "@nuxtjs/axios",
    // Relative to your project srcDir
    // "~/modules/awesome.js",
    // Providing options
    // ["@nuxtjs/google-analytics", { ua: "X1234567" }],
    // Inline definition
    // function () {
    //   return false
    // },
    // [MM] NO..
    // "@/assets/js/ui-dashboard",
    // "@/assets/js/nav-pills.js",
    // "@/assets/scss/soft-ui-dashboard.scss",
  ],
  plugins: [
    "@/assets/js/ui-dashboard",
  ],
  typescript: {
    shim: false
  },
})
