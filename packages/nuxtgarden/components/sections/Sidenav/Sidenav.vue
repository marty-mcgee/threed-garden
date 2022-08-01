<template>
  <aside
    id="sidenav-main"
    :data-color="uiStore.sidenavColor"
    class="sidenav navbar navbar-vertical navbar-expand-xs overflow-auto my-3 border-0 border-radius-xl"
    :class="uiStore.isRTL ? 'me-3 rotate-caret' : 'ms-3'"
  >
    <div class="sidenav-header">
      <i
        id="iconSidenav"
        class="fas fa-times cursor-pointer text-secondary opacity-5 position-absolute top-0 end-0 d-none d-xl-none p-3"
        aria-hidden="true"
      ></i>
      <NuxtLink class="m-0 navbar-brand" :to="{ name: 'index' }">
        <img :src="logo" class="navbar-brand-img" alt="sidenav_logo" />
        <span class="ms-1 font-weight-bold">{{ title }}</span>
      </NuxtLink>
    </div>
    <hr class="mt-0 horizontal dark" />
    <sidenav-list :card-bg="customClass" />
  </aside>
</template>

<script>
// import { mapGetters } from "vuex" // pinia | vuex
import SidenavList from "@/components/sections/sidenav/SidenavList.vue"
import logo from "@/assets/img/logos/logo-threedgarden-alt.png"

// state store (singletons) // pinia | vuex
import { useUIStore } from "@/composables/stores/UIStore"

export default {
  name: "Sidenav",
  components: {
    SidenavList,
    // uiStore
  },
  props: {
    customClass: { type: String, default: "" },
  },
  setup() {
    const uiStore = useUIStore()
    return {
      uiStore,
      logo,
      title: "ThreeD Garden",
      color: "success",
    }
  },
  // data() {
  //   return {
  //     logo,
  //     title: "ThreeD Garden",
  //     color: "success",
  //   }
  // },
  computed: {
    // ...mapGetters(["sidenavColor"]),
  },
  mounted() {

  },
}
</script>
