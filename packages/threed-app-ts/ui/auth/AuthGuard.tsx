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

// ==============================================================
// FUNCTIONS
console.debug('🔱 AuthGuard: loading...')

// ** Function Component <React.FC> (returns JSX) for JS Module Export
const AuthGuard = (props: any) => {

  const { children, fallback } = props
  console.debug('🔱 AuthGuard: props', props)

  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname() // router.asPath is now usePathname()

  // if (!auth.loading) {
    console.debug('🔱 AuthGuard: auth.loading?', auth.loading)
    console.debug('🔱 AuthGuard: auth', auth)
    console.debug('🔱 AuthGuard: router', router)
    console.debug('🔱 AuthGuard: pathname', pathname)
  // }

  useEffect(() => {

    // ** AuthGuard
    if (auth.user === null && !window.localStorage.getItem('userData')) {
      console.debug('🔱 AuthGuard: auth.user === null')

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
      console.debug('🔱 GuestGuard: window.localStorage.getItem("userData"): locate to /')
      router.replace('/')
    }
    else {
      console.debug('🔱 AuthGuard: auth.user is true ???', auth)
      // do nothing
      // router.replace('/auth/login')
    }

    // ** GuestGuard
    // if (window.localStorage.getItem('userData')) {
    //   console.debug('🔱 GuestGuard: window.localStorage.getItem("userData"): locate to /')
    //   router.replace('/')
    // }
    // else {
    //   console.debug('🔱 GuestGuard window.localStorage.getItem("userData")?: locate to /auth/login', auth)
    //   router.replace('/auth/login')
    // }

  }, []) // originally [router.route]

  // ** AuthGuard
  if (auth.loading || auth.user !== null) {
    // console.debug('🔱 <AuthGuard>: <Spinner />')
    return null // fallback
  }
  // ** GuestGuard
  // if (auth.loading || (!auth.loading && auth.user !== null)) {
  //   console.debug('🔱 <GuestGuard>: <Spinner />')
  //   return null // fallback
  // }

  // ** Return JSX
  console.debug('🔱 AuthGuard: Return JSX')
  return <>{children}</>
}

export default AuthGuard
