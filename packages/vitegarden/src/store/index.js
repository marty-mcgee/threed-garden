import { createStore } from "vuex"

export default createStore({
  state: {
    showGarden: true,
    isAnimated: true,
    showSidenav: true,
    sidenavColor: "success",
    isRTL: false,
  },
  mutations: {

  },
  actions: {

  },
  getters: {
    showGarden(state) { return state.showGarden },
    isAnimated(state) { return state.isAnimated },
    showSidenav(state) { return state.showSidenav },
    sidenavColor(state) { return state.sidenavColor },
    isRTL(state) { return state.isRTL },
  }
})