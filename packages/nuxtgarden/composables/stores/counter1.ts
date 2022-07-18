import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore1 = defineStore('counter-store-1', () => {
  
  const currentValue = ref(0)

  return {
    currentValue,
  }
})
