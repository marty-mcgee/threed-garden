<template>
  <div id="APP">
    <!-- <h1>HEY HEY HEY</h1> -->
    <!-- <NuxtWelcome /> -->
    <!-- <Welcome /> -->
    <NuxtLayout cl>
      <template #header>
        <p class="m-1">
          {{ title }}
          | Logged in as {{ userStore.getUser.username }}
          | Event Name: {{ eventStore.getEvent.name }}
          | UI Name: {{ uiStore.getName }} - {{ uiStore.getUI.name }}
          | Counter: {{ counterStore.getCount }}
          <button @click="counterStore.increment()">+</button>
          <button @click="counterStore.decrement()">-</button>
        </p>
        <p><hr></p>
      </template>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
// import UIDashboard from "@/assets/js/ui-dashboard"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore } from "./composables/stores/CounterStore"

export default {
  setup() {
    // state stores
    const userStore = useUserStore()
    const eventStore = useEventStore()
    const uiStore = useUIStore()
    const counterStore = useCounterStore()

    // USENUXTAPP
    // function useMyComposable () {
    //   const nuxtApp = useNuxtApp()
    //   // access runtime nuxt app instance
    //   nuxtApp.use(UIDashboard)
    // }
    // useMyComposable()

    const nuxtApp = useNuxtApp()
    nuxtApp.provide("hello", (name) => `Hello ${name}!`)
    console.log(nuxtApp.$hello("Garden")) // Prints "Hello Garden!"


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
        { name: "og:title", content: `NuxtGarden - ${title}` },
        { name: "og:description", content: "ThreeD Garden on Nuxt Vue" },
      ],
      bodyAttrs: {
        class: "threedgarden",
        // style: "max-width: 100%"
      }
    })

    // user authentication
    if (route.params.group === "admins" && !route.params.id) {
      console.error("Warning! User not authenticated!")
    }

    // setup() returns an object
    return {
      title,
      userStore,
      eventStore,
      uiStore,
      counterStore,
    }
  }
} // end export default
</script>
