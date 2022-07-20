<template>
  <div id="MMFOOTER">
    <hr class="m-1">
    <footer class="py-2 footer">
      <div class="container-fluid">
        <div class="row align-items-center justify-content-lg-between">
          <div class="mb-4 col-lg-6 mb-lg-0">
            <div
              class="text-sm text-center copyright text-muted text-lg-start"
            >
              © {{ new Date().getFullYear() }} 
              ThreeD Garden, running on 
              <a
                href="https://companyjuice.com"
                class="font-weight-normal"
                target="_blank"
              >
                Company Juice
              </a>.
              <i class="fa fa-heart"></i>
              <icon-xmark style="font-size: 2em; color: blue" />
              <icon-account-box style="font-size: 2em; color: red" />
              <tasty-pizza style="font-size: 2em" />
              <icon-ps style="font-size: 2em" />
            </div>
          </div>
          <div class="col-lg-6 nav nav-footer justify-content-center justify-content-lg-end">
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
            <!-- 
            <ul
              class="nav nav-footer justify-content-center justify-content-lg-end"
            >
              <li class="nav-item">
                <a
                  href="https://companyjuice.com"
                  class="nav-link text-muted"
                  target="_blank"
                  >Company Juice</a
                >
              </li>
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com/presentation"
                  class="nav-link text-muted"
                  target="_blank"
                  >About Us</a
                >
              </li>
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com/blog"
                  class="nav-link text-muted"
                  target="_blank"
                  >Blog</a
                >
              </li>
              <li class="nav-item">
                <a
                  href="https://www.creative-tim.com/license"
                  class="nav-link pe-0 text-muted"
                  target="_blank"
                  >License</a
                >
              </li>
            </ul>
            -->
          </div>
        </div>
      </div>
    </footer>
    <span class="m-1 position-absolute end-0">
      User: {{ userStore.getUser.username }}
      | Route: {{ title }}
      | UI: {{ uiStore.getUI.name }}
      | Event: {{ eventStore.getEvent.name }}
      | Counter: {{ counterStore.getCount }}
      <button @click="counterStore.increment()">+</button>
      <button @click="counterStore.decrement()">-</button>
    </span>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "@/composables/stores/UserStore"
import { useEventStore } from "@/composables/stores/EventStore"
import { useUIStore } from "@/composables/stores/UIStore"
import { useCounterStore } from "@/composables/stores/CounterStore"

import IconXmark from '~icons/fa6-solid/xmark'
import IconAccountBox from '~icons/mdi/account-box'
import TastyPizza from '~icons/noto-v1/pizza'
import IconPs from '~icons/ri/playstation-line'

export default {
  name: "PageLayoutFooter",
  components: {
    IconXmark,
    IconAccountBox,
    TastyPizza,
    IconPs,
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
<!-- 
<script setup>
import IconXmark from '~icons/fa6-solid/xmark'
import IconAccountBox from '~icons/mdi/account-box'
import TastyPizza from '~icons/noto-v1/pizza'
import IconPs from '~icons/ri/playstation-line'
</script>

<template>
  <icon-xmark style="font-size: 2em; color: blue" />
  <icon-account-box style="font-size: 2em; color: red" />
  <tasty-pizza style="font-size: 2em" />
  <icon-ps style="font-size: 2em" />
</template>
-->