<template>
  <footer class="py-5 footer">
    <div class="container">
      <div class="row">
        <div class="mx-auto mb-4 text-center col-lg-8">
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            Home
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            About
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            Team: Participate
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            Products
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            Blog
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            Pricing
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="mb-2 text-secondary me-xl-5 me-3 mb-sm-0"
          >
            Contact
          </a>
        </div>
        <div class="mx-auto mt-2 mb-4 text-center col-lg-8">
          <a
            href="javascript:;"
            target="_blank"
            class="text-secondary me-xl-4 me-4"
          >
            <span class="text-lg fab fa-dribbble"></span>
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="text-secondary me-xl-4 me-4"
          >
            <span class="text-lg fab fa-twitter"></span>
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="text-secondary me-xl-4 me-4"
          >
            <span class="text-lg fab fa-instagram"></span>
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="text-secondary me-xl-4 me-4"
          >
            <span class="text-lg fab fa-pinterest"></span>
          </a>
          <a
            href="javascript:;"
            target="_blank"
            class="text-secondary me-xl-4 me-4"
          >
            <span class="text-lg fab fa-github"></span>
          </a>
        </div>
      </div>
      <div class="row">
        <div class="mx-auto mt-1 text-center col-8">
          <p class="mb-0 text-secondary">
            Copyright © {{ new Date().getFullYear() }} Marty McGee, Company Juice.
          </p>
        </div>
      </div>
    </div>
  </footer>

  <div id="MMFOOTER">
    <!-- <LogoGarden /> -->
    <NuxtLink to="/">
      ThreeD Garden
    </NuxtLink>
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
  </div>
</template>

<script lang="ts">
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore } from "@/composables/stores/CounterStore"

export default {
  name: "PageLayoutFooter",
  components: {
    
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