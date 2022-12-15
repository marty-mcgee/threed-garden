// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/navigation'

// ** Hooks Import
import { useAuth } from '#/lib/auth/hooks/useAuth'

const GuestGuard = (props) => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!router.isReady) {
      return
    }
    if (window.localStorage.getItem('userData')) {
      router.replace('/')
    }
  }, [router.route])
  if (auth.loading || (!auth.loading && auth.user !== null)) {
    return fallback
  }

  return <>{children}</>
}

export default GuestGuard
