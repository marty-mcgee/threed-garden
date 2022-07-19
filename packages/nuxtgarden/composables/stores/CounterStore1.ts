import { defineStore } from 'pinia'
import { ref } from 'vue'

// export const useCounterStore1 = defineStore('CounterStore1', () => {
  
//   const currentValue = ref(0)

//   return {
//     currentValue,
//   }
// })

export const useCounterStore1 = defineStore('CounterStore1', {
  state: () => ({ 
    count: 0 
  }),
  getters: {
    getCount: (state) => {
      console.log("Count:", state.count)
      return state.count
    },
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
  },
})
