// ** React
import { useEffect } from 'react'

// ** Next
import { useRouter } from 'next/navigation'

// ** Hooks
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

const AuthGuard = (props) => {

  const { children, fallback } = props
  console.debug('AuthGuard props', props)

  const auth = useAuth()
  const router = useRouter()

  // console.debug('AuthGuard: router', router)
  // console.debug('AuthGuard: router.isReady', router.isReady)
  console.debug('AuthGuard: router.asPath', router.asPath)

  useEffect(() => {

    // if (!router.isReady) {
    //   console.debug('AuthGuard: router not isReady')
    //   return
    // }

    // ** AuthGuard
    if (auth.user === null && !window.localStorage.getItem('userData')) {
      console.debug('AuthGuard auth.user === null')

      if (router.asPath !== '/') {
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
      console.debug('GuestGuard: window.localStorage.getItem("userData"): locate to /')
      router.replace('/')
    }
    else {
      console.debug('AuthGuard: auth.user is true ???', auth)
      // do nothing
      // router.replace('/auth/login')
    }

    // ** GuestGuard
    // if (window.localStorage.getItem('userData')) {
    //   console.debug('GuestGuard: window.localStorage.getItem("userData"): locate to /')
    //   router.replace('/')
    // }
    // else {
    //   console.debug('GuestGuard window.localStorage.getItem("userData")?: locate to /auth/login', auth)
    //   router.replace('/auth/login')
    // }

  }, [router.route]) // router.route

  // ** AuthGuard
  if (auth.loading || auth.user !== null) {
    console.debug('<AuthGuard>: <Spinner />')
    return null // fallback // <>AuthGuard: fallback</> // <Spinner /> // fallback
  }
  // ** GuestGuard
  // if (auth.loading || (!auth.loading && auth.user !== null)) {
  //   console.debug('<GuestGuard>: <Spinner />')
  //   return fallback // <>GuestGuard: fallback</> // <Spinner /> // fallback
  // }

  // ** Return JSX
  console.debug('AuthGuard: Return JSX')
  return <>{children}</>
}

export default AuthGuard
