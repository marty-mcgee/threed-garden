import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter-store', () => {
  
  const currentValue = ref(0)

  return {
    currentValue,
  }
})
