import { createStore } from "vuex"

export default createStore({
  state: {
    showGarden: true,
    isAnimated: true,

    isLargeScreen: true,
    isDarkMode: false,
    isRTL: false,
    showSidenav: true,
    sidenavColor: "success",
    isPinned: true,

    isNavFixed: false,

    isSidebarMini: false,

    hideConfigButton: false,

    isTransparent: true,

    showConfig: false,

    isAbsolute: false,

    showNavs: true,

    showNavbar: true,

    showFooter: true,

    showMain: true,
    
  },
  mutations: {
    SET_IS_LARGE_SCREEN(state, payload) {
      state.isLargeScreen = !!payload
    },
    SET_DARK_MODE(state, payload) {
      state.isDarkMode = !!payload
    },
    SET_SHOW_SIDENAV(state, payload) {
      console.log("SET_SHOW_SIDENAV", payload)
      state.showSidenav = !!payload
    },
    SET_SIDENAV_PINNED(state, payload) {
      state.isPinned = !!payload
    },
  },
  actions: {
    setIsLargeScreen({ commit }, payload) {
      commit("SET_IS_LARGE_SCREEN", !!payload)
    },
    setDarkMode({ commit }, payload) {
      commit("SET_DARK_MODE", !!payload)
    },
    setShowSidenav({ commit }, payload) {
      commit("SET_SHOW_SIDENAV", !!payload)
    },
    setSidenavPinned({ commit }, payload) {
      commit("SET_SIDENAV_PINNED", !!payload)
    },
    toggleSidenavPinned({ commit, state }) {
      commit("SET_SIDENAV_PINNED", !state.isPinned)
    },
  },
  getters: {
    showGarden(state) { return state.showGarden },
    isAnimated(state) { return state.isAnimated },

    isLargeScreen(state) { return state.isLargeScreen },
    darkMode(state) { return state.isDarkMode },
    isRTL(state) { return state.isRTL },

    showSidenav(state) { return state.showSidenav },
    sidenavColor(state) { return state.sidenavColor },
    sidenavPinned(state) { return state.isPinned },
    sidenavTransparent(state) { return state.isTransparent },
    cardBackgroundMaskColor(state) { 
      return `card-background-mask-${state.sidenavColor}` 
    },
  }
})