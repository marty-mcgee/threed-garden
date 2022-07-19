import { defineStore } from "pinia"

export const useEventStore = defineStore( "EventStore", {
  state: () => ({
    events: [],
    event: { 
      name: "Garden Event",
    },
  }),
  getters: {
    getEvents: (state) => state.events,
    getEvent: (state) => state.event,
  },
  actions: {

  }
})

