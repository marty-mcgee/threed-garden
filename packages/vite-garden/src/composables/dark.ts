// import { useDark, useToggle } from '@vueuse/core'
// these APIs are auto-imported from @vueuse/core
export const isDark = useDark(
  // {
  //   //selector: 'body',
  //   //attribute: 'color-scheme',
  //   valueDark: 'dark',
  //   valueLight: 'light'
  // }
)
export const toggleDark = useToggle(isDark)
