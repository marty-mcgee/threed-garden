import { createStore } from "vuex"

export default createStore({
  state: {
    showGarden: true,
    isAnimated: true,
    showSidenav: true,
    sidenavColor: "success",
  },
  mutations: {

  },
  actions: {

  },
  getters: {
    showSidenav(state) { return state.showSidenav },
    sidenavColor(state) { return state.sidenavColor },
  }
})