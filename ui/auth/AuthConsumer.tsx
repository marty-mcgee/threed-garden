// ==============================================================
// RESOURCES
// ** Security Guard
// ** FOR ALL APP CONTEXTS !!!

'use client'

// ** React
import { useEffect } from 'react'

// ** Next
import { useRouter, usePathname } from 'next/navigation'

// ** Hooks
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// FUNCTIONS
// console.debug('%c🔱 AuthConsumer: loading...', ccm.orange)

// ** Function Component <React.FC> (returns JSX) for JS Module Export
const AuthConsumer = (props: any): JSX.Element => {

  const { children, fallback } = props
  // console.debug('%c🔱 AuthConsumer: props', ccm.yellow, props)
  // }

  useEffect(() => {

    const auth = useAuth()
    const router = useRouter()
    const pathname = usePathname() // router.asPath is now usePathname()
    const localStorageUserData = (typeof window !== 'undefined') ? window.localStorage.getItem('userData') : null
    // if (!auth.loading) {
      // console.debug('%c🔱 AuthConsumer: auth.loading?', ccm.yellow, auth.loading)
      // console.debug('%c🔱 AuthConsumer: auth', ccm.yellow, auth)
      // console.debug('%c🔱 AuthConsumer: router', ccm.yellow, router)
      // console.debug('%c🔱 AuthConsumer: pathname', ccm.yellow, pathname)

    // ** AuthConsumer
    if (auth.user) {
      console.debug('%c🔱 AuthConsumer: auth.user is', ccm.green, auth.user.role)
      // router.push('/auth/login')
      return <>{children}</>
    }
    else if (auth.user === null && !localStorageUserData) {
      console.debug('%c🔱 AuthConsumer: auth.user === null, no localStorageUserData', ccm.red)

      // if (router.asPath !== '/') {
      if (pathname !== '/') {
        // do nothing ?
        // router.replace({
        //   pathname: '/auth/login',
        //   query: { returnUrl: router.asPath },
        // })
        // router.push('/auth/login')
      }
      else {
        // do nothing ?
        // router.replace('/auth/login')
        // router.push('/auth/login')
      }

    }
    else if (auth.user === null && localStorageUserData) {
      // do nothing ?
      // console.debug('%c🔱 AuthConsumer: localStorageUserData exists (load? locate to?)', ccm.yellow, localStorageUserData)
      // router.replace('/')
      // router.push('/')
      return <>{children}</>
    }
    else {
      // do nothing ?
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

  }, []) // originally [router.route]

  // ** AuthConsumer
  // if (auth.loading || (!auth.loading && auth.user !== null)) {
  //   console.debug('%c🔱 <AuthConsumer>: <Spinner />', ccm.yellow)
  //   // return fallback // null // fallback
  // }

  // ** Return JSX
  // console.debug('%c🔱 AuthConsumer: return <jsx/>', ccm.green)
  // if (auth.user !== null && auth.user.role !== null) {
  //   return <>{children}</>
  // }
  // else {
  //   return <>HEY HEY HEY</>
  // }
  // else
  return null // <Spinner />
  return <>{children}</>
}

export default AuthConsumer
