import { defineStore } from "pinia"

export const useUserStore = defineStore("UserStore", {
  state: () => ({
    users: [],
    user: { 
      name: "juicemaster",
    },
  })
})