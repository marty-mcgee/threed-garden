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
    // [MM] BOOTSTRAP VUE 3 on NUXT 3
    "bootstrap-vue-3/nuxt",
  ],
  plugins: [
    // UI Dashboard Theme (SCSS, JS, icons)
    "@/assets/js/ui-dashboard",
    // QUESTIONABLES..
    // Choices.js
    // ERROR: [nuxt] [request error] __vite_ssr_import_1__ is not defined
    // { src: "choices.js", ssr: false },
    // FullCalendar @fullcalendar
    // { src: "@fullcalendar/core", ssr: false },
    // { src: "@fullcalendar/daygrid", ssr: false },
    // { src: "@fullcalendar/interaction", ssr: false },
    // { src: "@fullcalendar/vue3", ssr: false }
  ],
  head: {
    script: [
      { 
        hid: "stripe",
        src: "https://js.stripe.com/v3/",
        defer: true, 
        async: true,
      },
      { 
        hid: "jkanban",
        src: "https://cdn.jsdelivr.net/npm/jkanban@1.3.1/dist/jkanban.min.js",
        defer: true,
        async: true,
      },
      { 
        hid: "fa",
        src: "https://kit.fontawesome.com/42d5adcbca.js",
        defer: true,
        async: true,
        crossorigin: "anonymous",
      },
    ],
    style: [

    ]
  },
  typescript: {
    // because we are using TS "Take Over Mode", 
    // we should not need to generate shims in nuxt
    shim: false
  },
})
