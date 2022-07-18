import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui-store', {
  state: () => ({
    /** @type {{ text: string, id: number, isFinished: boolean }[]} */
    todos: [],
    /** @type {'all' | 'finished' | 'unfinished'} */
    filter: 'all',
    // type will be automatically inferred to number
    nextId: 0,

    // [MM] THREED GARDEN
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
  }),
  getters: {
    finishedTodos(state) {
      // autocompletion! ✨
      return state.todos.filter((todo) => todo.isFinished)
    },
    unfinishedTodos(state) {
      return state.todos.filter((todo) => !todo.isFinished)
    },
    /**
     * @returns {{ text: string, id: number, isFinished: boolean }[]}
     */
    filteredTodos(state) {
      if (this.filter === 'finished') {
        // call other getters with autocompletion ✨
        return this.finishedTodos
      } else if (this.filter === 'unfinished') {
        return this.unfinishedTodos
      }
      return this.todos
    },

    // [MM] THREED GARDEN
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
  },
  actions: {
    // any amount of arguments, return a promise or not
    addTodo(text) {
      // you can directly mutate the state
      this.todos.push({ text, id: this.nextId++, isFinished: false })
    },

    // [MM] THREED GARDEN
    setIsLargeScreen({ commit }, payload) {
      // commit("SET_IS_LARGE_SCREEN", !!payload)
      console.log("SET_IS_LARGE_SCREEN")
    },
    setDarkMode({ commit }, payload) {
      // commit("SET_DARK_MODE", !!payload)
      console.log("SET_DARK_MODE")
    },
    setShowSidenav({ commit }, payload) {
      // commit("SET_SHOW_SIDENAV", !!payload)
      console.log("SET_SHOW_SIDENAV")
    },
    setSidenavPinned({ commit }, payload) {
      // commit("SET_SIDENAV_PINNED", !!payload)
      console.log("SET_SIDENAV_PINNED")
    },
    toggleSidenavPinned({ commit, state }) {
      // commit("SET_SIDENAV_PINNED", !state.isPinned)
      console.log("SET_SIDENAV_PINNED")
    },
  },
    
  // [MM] THREED GARDEN
  /*
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
  */
})

// [MM] MULTIPLE STORES
/*
const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})

const useUserStore = defineStore('user', {
  // ...
})

export default {
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useCounterStore, useUserStore),
    // gives read access to this.count and this.double
    ...mapState(useCounterStore, ['count', 'double']),
  },
  methods: {
    // gives access to this.increment()
    ...mapActions(useCounterStore, ['increment']),
  },
}
*/
