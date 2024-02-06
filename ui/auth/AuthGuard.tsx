// ==============================================================
// RESOURCES
// ** Security Guard
// ** FOR ALL APP CONTEXTS !!!

'use client'

// ** React
import { useEffect } from 'react'

// ** Next
import { useRouter, usePathname } from 'next/navigation'

// ** Hook into Context for User Authorization
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// FUNCTIONS
// console.debug('%c🔱 AuthGuard: loading...', ccm.orange)

// ** Function Component <React.FC> (returns JSX) for JS Module Export
const AuthGuard = ({ children }: any) => {

  // const { children, fallback } = props
  // console.debug('%c🔱 AuthGuard: props', ccm.yellow, props)

  const auth = useAuth()

  const router = useRouter()
  const pathname = usePathname() // router.asPath is now usePathname()

  const localStorageUserData = (typeof window !== 'undefined')
    ? window.localStorage.getItem('userData')
    : null
  // console.debug('%c🔱 AuthGuard: auth', ccm.yellow, auth)
  // console.debug('%c🔱 AuthGuard: router', ccm.yellow, router)
  // console.debug('%c🔱 AuthGuard: pathname', ccm.yellow, pathname)

  useEffect(() => {

    // ** AuthGuard
    if (auth.user) {
      // console.debug('%c🔱 AuthGuard: auth.user is', ccm.green, auth.user.role)
      // router.push('/auth/login')
      router.push('/home')
      return
    }
    /*
    if (auth.user === null && !localStorageUserData) {
      console.debug('%c🔱 AuthGuard: auth.user === null, no localStorageUserData', ccm.red)

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

      // router.push('/auth/login')

    }
    else if (auth.user === null && localStorageUserData) {
      // do nothing ?
      console.debug('%c🔱 AuthGuard: localStorageUserData exists (load? locate to?)', ccm.yellow, localStorageUserData)
      // router.replace('/')
      // router.push('/')
      return <>{children}</>
    }
    else {
      // do nothing ?
      // router.replace('/auth/login')
      // router.push('/auth/login')
    }
    */
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

  // ** AuthGuard
  // if (auth.loading || (!auth.loading && auth.user !== null)) {
  //   console.debug('%c🔱 <AuthGuard>: <Spinner />', ccm.yellow)
  //   // return fallback // null // fallback
  // }

  // ** Return JSX
  // console.debug('%c🔱 AuthGuard: return <jsx/>', ccm.green)
  // if (auth.user !== null && auth.user.role !== null) {
  //   return <>{children}</>
  // }
  // else {
  //   return <>HEY HEY HEY</>
  // }
  // else

  // router.push('/auth/login')
  // return null
  // return <h1>HEY HEY HEY: AuthGuard</h1>
  // return <Spinner />
  return <>{children}</>
}

export default AuthGuard
