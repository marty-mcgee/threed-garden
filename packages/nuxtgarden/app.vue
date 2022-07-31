<template>
  <div id="APP">
    <!-- <h1>HEY HEY HEY</h1> -->
    <!-- <NuxtWelcome /> -->
    <!-- <Welcome /> -->
    <NuxtLayout cl>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script>
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore } from "@/composables/stores/CounterStore"

// implicit calls to (what may/should be) auto-imports from nuxt
// import { defineComponent } from "vue"
// import { useNuxtApp, useRoute, useHead } from "nuxt/app"

export default {
  setup() {
    // state stores (singletons)
    const userStore = useUserStore()
    const eventStore = useEventStore()
    const uiStore = useUIStore()
    const counterStore = useCounterStore()

    // USENUXTAPP (COMPOSABLE)
    // =========================
    const nuxtApp = useNuxtApp()
    nuxtApp.provide("hello", (name) => `=== Hello ${name} ===`)
    console.log(nuxtApp.$hello("Garden")) // Prints "Hello Garden"

    // COMPOSABLE FUNCTION (RETURNABLE ???)
    // function useMyComposable() {
    const useMyComposable = (message = "HEY HEY HEY") => {
      const nuxtApp = useNuxtApp()
      // access runtime nuxt app instance
      // nuxtApp.use(UIDashboard)
      nuxtApp.provide("threed", (name) => `=== ThreeD: ${name} ===`)
      console.log(nuxtApp.$threed(message)) // Prints "ThreeD: HEY HEY HEY" by default
    }
    // call composable function (test)
    // useMyComposable() // Prints "ThreeD: HEY HEY HEY" by default
    
    // =========================
    // ROUTE (PAGE: META, TITLE)
    // get current (page) route + route.meta.title
    const route = useRoute()
    // console.log("route", route)
    // console.log("route.meta", route.meta)
    const title = route.meta.title
    // console.log("title", route.meta.title)
    // =========================

    // DOM <head>
    useHead({
      title: `${title} - NuxtGarden`,
      // or, instead: ?? but why ??
      // titleTemplate: (x) => `${route.meta.title} - NuxtGarden`,
      viewport: "width=device-width, initial-scale=1, maximum-scale=1",
      charset: "utf-8",
      meta: [
        { name: "description", content: "ThreeD Garden on Nuxt Vue" },
        { name: "og:title", content: `NuxtGarden - ${title}` },
        { name: "og:description", content: "ThreeD Garden on Nuxt Vue" },
      ],
      bodyAttrs: {
        class: "threedgarden",
        // style: "max-width: 100%"
      }
    })

    // =========================
    // user authentication
    if (route.params.group === "admins" && !route.params.id) {
      console.error("Warning! User not authenticated!")
    }
    // =========================

    // setup() returns an object
    return {
      title,
      userStore,
      eventStore,
      uiStore,
      counterStore,
      useMyComposable
    }
  },
  methods: {
    useMyComposableMethod: (message = "HEY HEY HEY") => {
      const nuxtApp = useNuxtApp()
      // access runtime nuxt app instance
      // nuxtApp.use(UIDashboard)
      nuxtApp.provide("threed", (name) => `=== ThreeD: ${name} ===`)
      console.log(nuxtApp.$threed(message)) // Prints "ThreeD: HEY HEY HEY" by default
    },
    goAheadUseMyComposableMethod: async () => {
      console.log("GO AHEAD (METHODS)")
      // let meAwait = await this.useMyComposable("GO AHEAD (from METHODS)")
      // console.log("meAwait", meAwait)
      // this.useMyComposable("GO AHEAD (from METHODS)") // "this" is not defined
      // useMyComposable("GO AHEAD (from METHODS)") // is not defined
      // useMyComposableMethod("GO AHEAD (from METHODS)") // is not defined
      // this.useMyComposableMethod("GO AHEAD (from METHODS)") // "this" is not defined
    }
  },
  computed: {
    goAheadUseMyComposableComputed: () => {
      console.log("GO AHEAD (COMPUTED)")
      // this.useMyComposable("GO AHEAD (from COMPUTED)")
    }
  },
  mounted() {
    console.log("MOUNTED")
    this.goAheadUseMyComposableMethod()
    this.useMyComposableMethod()
    // this.goAheadUseMyComposableComputed() // is not a function
    return {
    }
  },
} // end export default
</script>
