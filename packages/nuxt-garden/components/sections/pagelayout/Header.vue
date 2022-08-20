<template>
  <!-- page layout: header -->
  <div id="MMHEADER">
    <LogoGarden />
    |<NuxtLink to="/about">
      About
    </NuxtLink>
    |<NuxtLink to="/participate">
      Participate
    </NuxtLink>
    |<NuxtLink to="/pinia">
      Pinia
    </NuxtLink>
    |<NuxtLink to="/editor">
      Editor
    </NuxtLink>
    <span class="m-1 position-absolute end-0">
      User: {{ userStore.getUser.username }}
      | Route: {{ title }}
      <!-- | UI: {{ uiStore.getUI.name }}
      | Event: {{ eventStore.getEvent.name }} -->
      | $<!-- Counter -->: {{ counterStore.getCount }}
      <button @click="counterStore.increment()">+</button>
      <button @click="counterStore.decrement()">-</button>
    </span>
    <hr class="m-1">
  </div>
</template>

<script>
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore } from "@/composables/stores/CounterStore"

export default {
  name: "PageLayoutHeader",
  components: {
    
  },
  setup() {
    // state stores (singletons)
    const userStore = useUserStore()
    const eventStore = useEventStore()
    const uiStore = useUIStore()
    const counterStore = useCounterStore()

    // get current (page) route + route.meta.title
    const route = useRoute()
    // console.log("route", route)
    // console.log("route.meta", route.meta)
    const title = route.meta.title
    // console.log("title", route.meta.title)

    // user authentication
    if (route.params.group === "admins" && !route.params.id) {
      console.error("Warning! User not authenticated!")
    }

    // setup() returns an object{}
    return {
      // meta
      title,
      // singletons
      userStore,
      eventStore,
      uiStore,
      counterStore,
    }
  }
} // end export default
</script>
