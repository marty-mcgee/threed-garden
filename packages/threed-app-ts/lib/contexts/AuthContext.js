// ==============================================================
// RESOURCES

// ** React
import { createContext, useEffect, useState } from 'react'

// ** Next
import { useRouter, useParams, useSearchParams } from 'next/navigation'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from '#/lib/config/auth'

// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug('🐻🐺 AuthContext: loading...')

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  isInitialized: false,
  login: ({ email, password }, fn) => Promise.resolve(),
  logout: () => Promise.resolve(),
  setIsInitialized: () => Boolean,
  register: ({ params, errorCallback }) => Promise.resolve(),
}

// ** The Context
const AuthContext = createContext(defaultProvider)

// ** The Provider of the Context
const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)
  const [isInitialized, setIsInitialized] = useState(defaultProvider.isInitialized)

  // ** Hooks
  const router = useRouter()
  // const queryParams = useParams()
  const searchParams = useSearchParams()

  useEffect(() => {
    const initAuth = async () => {

      setIsInitialized(true)

      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

      if (storedToken) {

        setLoading(true)

        await axios
          .get(authConfig.meEndpoint, {
            headers: {
              Authorization: storedToken,
            },
          })

          .then(async (response) => {
            setLoading(false)
            setUser({ ...response.data.userData })
          })

          .catch(() => {
            localStorage.removeItem('userData')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('accessToken')
            setUser(null)
            setLoading(false)
          })

      } else {
        setLoading(false)
      }
    }
    // run it
    initAuth()
  }, [])

  const handleLogin = (params, errorCallback) => {

    axios
      .post(authConfig.loginEndpoint, params)

      .then(async (res) => {
        window.localStorage.setItem(authConfig.storageTokenKeyName, res.data.accessToken)
      })

      .then(() => {

        axios
          .get(authConfig.meEndpoint, {
            headers: {
              Authorization: window.localStorage.getItem(authConfig.storageTokenKeyName),
            },
          })

          .then(async (response) => {
            // const returnUrl = router.query.returnUrl // Next 12
            // const returnUrl = queryParams.returnUrl // Next 13
            const returnUrl = searchParams.get('returnUrl') // Next 13
            setUser({ ...response.data.userData })
            await window.localStorage.setItem('userData', JSON.stringify(response.data.userData))
            const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
            // router.replace(redirectURL)
            router.push(redirectURL)
          })

      })

      .catch((err) => {
        console.debug('%c📛 ERROR', ccm.red, err)
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    setIsInitialized(false)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/auth/login')
  }

  const handleRegister = (params, errorCallback) => {

    axios
      .post(authConfig.registerEndpoint, params)

      .then((res) => {
        if (res.data.error) {
          if (errorCallback) errorCallback(res.data.error)
        } else {
          handleLogin({ email: params.email, password: params.password })
        }
      })

      .catch((err) => (errorCallback ? errorCallback(err) : null))
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    isInitialized,
    setIsInitialized,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
