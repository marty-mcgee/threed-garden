'use client'
// ==============================================================
// RESOURCES

// ** React
// import { useEffect } from 'react'

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
console.debug('%c🔱 AuthGuard: loading...', ccm.orange)

// ** Function Component <React.FC> (returns JSX) for JS Module Export
const AuthGuard = (props: any) => {

  const { children, fallback } = props
  // console.debug('%c🔱 AuthGuard: props', ccm.yellow, props)

  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname() // router.asPath is now usePathname()
  const localStorageUserData = (typeof window !== 'undefined') ? window.localStorage.getItem('userData') : null
  // if (!auth.loading) {
    // console.debug('%c🔱 AuthGuard: auth.loading?', ccm.yellow, auth.loading)
    // console.debug('%c🔱 AuthGuard: auth', ccm.yellow, auth)
    // console.debug('%c🔱 AuthGuard: router', ccm.yellow, router)
    // console.debug('%c🔱 AuthGuard: pathname', ccm.yellow, pathname)
  // }

  // useEffect(() => {

    // ** AuthGuard
    if (auth.user === null && !localStorageUserData) {
      console.debug('%c🔱 AuthGuard: auth.user === null, no localStorageUserData', ccm.yellow)

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
        // router.replace('/auth/login')
        // router.push('/auth/login')
      }

    }
    else if (auth.user === null && localStorageUserData) {
      // do nothing ?
      // console.debug('%c🔱 AuthGuard: localStorageUserData exists (load? locate to?)', ccm.yellow, localStorageUserData)
      // router.replace('/')
      // router.push('/')
    }
    else {
      console.debug('%c🔱 AuthGuard: auth.user is', ccm.green, auth.user.role)
      // do nothing
      // router.replace('/auth/login')
      // router.push('/auth/login')
    }

    // ** GuestGuard
    // if (localStorageUserData) {
    //   console.debug('%c⚜ GuestGuard: localStorageUserData: locate to /')
    //   router.replace('/')
    // }
    // else {
    //   console.debug('%c⚜ GuestGuard localStorageUserData?: locate to /auth/login', auth)
    //   router.replace('/auth/login')
    // }

  // }, [pathname]) // originally [router.route]

  // ** AuthGuard
  // if (auth.loading || (!auth.loading && auth.user !== null)) {
  //   console.debug('%c🔱 <AuthGuard>: <Spinner />', ccm.yellow)
  //   // return fallback // null // fallback
  // }

  // ** Return JSX
  // console.debug('%c🔱 AuthGuard: return <jsx/>', ccm.green)
  if (auth.user !== null && auth.user.role !== null) {
    return <>{children}</>
  }
  // else
  return <Spinner />
}

export default AuthGuard
