import { defineNuxtConfig } from "nuxt"
import Icons from 'unplugin-icons/vite'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  // HEY NUXT, LOAD THESE MODULES FOR ME
  modules: [
    // [MM] NUXT EXAMPLES..
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

    // [MM] ADD SPRINKLES
    "@vueuse/nuxt",
    "@unocss/nuxt",
    
    // [MM] (DO NOT) USE AXIOS -- USE NUXT 3 "isomorphic fetch"
    // "@nuxtjs/axios",

    // [MM] BOOTSTRAP VUE 3 on NUXT 3 ?? beta af
    // "bootstrap-vue-3/nuxt",
    // "efficy-bootstrap-vue-3/nuxt",

  ],
  // HEY NUXT, BUILD THESE MODULES FOR ME
  buildModules: [
    // PINIA
    // Composition API included in Nuxt 3. For Nuxt 2 only:
    // https://composition-api.nuxtjs.org/getting-started/setup#quick-start
    // "@nuxtjs/composition-api/module",
    ["@pinia/nuxt", { disableVuex: false }],

    // TYPESCRIPT
    "@nuxt/typescript-build",

    // [MM] BOOTSTRAP VUE 3 on NUXT 3 ?? beta af
    // "bootstrap-vue-3/nuxt",
    // "efficy-bootstrap-vue-3/nuxt",
  ],
  // OLD ??? build.transpile
  // =======================
  // build: {
  //   transpile: [
  //     '@fortawesome/vue-fontawesome',
  //     '@fortawesome/fontawesome-svg-core',
  //     '@fortawesome/free-brands-svg-icons',
  //     '@fortawesome/free-regular-svg-icons',
  //     '@fortawesome/free-solid-svg-icons',
  //   ]
  // },
  // HEY NUXT, TALK TO VITE -- EXPERIMENTAL
  // ======================================
  vite: {
    plugins: [
      Icons({
        // experimental
        autoInstall: true,
      })
    ]
  },
  // NUXT AUTO-IMPORTS FROM /plugins DIRECTORY
  // =========================================
  // YOU CAN MANUALLY SET UP PLUGINS HERE:....
  plugins: [
    // UI Dashboard Theme (SCSS, JS, icons)
    // "@/assets/js/ui-dashboard", is now at:
    // "@/plugins/ui-dashboard",
    
    // QUESTIONABLES..

    // PERSISTED STATE .js (using cookies)
    // using a package name ??? NO!
    // "pinia-plugin-persistedstate-2",
    // using the plugin (no need, auto-imported)
    // "@/plugins/persistedstate.ts",
    
    // Choices.js
    // ERROR: [nuxt] [request error] __vite_ssr_import_1__ is not defined
    // { src: "choices.js", ssr: false },

    // FullCalendar @fullcalendar
    // { src: "@fullcalendar/core", ssr: false },
    // { src: "@fullcalendar/daygrid", ssr: false },
    // { src: "@fullcalendar/interaction", ssr: false },
    // { src: "@fullcalendar/vue3", ssr: false }
  ],
  // HEY NUXT, SET <head> PARAMETERS/LOADERS (FOR GLOBAL DOM SETTINGS)
  // =================================================================
  // head: {
  //   script: [
  //     { 
  //       hid: "stripe",
  //       src: "https://js.stripe.com/v3/",
  //       defer: true, 
  //       async: true,
  //     },
  //     { 
  //       hid: "jkanban",
  //       src: "https://cdn.jsdelivr.net/npm/jkanban@1.3.1/dist/jkanban.min.js",
  //       defer: true,
  //       async: true,
  //     },
  //     { 
  //       hid: "fa",
  //       src: "https://kit.fontawesome.com/42d5adcbca.js",
  //       defer: true,
  //       async: true,
  //       crossorigin: "anonymous",
  //     },
  //   ],
  //   style: [
  
  //   ]
  // },
  // LOAD CSS + SASS: CASCADING STYLE SHEETS
  // =======================================
  css: [
    "~/assets/css/main.css",
    "~/assets/css/nucleo-icons.css",
    "~/assets/css/nucleo-svg.css",
    "~/assets/scss/soft-ui-dashboard.scss",
  ],
  // USE UNOCSS
  // ==========
  unocss: {
    // presets
    uno: true, // enabled `@unocss/preset-uno`
    icons: true, // enabled `@unocss/preset-icons`
    attributify: true, // enabled `@unocss/preset-attributify`,

    // core options
    shortcuts: [],
    rules: [],
  },
  // (DO NOT) USE AXIOS -- USE NUXT 3 "isomorphic fetch"
  // https://v3.nuxtjs.org/docs/usage/data-fetching/#usefetch
  // ========================================================
  // axios: {
  //   debug: true,
  //   progress: true,
  //   proxyHeaders: true,
  // },
  // TALK TO TYPESCRIPT
  // ==================
  typescript: {
    // because we are using TS "Take Over Mode", 
    // we should not need to generate shims in nuxt
    shim: false,
  },
})
