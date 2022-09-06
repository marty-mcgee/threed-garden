import { defineStore } from "pinia"

export const useUserStore = defineStore("UserStore", {
  state: () => ({
    users: [],
    user: { 
      username: "juicemaster",
      firstName: "Juice",
      lastName: "Master",
      email: "mcgee.marty@gmail.com",
      phone: "+17079801136",
    },
  }),
  getters: {
    getUsers: (state) => state.users,
    getUser: (state) => state.user,
  },
  actions: {

  }
})