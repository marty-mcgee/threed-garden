import { defineNuxtPlugin } from "nuxt/app"
import { createPersistedStatePlugin } from "pinia-plugin-persistedstate-2"
import Cookies from "js-cookie"
import cookie from "cookie"

export default defineNuxtPlugin (({ $pinia, ssrContext }) => {
  $pinia.use(
    createPersistedStatePlugin({
      // plugin options goes here
      storage: {
        getItem: (key) => {
          // See https://nuxtjs.org/guide/plugins/#using-process-flags
          if (process.server) {
            const parsedCookies = cookie.parse(ssrContext.req.headers.cookie)
            return parsedCookies[key]
          } else {
            return Cookies.get(key)
          }
        },
        // see https://github.com/js-cookie/js-cookie#json, on how to handle JSON
        // for firefox warning for missing SameSite attribute,
        // see: https://github.com/js-cookie/js-cookie/issues/620
        setItem: (key, value) =>
          Cookies.set(key, value, { expires: 365, secure: false, sameSite: "lax" }),
        removeItem: (key) => Cookies.remove(key, { sameSite: "lax" }),
      },
    }),
  )
})
