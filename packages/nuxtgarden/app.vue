<template>
  <div id="APP">
    <!-- <h1>HEY HEY HEY</h1> -->
    <!-- <NuxtWelcome /> -->
    <!-- <Welcome /> -->
    <!-- <button type="button" @click="counterStore1.currentValue++">
      count is: {{ counterStore1.currentValue }}
    </button> -->
    <p>
      Logged in as {{ userStore.user.name }}
      | Event Name: {{ eventStore.event.name }}
      | UI Name: {{ uiStore.name }}
      | Counter: {{ counterStore1.count }}
    </p>
    <p><hr/></p>
    <NuxtLayout cl>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
// import UIDashboard from "@/assets/js/ui-dashboard"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore1 } from "./composables/stores/CounterStore1"

export default {
  setup() {
    // state stores
    const userStore = useUserStore()
    const eventStore = useEventStore()
    const uiStore = useUIStore()
    const counterStore1 = useCounterStore1()

    // USENUXTAPP
    // function useMyComposable () {
    //   const nuxtApp = useNuxtApp()
    //   // access runtime nuxt app instance
    //   nuxtApp.use(UIDashboard)
    // }
    // useMyComposable()

    const nuxtApp = useNuxtApp()
    nuxtApp.provide("hello", (name) => `Hello ${name}!`)
    console.log(nuxtApp.$hello("helper")) // Prints "Hello helper!"


    // get current (page) route + route.meta.title
    const route = useRoute()
    // console.log("route", route)
    // console.log("route.meta", route.meta)
    const title = route.meta.title
    // console.log("title", route.meta.title)

    // DOM <head>
    useHead({
      title: `${title} - NuxtGarden`,
      // or, instead: ?? but why ??
      // titleTemplate: (x) => `${route.meta.title} - NuxtGarden`,
      viewport: "width=device-width, initial-scale=1, maximum-scale=1",
      charset: "utf-8",
      meta: [
        { name: "description", content: "ThreeD Garden on Nuxt Vue" },
        { name: "og:title", content: `NuxtGarden - ${title}` }
      ],
      bodyAttrs: {
        class: "threedgarden",
        // style: "max-width: 100%"
      }
    })

    // user authentication
    if (route.params.group === "admins" && !route.params.id) {
      console.log("Warning! User not authenticated!")
    }

    // setup() returns an object
    return {
      userStore,
      eventStore,
      uiStore,
      counterStore1,
    }
  }
} // end export default
</script>
