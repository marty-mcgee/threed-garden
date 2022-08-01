import { defineStore } from 'pinia'

export const useUIStore = defineStore('UIStore', {
  state: () => ({
    name: "UI",
    uis: [],
    ui: {
      name: "ThreeD Garden",
      version: "1.0.0"
    },
    
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
    isDarkMode: true,
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
    getFinishedTodos: (state) => state.todos.filter((todo) => todo.isFinished),
    getUnfinishedTodos: (state) => state.todos.filter((todo) => !todo.isFinished),
    /**
     * @returns {{ text: string, id: number, isFinished: boolean }[]}
     */
    getFilteredTodos(state) {
      if (state.filter === 'finished') {
        // call other getters with autocompletion ✨
        return this.getFinishedTodos()
      } else if (state.filter === 'unfinished') {
        return this.getUnfinishedTodos()
      }
      return state.todos
    },

    // [MM] THREED GARDEN
    getName: (state) => state.name,
    getUIs: (state) => state.uis,
    getUI: (state) => state.ui,

    getShowGarden: (state) => state.showGarden,
    getIsAnimated: (state) => state.isAnimated,

    getIsLargeScreen: (state) => state.isLargeScreen,
    getIsDarkMode: (state) => state.isDarkMode,
    getIsRTL: (state) => state.isRTL,

    getShowSidenav: (state) => state.showSidenav,
    getSidenavColor: (state) => state.sidenavColor,
    getSidenavPinned: (state) => state.isPinned,
    getSidenavTransparent: (state) => state.isTransparent,
    getCardBackgroundMaskColor: (state) => `card-background-mask-${state.sidenavColor}`,
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
      this.state.isLargeScreen = !!this.state.isLargeScreen
    },
    setIsDarkMode({ commit }, payload) {
      // commit("SET_IS_DARK_MODE", !!payload)
      console.log("SET_IS_DARK_MODE")
      this.state.isDarkMode = !!this.state.isDarkMode
    },
    setShowSidenav({ commit }, payload) {
      // commit("SET_SHOW_SIDENAV", !!payload)
      console.log("SET_SHOW_SIDENAV")
      this.state.showSidenav = !!this.state.showSidenav
    },
    setIsSidenavPinned({ commit }, payload) {
      // commit("SET_SIDENAV_PINNED", !!payload)
      console.log("SET_IS_SIDENAV_PINNED")
      this.state.isSidenavPinned = !!this.state.isSidenavPinned
    },
    toggleIsSidenavPinned({ commit, state }) {
      // commit("SET_SIDENAV_PINNED", !state.isPinned)
      console.log("SET_IS_SIDENAV_PINNED")
      this.state.isSidenavPinned = !!this.state.isSidenavPinned
    },
  },
    
  // [MM] THREED GARDEN (vuex only)
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

// [MM] MULTIPLE STORES ???
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
