// ==============================================================
// RESOURCES

// 'use client'

// ** React
import { useEffect } from 'react'

// ** Next
import { useRouter, usePathname } from 'next/navigation'

// ** Hooks
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Components
import Spinner from '#/ui/components/spinner'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// FUNCTIONS
console.debug('%c🔱 AuthGuard: loading...', ccm.yellow)

// ** Function Component <React.FC> (returns JSX) for JS Module Export
const AuthGuard = (props: any) => {

  const { children, fallback } = props
  console.debug('%c🔱 AuthGuard: props', ccm.yellow, props)

  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname() // router.asPath is now usePathname()

  // if (!auth.loading) {
    console.debug('%c🔱 AuthGuard: auth.loading?', ccm.yellow, auth.loading)
    console.debug('%c🔱 AuthGuard: auth', ccm.yellow, auth)
    console.debug('%c🔱 AuthGuard: router', ccm.yellow, router)
    console.debug('%c🔱 AuthGuard: pathname', ccm.yellow, pathname)
  // }

  useEffect(() => {

    // ** AuthGuard
    if (auth.user === null && !window.localStorage.getItem('userData')) {
      console.debug('%c🔱 AuthGuard: auth.user === null', ccm.yellow)

      // if (router.asPath !== '/') {
      if (pathname !== '/') {
        // do nothing ?
        // router.replace({
        //   pathname: '/auth/login',
        //   query: { returnUrl: router.asPath },
        // })
      }
      else {
        // do nothing ?
        router.replace('/auth/login')
      }

    }
    else if (window.localStorage.getItem('userData')) {
      // do nothing ?
      console.debug('%c⚜ GuestGuard: window.localStorage.getItem("userData"): locate to /', ccm.yellow)
      router.replace('/')
    }
    else {
      console.debug('%c🔱 AuthGuard: auth.user is true ???', ccm.yellow, auth)
      // do nothing
      // router.replace('/auth/login')
    }

    // ** GuestGuard
    // if (window.localStorage.getItem('userData')) {
    //   console.debug('%c⚜ GuestGuard: window.localStorage.getItem("userData"): locate to /')
    //   router.replace('/')
    // }
    // else {
    //   console.debug('%c⚜ GuestGuard window.localStorage.getItem("userData")?: locate to /auth/login', auth)
    //   router.replace('/auth/login')
    // }

  }, []) // originally [router.route]

  // ** AuthGuard
  if (auth.loading || auth.user !== null) {
    console.debug('%c🔱 <AuthGuard>: <Spinner />', ccm.yellow)
    // return null // fallback
  }
  // ** GuestGuard
  // if (auth.loading || (!auth.loading && auth.user !== null)) {
  //   console.debug('%c⚜ <GuestGuard>: <Spinner />', ccm.yellow)
  //   return null // fallback
  // }

  // ** Return JSX
  console.debug('%c🔱 AuthGuard: Return JSX', ccm.yellow)
  return <>{children}</>
}

export default AuthGuard
