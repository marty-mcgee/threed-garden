<template>
  <div id="MMDASHBOARD">
    <header class="m-1">
      <slot name="header">
        <LogoGarden />
        <!-- *dashboard* layout: header -->
        |<NuxtLink to="/about">
          About
        </NuxtLink>
        |<NuxtLink to="/participate">
          Participate
        </NuxtLink>
        |<NuxtLink to="/pinia">
          Pinia
        </NuxtLink>
        <span class="m-1 position-absolute end-0">
          User: {{ userStore.getUser.username }}
          | Route: {{ title }}
          | UI: {{ uiStore.getUI.name }}
          | Event: {{ eventStore.getEvent.name }}
          | Counter: {{ counterStore.getCount }}
          <button @click="counterStore.increment()">+</button>
          <button @click="counterStore.decrement()">-</button>
        </span>
        <hr class="m-1">
      </slot>
    </header>
    <!-- 
    <sidenav 
      v-if="showSidenav"
      :custom_class="cardBackgroundMaskColor"
      :class="[
        sidenavBackgroundClass,
        $store.state.isRTL ? 'fixed-end' : 'fixed-start',
      ]"
    /> 
    -->
    <main 
      id="main" 
      class="main-content border-radius-lg"
    >
      <slot name="main">
        <!-- DASHBOARD -->
        <SmartHome />
      </slot>
    </main>
    <footer>
      <slot name="footer">
        *dashboard* layout: footer
      </slot>
    </footer>
  </div>
</template>

<script lang="ts">
import SmartHome from "@/components/dashboards/SmartHome.vue"
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore } from "@/composables/stores/CounterStore"

export default {
  name: "LayoutDashboard",
  components: {
    SmartHome
  },
  setup() {
    // state stores
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